"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * 只动 opacity。filter 和 transform 都会为后代的 position:fixed 创建包含块，
 * 一旦用上，全站的雨幕、闪电、点击脉冲、toast 就会跟着页面滚动而不是钉在视口。
 */
export default function Template({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return <>{children}</>;

  return (
    <motion.div
      // 淡入期间 opacity<1 会生成层叠上下文，不定位的话内容会被画到
      // 定位的气候层之下，跳转瞬间被背景吞掉
      className="relative z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
