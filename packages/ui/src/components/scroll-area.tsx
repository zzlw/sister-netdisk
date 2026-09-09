"use client";

import { overlayScrollbarOptions } from "@repo/ui/lib/overlayscrollbars";
import { cn } from "@repo/ui/lib/utils";
import {
  OverlayScrollbarsComponent,
  type OverlayScrollbarsComponentProps,
} from "overlayscrollbars-react";

type ScrollAreaProps = OverlayScrollbarsComponentProps;

/** 区域内滚动。页面滚动走 BodyScrollbars，不要再写 overflow-auto 靠原生条。 */
export function ScrollArea({
  className,
  children,
  options,
  defer = true,
  ...props
}: ScrollAreaProps) {
  return (
    <OverlayScrollbarsComponent
      data-slot="scroll-area"
      defer={defer}
      options={options ?? overlayScrollbarOptions}
      className={cn("min-h-0", className)}
      {...props}
    >
      {children}
    </OverlayScrollbarsComponent>
  );
}

/** 兼容 shadcn ScrollBar 用法；滑块由 OverlayScrollbars 绘制。 */
export function ScrollBar(_props: {
  orientation?: "vertical" | "horizontal";
  className?: string;
}) {
  return null;
}
