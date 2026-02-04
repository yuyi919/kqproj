import { createServerClient, type CookieMethods } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "./constants";
import type { SupabaseClient } from "./client";
import { CrudFilter, CrudFilters } from "@refinedev/core";

/**
 * 从 Cookie 字符串中解析出键值对对象
 * @param cookieHeader - Cookie 字符串 (来自请求头)
 */
export function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  decodeURIComponent(cookieHeader)
    .split(";")
    .forEach((cookie) => {
      const [name, ...rest] = cookie.split("=");
      const value = rest.join("=").trim();
      if (!name) return;
      cookies[name.trim()] = value;
    });
  return cookies;
}

/**
 * 封装 createServerClient，自动注入 SUPABASE_URL 和 SUPABASE_KEY
 * @param cookies - Cookie 操作方法
 */
export function createSupabaseClient(cookies: CookieMethods) {
  return /*#__PURE__*/ createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies,
  }) as unknown as SupabaseClient;
}

export function serlizeFilter(filters?: CrudFilters): string {
  return filters
    ?.map((filter): string | undefined => {
      if (filter && "field" in filter && "operator" in filter) {
        return `${filter.field}=${mapOperator(filter.operator)}.${filter.value}`;
      }
      return undefined;
    })
    .filter(Boolean)
    .join(",") || "*";
}

const mapOperator = (operator: CrudFilter["operator"]) => {
  switch (operator) {
    case "ne":
      return "neq";
    case "nin":
      return "not.in";
    case "contains":
      return "ilike";
    case "ncontains":
      return "not.ilike";
    case "containss":
      return "like";
    case "ncontainss":
      return "not.like";
    case "null":
      return "is";
    case "nnull":
      return "not.is";
    case "ina":
      return "cs";
    case "nina":
      return "not.cs";
    default:
      return operator;
  }
};

export const applyPostgrestFilter = (filter: any, query: any) => {
  const { field, operator, value } = filter;

  switch (operator) {
    case "eq":
      return query.eq(field, value);
    case "ne":
      return query.neq(field, value);
    case "lt":
      return query.lt(field, value);
    case "gt":
      return query.gt(field, value);
    case "lte":
      return query.lte(field, value);
    case "gte":
      return query.gte(field, value);
    case "contains":
      return query.contains(field, value);
    case "containedBy":
      return query.containedBy(field, value);
    case "range":
      return query.range(value[0], value[1]);
    case "isnull":
    case "null":
      return query.is(field, null);
    case "isnotnull":
    case "notnull":
      return query.not(field, "is", null);
    case "in":
      return query.in(field, value);
    case "between":
      return query.gte(field, value[0]).lte(field, value[1]);
    case "startsWith":
      return query.ilike(field, `${value}%`);
    case "endsWith":
      return query.ilike(field, `%${value}`);
    default:
      return query;
  }
};