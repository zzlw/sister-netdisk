import { z } from "zod";

export const diskProviders = [
  "baidu",
  "aliyun",
  "quark",
  "tianyi",
  "115",
  "uc",
  "123",
  "xunlei",
  "pikpak",
  "weiyun",
  "lanzou",
  "mobile",
  "guangya",
  "other",
] as const;

export const diskProviderSchema = z.enum(diskProviders);
export type DiskProvider = z.infer<typeof diskProviderSchema>;

export const diskProviderLabels: Record<DiskProvider, string> = {
  baidu: "百度网盘",
  aliyun: "阿里云盘",
  quark: "夸克网盘",
  tianyi: "天翼云盘",
  "115": "115 网盘",
  uc: "UC 网盘",
  "123": "123 云盘",
  xunlei: "迅雷云盘",
  pikpak: "PikPak",
  weiyun: "腾讯微云",
  lanzou: "蓝奏云",
  mobile: "移动云盘",
  guangya: "光鸭云盘",
  other: "其他",
};
