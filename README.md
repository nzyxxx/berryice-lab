# BerryIce Lab

[https://berryice.cn](https://berryice.cn) 是小莓流冰（BerryIce）的个人站。首页是雨夜。导航通向四处：三角洲工具专栏、写作、知识库、关于。

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
- `WIKI_ADMIN_TOKEN`
- `WIKI_CONTENT_DIR`（可选。不设就用仓库里的 `content/wiki`）
- `DATABASE_URL`
- `CRON_SECRET`
- `DELTA_STATS_BASE_URL`
- `DELTA_STATS_API_KEY`
- `DEEPSEEK_API_KEY`（小莓对话的主钥匙。只放服务器环境，不要加 `NEXT_PUBLIC_`，页面、接口和日志里都不会出现这把钥匙）
- `DEEPSEEK_API_KEY_2`（可选备用。主钥匙遇到 401、429 或 5xx 时换这一把再试一次。单独配备用、不配主钥匙，对话仍然是 503）
- `DEEPSEEK_BASE_URL`（可选，默认 `https://api.deepseek.com`）
- `DEEPSEEK_MODEL`（可选，默认 `deepseek-chat`）
- `XIAO_MEI_CHAT_DISABLED`（设为 `1` 时关掉对话，不再请求上游）
- `XIAO_MEI_DAILY_TOKEN_BUDGET`（可选。单机内存里的每日 token 软上限，用完返回 503）

右下角的小莓要聊天时，浏览器只请求同源的 `POST /api/xiaomei/chat`。服务器再用上面的钥匙去调 DeepSeek 的 OpenAI 兼容接口。这台机器是 2 vCPU / 2 GiB，不要在上面跑本地模型，浏览器也不要直接请求 `api.deepseek.com`。

没配主钥匙，或 `XIAO_MEI_CHAT_DISABLED=1`，接口返回 503，不会出站。每人（按 IP，另加一个 HttpOnly cookie）大约每分钟 20 次、每天 100 次，超出返回 429。请求体大约限制在 24KB，一轮只留最近 8 个来回，模型输出封顶 180 token。

站长看接没接上：已有管理口令（`ADMIN_TOKEN` 会话或 `WIKI_ADMIN_TOKEN`）时打开 `GET /api/xiaomei/status`，或页面 `/admin/xiaomei`。返回里只有「已配置 / 未配置」、模型名和主机名，没有钥匙，也没有地方粘贴钥匙。

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

## 知识库

线上列表：[https://berryice.cn/wiki](https://berryice.cn/wiki)。单篇是 `https://berryice.cn/wiki/<slug>`，slug 等于文件名去掉 `.md`。

笔记放在 `content/wiki/*.md`。页面每次请求读磁盘（`Cache-Control: no-store`），所以新笔记不用等重新构建。站点地图最多大约一小时才跟上新 slug，页面本身是立刻的。读是公开的。收录和删除要口令。

本机在 `.env.local`（已被 gitignore）里写一行，然后重启 `yarn dev`：

```bash
WIKI_ADMIN_TOKEN=换成一段足够长的随机字符串
```

线上把同一个值配进 berryice-lab 的环境变量，不要写进仓库，也不要放进 `NEXT_PUBLIC_*`。没配的时候，下面两个接口都是 401。

手机上：打开一篇笔记或列表，点「删除」。第一次会要口令，存在这台浏览器里，之后只需要再确认一次。确认后服务器删掉对应的 `.md`，列表里就没有了。

**Bear 收录走 ingest，不走 git push。** Webhook「收录到知识库」写完一篇笔记后，立刻 POST 全文。同一 slug 再推一次会覆盖，两次都应当当成成功。

```bash
# 单篇。slug、文件路径按实际笔记改。口令只放环境变量。
export WIKI_ADMIN_TOKEN=...
export WIKI_SITE=https://berryice.cn
node --input-type=module <<'EOF'
import { readFile } from "node:fs/promises";

const slug = process.env.WIKI_SLUG;
const file = process.env.WIKI_FILE;
const site = (process.env.WIKI_SITE ?? "https://berryice.cn").replace(/\/$/, "");
const token = process.env.WIKI_ADMIN_TOKEN;
if (!slug || !file || !token) {
  console.error("需要 WIKI_ADMIN_TOKEN、WIKI_SLUG、WIKI_FILE");
  process.exit(1);
}
const markdown = await readFile(file, "utf8");
const response = await fetch(`${site}/api/wiki/ingest`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ slug, markdown }),
});
const body = await response.text();
console.log(response.status, body);
if (!response.ok) process.exit(1);
EOF
```

调用前另开两个环境变量：`WIKI_SLUG`（文件名去掉 `.md`）、`WIKI_FILE`（笔记绝对路径）。

批量补录用仓库里的脚本，打到同一条 API：

```bash
WIKI_ADMIN_TOKEN=... node scripts/sync-wiki.mjs --ingest \
  --dir /home/box/agent-data/agents/57b68b5d-5ab1-4f26-818c-0285babd5b22/wiki/notes \
  --site https://berryice.cn
```

不加 `--ingest` 时，脚本只把 `.md` 复制进 `content/wiki`（或 `--out`）。那是落仓库的备用路径，Bear 的日常收录不要等这条。

slug 只允许字母、数字、`.`、`_`、`-`，最长 120，不能含 `..`，也不能叫 `ingest`（这条路径是收录接口）。正文是 JSON 字符串字段 `markdown`，上限 20 万字。

| 接口 | 作用 | 成功时 |
|------|------|--------|
| `POST /api/wiki/ingest` | 写入或覆盖 `{ slug, markdown }` | `{ ok: true, slug, title, created }` |
| `DELETE /api/wiki/<slug>` | 删除该篇文件 | `{ ok: true, slug, deleted }` |

`created` / `deleted` 为 `false` 表示文件本来就在 / 本来就没有，仍然是成功。口令不对是 `401`，`{ ok: false, message: "未授权" }`。

从 Bear 那边删一篇，同样带口令：

```bash
curl -fsS -X DELETE \
  -H "Authorization: Bearer $WIKI_ADMIN_TOKEN" \
  https://berryice.cn/api/wiki/20261027-douyin-grok-bot-fleet-architecture
```

发布脚本会 `git pull`。接口写进去、还没提交的笔记是未跟踪文件，pull 不会清掉。不要对 `content/wiki` 执行 `git reset --hard`。想让线上增删和仓库完全分开，设置 `WIKI_CONTENT_DIR` 到仓库外的目录，再用上面的 ingest 灌一次。

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
