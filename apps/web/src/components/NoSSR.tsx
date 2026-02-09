"use client";

import { useSyncExternalStore } from "react";

// 公共组件：仅在客户端渲染，避免 SSR 报错
export const NoSSR = ({ children }: { children: React.ReactNode }) => {
  const isClient = useSyncExternalStore(
    () => () => {}, // 订阅函数，无实际作用
    () => true, // 客户端返回 true
    () => false, // 服务端返回 false
  );
  return <>{isClient ? children : null}</>;
};
