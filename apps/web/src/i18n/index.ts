/**
 * i18n exports
 */

// Core
export {
  defaultLocale,
  LOCALE_COOKIE_NAME,
  type Locale,
  localeNames,
  locales,
} from "./config";
// Hooks
export {
  type TypedTranslations,
  useT,
  useTypedTranslations,
} from "./hooks/useTypedTranslations";
// Locales
export { en, localeMessages, type Translations, zhCN } from "./locales";

// Types
export type { Path, PathValue } from "./types";
export type { DeepProxy } from "./utils/pathBuilder";
