#!/usr/bin/env bash
# 线上发布：拉代码 → 装依赖 → 构建 → 重启 Node。
# 在服务器项目目录执行：bash scripts/deploy.sh
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

echo "==> 目录 $ROOT"
echo "==> 发布前 $(git log -1 --oneline)"

# 服务器上这两份 lockfile 经常被 yarn/npm 互相改脏，挡住 pull。
# 只回滚 lockfile，不动 .env 和其他未跟踪文件。
git checkout -- yarn.lock package-lock.json 2>/dev/null || true

git pull origin master

echo "==> 发布目标 $(git log -1 --oneline)"

if command -v yarn >/dev/null 2>&1; then
  echo "==> yarn install"
  yarn install
  echo "==> yarn build（等到路由表打完再走）"
  yarn build
else
  echo "==> npm install"
  npm install
  echo "==> npm run build（等到路由表打完再走）"
  npm run build
fi

restarted=0

if command -v pm2 >/dev/null 2>&1; then
  name="$(basename "$ROOT")"
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
