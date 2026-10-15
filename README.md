# BerryIce Lab

[https://berryice.cn](https://berryice.cn) 是 BerryIce 的个人站。门户通向三处：三角洲改枪实验室（枪械库、社区枪码、主播配装、我的枪码）、写作、关于。

## 技术栈

- Next.js 16.4（App Router）+ React 19 + TypeScript
- Tailwind CSS 4
- Yarn 1.22（见 `package.json` 的 `packageManager`）。不要再提交 `package-lock.json`
- 数据库：MySQL 或 Postgres，由 `DATABASE_URL` 决定
- 线上：自建 nginx + 宝塔 Node 项目，2 vCPU / 约 1.6 GiB 内存

## 环境变量

只列名字。值放在本机或服务器的 `.env`，不要写进仓库。

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SITE_NAME`
- `NEXT_PUBLIC_SITE_TAGLINE`
- `NEXT_PUBLIC_DISPLAY_NAME`
- `NEXT_PUBLIC_HANDLE`
- `NEXT_PUBLIC_BIO`
- `NEXT_PUBLIC_AVATAR_URL`
- `NEXT_PUBLIC_AVATAR_INITIALS`
- `NEXT_PUBLIC_ICP_NUMBER`
- `NEXT_PUBLIC_ICP_URL`
- `NEXT_PUBLIC_POLICE_ICP`
- `NEXT_PUBLIC_POLICE_ICP_URL`
- `NEXT_PUBLIC_SOCIAL_GITHUB`
- `NEXT_PUBLIC_SOCIAL_REPO`
- `NEXT_PUBLIC_SOCIAL_KOOK`
- `NEXT_PUBLIC_SOCIAL_X`
- `NEXT_PUBLIC_SOCIAL_BILIBILI`
- `NEXT_PUBLIC_CONTACT_EMAIL`
- `DATABASE_URL`
- `CRON_SECRET`
- `DELTA_STATS_BASE_URL`
- `DELTA_STATS_API_KEY`

发布脚本会自己设置 `SKIP_TYPECHECK`、`NEXT_TELEMETRY_DISABLED`、`NODE_OPTIONS`，不用手填。本机强行跑发布脚本时才用 `FORCE`。

## 本地开发

```bash
yarn install --frozen-lockfile
yarn dev
```

打开 [http://localhost:3000](http://localhost:3000)。

枪械数据不经过 HTTP，在仓库里直接跑：

```bash
yarn sync:weapons
```

## 发布

在服务器上执行，不要在开发机上跑：

```bash
cd /www/wwwroot/berryice-lab && bash scripts/deploy.sh
```

机器内存紧，脚本按低内存构建：跳过 tsc、单个静态生成 worker、Node 堆上限 768MB。堆不要调回 1024，否则整机会进 Swap。

构建结束后，脚本如果找到对应的 pm2 进程会重启它。找不到就去宝塔 → Node 项目 → berryice-lab → 重启。脚本同时清掉 nginx 代理缓存。用无痕窗口打开站点验收。

## 定时刷新

下面这些写接口必须带口令，未配置 `CRON_SECRET` 时一律 401：

- `POST /api/weapons/refresh`
- `POST /api/gun-codes/refresh`
- `POST /api/streamers/refresh`
- `GET /api/cron/gun-codes`
- `GET /api/cron/streamers`

只接受请求头 `x-cron-secret`，不要把密钥放在 `?secret=` 里（会进访问日志）。

```bash
curl -fsS -H "x-cron-secret: $CRON_SECRET" https://berryice.cn/api/cron/gun-codes
curl -fsS -X POST -H "x-cron-secret: $CRON_SECRET" https://berryice.cn/api/weapons/refresh
```
