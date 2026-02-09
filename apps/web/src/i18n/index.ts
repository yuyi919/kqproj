/**
 * i18n exports
 */

// Core
export {
  locales,
  defaultLocale,
  localeNames,
  LOCALE_COOKIE_NAME,
  type Locale,
} from "./config";

// Locales
export { zhCN, en, localeMessages, type Translations } from "./locales";

// Hooks
export {
  useTypedTranslations,
  useT,
  type TypedTranslations,
} from "./hooks/useTypedTranslations";

// Types
export type { Path, PathValue } from "./types";
export type { DeepProxy } from "./utils/pathBuilder";
