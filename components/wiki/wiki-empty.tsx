/** 没有笔记时说实话。不摆占位文章，也不用一块玻璃卡片把空白框起来。 */
export function WikiEmpty() {
  return (
    <div className="mt-16 border-t border-lab-hairline pt-10">
      <p className="text-lg font-medium tracking-tight text-lab-ink">知识库还是空的</p>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-lab-ink-subtle">
        收录进来的笔记会出现在这里。没有的时候就空着，不摆占位文章。
      </p>
    </div>
  );
}
