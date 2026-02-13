import type { Locale } from "../config";
import { en } from "./en";
import { type Translations, zhCN } from "./zh-CN";

export const localeMessages = {
  "zh-CN": zhCN,
  en: en,
} as const satisfies Record<Locale, Translations>;

export { en } from "./en";
/**
 * Locale exports
 */
export { type Translations, zhCN } from "./zh-CN";
