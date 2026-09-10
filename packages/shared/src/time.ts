/** 上游缺时间时常给 Go 零值或 epoch。这种不算真实分享时间。 */
export function hasShareTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  const t = date.getTime();
  return Number.isFinite(t) && t > 0 && date.getUTCFullYear() >= 1970;
}

/** 库里存 UTC ISO，界面按上海时区展示。 */
export function formatShanghai(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
