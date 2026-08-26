#!/usr/bin/env bash
# 线上发布，按 ≤4G 经济型 ECS 来配：不跑 tsc、单 worker、限制 Node 堆。
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
if [[ -r /proc/meminfo ]]; then
  mem_total_mb=$(($(awk '/MemTotal:/ {print $2}' /proc/meminfo) / 1024))
  mem_avail_mb=$(($(awk '/MemAvailable:/ {print $2}' /proc/meminfo) / 1024))
fi

# 给 nginx / 数据库 / 正在跑的站点留余量，禁止 Node 把物理内存吃光
if (( mem_total_mb > 0 && mem_total_mb <= 2500 )); then
  heap_mb=1024
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
  echo
  echo "可用内存不足 700MB。构建会和正在跑的站点抢内存。"
  echo "先去宝塔 → Node 项目 → 停止，再重新执行本脚本。"
  exit 1
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
