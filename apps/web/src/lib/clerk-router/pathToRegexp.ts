export interface PathMatch {
  path: string;
  params: Record<string, string>;
  isExact: boolean;
  url: string;
}

export function compilePath(path: string): RegExp {
  if (path === "*") return /.*/;

  const pattern = path
    .replace(/\/+$/, "")
    .replace(/:(\w+)/g, "(?<$1>[^/]+)")
    .replace(/\*/g, ".*");

  return new RegExp(`^${pattern}(?:/)?$`);
}

export function matchPath(pathname: string, path: string): PathMatch | null {
  if (path === "*" || path === undefined) {
    return {
      path: pathname,
      params: {},
      isExact: true,
      url: pathname,
    };
  }

  const regex = compilePath(path);
  const match = regex.exec(pathname);

  if (!match) return null;

  const url = match[0];
  const params = match.groups || {};
  const isExact = pathname === url;

  return {
    path, // the pattern
    params,
    isExact,
    url, // the matched portion
  };
}
