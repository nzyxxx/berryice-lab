# BerryIce Lab

小莓流冰（BerryIce）的个人站：写作、关于，以及一个三角洲工具专栏。包管理器是 **Yarn 1.22.22**（`package.json` 的 `packageManager`）。不要再提交 `package-lock.json`。

## 本地

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

线上是 2 vCPU / 2 GiB，用 nginx + pm2，按 `scripts/deploy.sh` 发布，不是 Vercel。脚本只认 yarn：`yarn install --frozen-lockfile` 然后 `yarn build`。

## 定时刷新

下面这些写接口必须带口令，未配置 `CRON_SECRET` 时一律 401：

- `POST /api/weapons/refresh`
- `POST /api/gun-codes/refresh`
- `POST /api/streamers/refresh`
- `GET /api/cron/gun-codes`
- `GET /api/cron/streamers`

在服务器的项目 `.env` 或 pm2 环境里设置 `CRON_SECRET`（长随机串），改完重启进程。只接受请求头 `x-cron-secret`，不要再把密钥放在 `?secret=` 里（会进访问日志）。页面上的「同步」按钮已去掉，浏览器不能带这个口令。

```bash
curl -fsS -H "x-cron-secret: $CRON_SECRET" https://berryice.cn/api/cron/gun-codes
curl -fsS -X POST -H "x-cron-secret: $CRON_SECRET" https://berryice.cn/api/weapons/refresh
```
