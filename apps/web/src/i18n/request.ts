import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, LOCALE_COOKIE_NAME, locales } from "./config";
import { localeMessages } from "./locales";

export default getRequestConfig(async () => {
  // Get locale from cookie
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LOCALE_COOKIE_NAME);

  // Determine locale: cookie > default
  let locale = localeCookie?.value || defaultLocale;

  // Validate locale
  if (!locales.includes(locale as any)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: localeMessages[locale as keyof typeof localeMessages],
  };
});
