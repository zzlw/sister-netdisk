import { z } from "zod";

export const diskProviderSchema = z.enum([
  "baidu",
  "aliyun",
  "quark",
  "tianyi",
  "weiyun",
  "xunlei",
  "lanzou",
  "other",
]);
export type DiskProvider = z.infer<typeof diskProviderSchema>;

export const diskProviderLabels: Record<DiskProvider, string> = {
  baidu: "百度网盘",
  aliyun: "阿里云盘",
  quark: "夸克网盘",
  tianyi: "天翼云盘",
  weiyun: "腾讯微云",
  xunlei: "迅雷云盘",
  lanzou: "蓝奏云",
  other: "其他",
};
