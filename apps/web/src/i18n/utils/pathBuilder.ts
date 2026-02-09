/**
 * Proxy-based path builder for type-safe translation paths
 *
 * Usage:
 *   const t = useTypedTranslations();
 *   t.path.pages.login.title() // Returns translated string directly!
 *   t.path.pages.login.title({ foo: 'bar' }) // With options
 */

export type DeepProxy<T> = {
  [K in keyof T]: T[K] extends object
    ? DeepProxy<T[K]> & ((options?: Record<string, any>) => string)
    : (options?: Record<string, any>) => string;
} & ((options?: Record<string, any>) => string);

export function createPathBuilder<T extends Record<string, any>>(
  translateFn: (path: string, options?: Record<string, any>) => string,
): DeepProxy<T> {
  function buildProxy(path: string[] = []): any {
    const handler = {
      get(_target: any, prop: string | symbol) {
        if (typeof prop === "string") {
          return buildProxy([...path, prop]);
        }
        return undefined;
      },
      apply(_target: any, _thisArg: any, args: any[]) {
        const pathString = path.join(".");
        const options = args[0];
        return translateFn(pathString, options);
      },
    };

    // Create a function that can be called to get the translation
    const proxyFn = function (options?: Record<string, any>) {
      const pathString = path.join(".");
      return translateFn(pathString, options);
    };

    return new Proxy(proxyFn, handler);
  }

  return buildProxy() as DeepProxy<T>;
}
