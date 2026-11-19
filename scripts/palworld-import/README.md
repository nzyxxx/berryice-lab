这里只保留 v5。上一版按 32px 小图标写的正文和 payload 已经从本目录拿掉，不要再拿去导入。

两篇的 slug 没变：

- `20261119-palworld-party-and-base`
- `20261119-palworld-passive-traits`

导入仍走现有 `POST /api/games/knowledge`，一次一篇。请求体就是对应 JSON，不要再包一层，也不要把 `.md` 整文件送进去。口令用站点已有的收录口令，不写在这些文件里。

- `scripts/palworld-import/payloads/20261119-palworld-party-and-base.json`
- `scripts/palworld-import/payloads/20261119-palworld-passive-traits.json`

两份都是 `gameId: palworld`、`kind: guide`、`publish: true`。没有 `season`、`sourceLabel`、`sourceHref`。

交接稿把首段同时放进 `summary` 和 `body`。接口会先把 summary 写在「这条讲什么」下面，再把整个 body 接上去，页面上首段会出现两次。所以这里的 `summary` 留空，`body` 与同名 `.md` 去掉第一行标题后逐字相同。写入后接口自己从正文首段取出摘要，页面只出现一次。

正文只把图片改到 `/palworld/guides-v5-20261119/`。标题、五档、事实、图文顺序和文末那一行参考引用都没改。不要把研究过程或旧稿说明补回去。

20 张 JPG 在 `public/palworld/guides-v5-20261119/`。旧的 `public/palworld/guides-20261119/` 78 张图留着，这篇不引用它们。

不要把这两篇放进三角洲或未归类。
