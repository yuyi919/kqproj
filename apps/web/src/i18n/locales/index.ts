import type { Locale } from "../config";
import { type Translations, zhCN } from "./zh-CN";
import { en } from "./en";

export const localeMessages = {
  "zh-CN": zhCN,
  en: en,
} as const satisfies Record<Locale, Translations>;

/**
 * Locale exports
 */
export { zhCN, type Translations } from "./zh-CN";
export { en } from "./en";
