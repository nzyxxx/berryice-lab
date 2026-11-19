这两份正文只用于发布时导入，不在 content/wiki 里，构建不会把它们收进现有笔记。

导入走现有 `POST /api/games/knowledge`。请求头带上站点已有的收录口令，口令不写在这些文件里。一次一篇，请求体就是对应的 JSON，不要再包一层。

- `scripts/palworld-import/payloads/20261119-palworld-party-and-base.json`
- `scripts/palworld-import/payloads/20261119-palworld-passive-traits.json`

两份都写明 `gameId: palworld`、`kind: guide`、`publish: true`。`publish: true` 才会公开。缺省会落成草稿，公开页看不到。

`body` 从第一段正文起。同目录的 `.md` 第一行是标题，只给对照，不要整文件再送一遍。标题、游戏、类别已经在 JSON 字段里，正文里没有重复。

原文没有单独的版本号，也没有一条可以当作整篇来源的链接。来源写在正文末尾的「来源」一节。所以 JSON 里没有 `season`、`sourceLabel`、`sourceHref`。不要补「未知」或编一条来源。

不要把这两篇放进三角洲或未归类。`gameId` 写成目录外的名字会被拒绝。
