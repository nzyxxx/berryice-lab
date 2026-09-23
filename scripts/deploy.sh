#!/usr/bin/env bash
# 线上发布，按 2 vCPU / 2 GiB 来配（系统里 MemTotal 大约 1.6 GiB）。
# 不跑 tsc、单 worker、Node 堆 768MB。堆给到 1024 会把整机挤进 Swap。
# 在服务器执行：
#   cd /www/wwwroot/berryice-lab && bash scripts/deploy.sh
#   或：bash deploy.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ "$(uname -s)" == "Darwin" && "${FORCE:-}" != "1" ]]; then
  echo "这是线上发布脚本，不要在本机跑。"
  echo "登服务器后：cd /www/wwwroot/berryice-lab && bash scripts/deploy.sh"
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "当前目录不是 git 仓库：$ROOT"
  exit 1
fi

mem_total_mb=0
mem_avail_mb=0
swap_free_mb=0
if [[ -r /proc/meminfo ]]; then
  mem_total_mb=$(($(awk '/MemTotal:/ {print $2}' /proc/meminfo) / 1024))
  mem_avail_mb=$(($(awk '/MemAvailable:/ {print $2}' /proc/meminfo) / 1024))
  swap_free_mb=$(($(awk '/SwapFree:/ {print $2}' /proc/meminfo) / 1024))
fi

# 2 GiB 规格在系统里通常只看到约 1.6 GiB。堆给 1024 时，
# Node 一家就占掉三分之二物理内存，nginx 和正在服务的站点只能走 Swap，
# 两颗核都花在换页上，构建和访问一起变慢。768 让峰值落到 Swap，底座还在内存里。
if (( mem_total_mb > 0 && mem_total_mb <= 2200 )); then
  heap_mb=768
elif (( mem_total_mb <= 4096 )); then
  heap_mb=1536
else
  heap_mb=2048
fi

export SKIP_TYPECHECK=1
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="${NODE_OPTIONS:-} --max-old-space-size=${heap_mb}"

echo "==> 目录 $ROOT"
echo "==> 内存 ${mem_avail_mb}MB 可用 / ${mem_total_mb}MB 总量，Node 堆上限 ${heap_mb}MB"
echo "==> 发布前 $(git log -1 --oneline)"

if (( mem_avail_mb > 0 && mem_avail_mb < 700 )); then
  # 1.6GB 的机器开着站点时，可用内存到不了 700MB。
  # 有足够 Swap 就继续：构建会变慢，但不会再因为内存直接退出。
  # 没有 Swap 时继续跑，内核会把 next build 直接 OOM 杀掉。
  if (( swap_free_mb < 1500 )); then
    echo
    echo "可用内存 ${mem_avail_mb}MB，Swap 空闲 ${swap_free_mb}MB，不够构建。"
    echo "先加一块 2GB Swap，再重新执行本脚本："
    echo "  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile"
    echo "  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab"
    exit 1
  fi
  echo "==> 可用内存只有 ${mem_avail_mb}MB，使用 ${swap_free_mb}MB Swap 继续。构建会比本机慢。"
fi

# 只回滚 lockfile，不动 .env 和其他未跟踪文件
git checkout -- yarn.lock package-lock.json 2>/dev/null || true
git pull origin master
echo "==> 发布目标 $(git log -1 --oneline)"

if command -v yarn >/dev/null 2>&1; then
  echo "==> yarn install --frozen-lockfile"
  yarn install --frozen-lockfile
  echo "==> yarn build（跳过 tsc、单 worker，等到路由表打完）"
  yarn build
else
  echo "==> npm ci"
  npm ci
  echo "==> npm run build（跳过 tsc、单 worker，等到路由表打完）"
  npm run build
fi

restarted=0
name="$(basename "$ROOT")"

if command -v pm2 >/dev/null 2>&1; then
  if pm2 describe "$name" >/dev/null 2>&1; then
    echo "==> pm2 restart $name"
    pm2 restart "$name"
    restarted=1
  elif pm2 describe berryice-lab >/dev/null 2>&1; then
    echo "==> pm2 restart berryice-lab"
    pm2 restart berryice-lab
    restarted=1
  fi
fi

if [[ -d /www/server/nginx/proxy_cache_dir ]]; then
  echo "==> 清 nginx 代理缓存"
  rm -rf /www/server/nginx/proxy_cache_dir/* || true
  nginx -s reload 2>/dev/null || true
fi

if [[ "$restarted" -eq 0 ]]; then
  echo
  echo "构建完成，但没找到可自动重启的进程。"
  echo "去宝塔 → Node 项目 → berryice-lab → 重启，然后用无痕窗口打开站点。"
  exit 0
fi

echo
echo "发布完成：$(git log -1 --oneline)"
echo "用无痕窗口打开 https://berryice.cn/delta-gun/streamers 验收，不再 404 才算成功。"
