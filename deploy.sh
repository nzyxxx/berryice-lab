#!/usr/bin/env bash
# 入口转发，避免在项目根目录敲 bash deploy.sh 找不到文件
exec "$(cd "$(dirname "$0")" && pwd)/scripts/deploy.sh" "$@"
