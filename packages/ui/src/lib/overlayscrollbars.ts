import {
  ClickScrollPlugin,
  OverlayScrollbars,
  type PartialOptions,
} from "overlayscrollbars";

OverlayScrollbars.plugin(ClickScrollPlugin);

/** 页面与区域内滚动共用。主题类在 globals.css 的 `.os-theme-zinc`。 */
export const overlayScrollbarOptions = {
  overflow: {
    x: "scroll",
    y: "scroll",
  },
  scrollbars: {
    theme: "os-theme-zinc",
    visibility: "auto",
    autoHide: "leave",
    autoHideDelay: 800,
    autoHideSuspend: true,
    clickScroll: true,
  },
} satisfies PartialOptions;
