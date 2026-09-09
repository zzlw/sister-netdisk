/** 从点击处圆形铺开切主题。没有 View Transitions API 时直接改。 */
export function startThemeTransition(
  apply: () => void,
  origin?: { clientX: number; clientY: number },
) {
  const start = document.startViewTransition?.bind(document);
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (!start || reduceMotion) {
    apply();
    return;
  }
  if (origin) {
    const root = document.documentElement;
    root.style.setProperty("--theme-x", `${origin.clientX}px`);
    root.style.setProperty("--theme-y", `${origin.clientY}px`);
  }
  start(apply);
}
