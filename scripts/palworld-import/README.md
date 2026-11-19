这两份正文只用于发布时导入，不在 content/wiki 里，构建不会把它们收进现有笔记。

导入时走现有 POST /api/games/knowledge，不要另写一套。字段：

- slug: 20261119-palworld-party-and-base / 20261119-palworld-passive-traits
- gameId: palworld（或标题「幻兽帕鲁」）
- kind: guide
- title: 文件第一行去掉「# 」
- body: 从第一段正文起，不要把「# 标题」再送一遍
- publish: true

网站草稿 website-adapted 没有写「状态: 公开」。接口用 publish: true 才会公开。不要把这两篇放进三角洲或未归类。
