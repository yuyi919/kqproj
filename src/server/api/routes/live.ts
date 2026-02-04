import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import type { ApiVariables } from "../middleware/supabase";

// --- Utils ---

const mapOperator = (operator: string) => {
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

const mapFilter = (filters?: any[]): string | undefined => {
  if (!filters || filters.length === 0) {
    return undefined;
  }

  return filters
    .map((filter: any): string | undefined => {
      if (filter && "field" in filter && "operator" in filter) {
        return `${filter.field}=${mapOperator(filter.operator)}.${filter.value}`;
      }
      return undefined;
    })
    .filter(Boolean)
    .join(",");
};

const applyPostgrestFilter = (filter: any, query: any) => {
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

/**
 * Supabase Realtime 包装路由 (SSE 方案)
 * 支持断点续传 (Catch-up) 逻辑
 */
export const live = /*#__PURE__*/ new Hono<{ Variables: ApiVariables }>().get(
  "/subscribe",
  zValidator(
    "query",
    z.object({
      resource: z.string(),
      types: z.string().optional(), // 逗号分隔: created,updated,deleted
      params: z.string().optional(), // JSON 序列化的 CrudFilters 等
      last_id: z.string().optional(), // 用于断点续传的 ID 或时间戳
    }),
  ),
  async (c) => {
    const {
      resource,
      types,
      params,
      last_id: queryLastId,
    } = c.req.valid("query");
    const last_id = queryLastId || c.req.header("Last-Event-ID");
    const supabase = c.var.supabase;

    const parsedTypes = types ? types.split(",") : ["*"];
    const parsedParams = params ? JSON.parse(params) : {};
    const filters = (parsedParams.filters as any[] | undefined) || [];

    // 如果 params 中有 ids，将其转换为 in 过滤器
    if (parsedParams.ids && parsedParams.ids.length > 0) {
      filters.push({
        field: "id",
        operator: "in",
        value: parsedParams.ids,
      });
    }

    const realtimeFilter = mapFilter(filters);
    const channelName = `${resource}:${Math.random().toString(36).substring(2)}`;
    // const channelName = `${resource}:${parsedTypes.join("|")}${realtimeFilter ? `:${realtimeFilter}` : ""}`;
    let channel: ReturnType<typeof supabase.channel> | undefined = undefined;
    return streamSSE(
      c,
      async (stream) => {
        // 1. 断点续传逻辑 (Catch-up)
        if (last_id) {
          const client = parsedParams.meta?.schema
            ? supabase.schema(parsedParams.meta.schema)
            : supabase;

          let query = client.from(resource).select("*");

          // 应用业务过滤条件
          if (filters) {
            filters.forEach((f) => {
              query = applyPostgrestFilter(f, query);
            });
          }

          // 启发式判断 last_id 类型：数字视为 ID，其他视为 ISO 时间戳
          if (!isNaN(Number(last_id))) {
            query = query.gt("id", Number(last_id));
          } else {
            query = query.gt("created_at", last_id);
          }

          const { data: missedData } = await query.order("created_at", {
            ascending: true,
          });

          if (missedData && missedData.length > 0) {
            for (const item of missedData) {
              await stream.writeSSE({
                data: JSON.stringify({
                  eventType: "INSERT",
                  new: item,
                  commit_timestamp: item.created_at || new Date().toISOString(),
                }),
                event: "message",
                id: String(item.id || Date.now()),
              });
            }
          }
        }

        // 2. 实时订阅
        console.log("channelName", {
          channelName,
          last_id,
          parsedTypes,
          user: (await supabase.auth.getUser()).data.user?.email,
        });

        channel = supabase.channel(channelName);
        channel
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema:
                parsedParams.meta?.schema ||
                // @ts-expect-error TS2445 Property rest is protected and only accessible within class SupabaseClient and its subclasses.
                supabase?.rest?.schemaName ||
                "public",
              table: resource,
              filter: realtimeFilter,
            },
            async (payload) => {
              console.log("postgres_changes", payload);
              const eventMap: Record<string, string> = {
                INSERT: "created",
                UPDATE: "updated",
                DELETE: "deleted",
              };
              const refineType = eventMap[payload.eventType];

              if (
                parsedTypes.includes("*") ||
                parsedTypes.includes(refineType)
              ) {
                // 如果 realtimeFilter 无法完全覆盖（如多重过滤），可以在这里做进一步内存过滤
                // 但 Supabase Realtime 的 filter 已经能处理大部分情况

                await stream.writeSSE({
                  data: JSON.stringify(payload),
                  event: "message",
                  id: String(payload.new?.id || payload.old?.id || Date.now()),
                });
              }
            },
          )
          .subscribe((type, err) => {
            console.debug("subscribe", type, err);
          });

        let alive = true;
        // 3. 清理逻辑
        stream.onAbort(() => {
          alive = false;
          console.debug("onAbort");
          channel?.unsubscribe();
        });

        // 4. 心跳维持 (Keep-alive)
        try {
          // eslint-disable-next-line no-constant-condition
          while (alive) {
            await stream.sleep(5000);
            console.debug("ping");
            await stream.writeSSE({ data: "ping", event: "ping" });
          }
        } finally {
          console.debug("end");
          channel?.unsubscribe();
        }
      },
      async (error) => {
        console.error(error);
      },
    );
  },
);
