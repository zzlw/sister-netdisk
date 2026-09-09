"use client";

import { overlayScrollbarOptions } from "@repo/ui/lib/overlayscrollbars";
import { useOverlayScrollbars } from "overlayscrollbars-react";
import { useEffect } from "react";

/** 挂在 document.body。不要用 OverlayScrollbarsComponent 包整页，否则 Next 路由滚回顶部会失效。 */
export function BodyScrollbars() {
  const [initialize] = useOverlayScrollbars({
    defer: true,
    options: overlayScrollbarOptions,
  });

  useEffect(() => {
    initialize({
      target: document.body,
      cancel: {
        body: false,
        nativeScrollbarsOverlaid: false,
      },
    });
  }, [initialize]);

  return null;
}
