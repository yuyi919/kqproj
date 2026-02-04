import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import type { ApiVariables } from "../middleware/supabase";

// --- Schemas ---

const FilterOperatorSchema = z.enum([
  "eq",
  "ne",
  "lt",
  "gt",
  "lte",
  "gte",
  "contains",
  "containedBy",
  "range",
  "isnull",
  "null",
  "isnotnull",
  "notnull",
  "in",
  "between",
  "startsWith",
  "endsWith",
  "or",
  "and",
]);

const CrudFilterSchema = z.object({
  field: z.string(),
  operator: FilterOperatorSchema,
  value: z.any(),
});

const CrudSortSchema = z.object({
  field: z.string(),
  order: z.enum(["asc", "desc"]),
});

const PaginationSchema = z.object({
  current: z.number().optional(),
  pageSize: z.number().optional(),
  mode: z.enum(["server", "client"]).optional(),
});

const MetaSchema = z.object({
  schema: z.string().optional(),
  select: z.string().optional(),
  count: z.enum(["exact", "planned", "estimated"]).optional(),
  idColumnName: z.string().optional(),
});

// --- Utils ---

const generateFilter = (
  filter: z.infer<typeof CrudFilterSchema>,
  query: any,
) => {
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

// --- Route ---

export const data = /*#__PURE__*/ new Hono<{ Variables: ApiVariables }>()
  .get(
    "/:resource",
    zValidator(
      "query",
      z.object({
        pagination: z.string().optional(), // JSON stringified PaginationSchema
        filters: z.string().optional(), // JSON stringified CrudFilterSchema[]
        sorters: z.string().optional(), // JSON stringified CrudSortSchema[]
        meta: z.string().optional(), // JSON stringified MetaSchema
      }),
    ),
    async (c) => {
      const supabase = c.var.supabase;
      const resource = c.req.param("resource");
      const { pagination, filters, sorters, meta } = c.req.valid("query");

      const parsedPagination = pagination ? JSON.parse(pagination) : {};
      const parsedFilters = filters ? (JSON.parse(filters) as any[]) : [];
      const parsedSorters = sorters ? (JSON.parse(sorters) as any[]) : [];
      const parsedMeta = meta ? JSON.parse(meta) : {};

      const { current = 1, pageSize = 10, mode = "server" } = parsedPagination;

      const client = parsedMeta.schema
        ? supabase.schema(parsedMeta.schema)
        : supabase;

      let query = client.from(resource).select(parsedMeta.select ?? "*", {
        count: parsedMeta.count ?? "exact",
      });

      if (mode === "server") {
        query = query.range((current - 1) * pageSize, current * pageSize - 1);
      }

      parsedSorters.forEach((item: any) => {
        const [foreignTable, field] = item.field.split(/\.(?=[^.]+$)/);
        if (foreignTable && field) {
          query = query.order(field, {
            ascending: item.order === "asc",
            foreignTable: foreignTable,
          });
        } else {
          query = query.order(item.field, {
            ascending: item.order === "asc",
          });
        }
      });

      parsedFilters.forEach((item: any) => {
        query = generateFilter(item, query);
      });

      const { data, count, error } = await query;

      if (error) {
        return c.json({ error }, 400);
      }

      return c.json({
        data: data || [],
        total: count || 0,
      });
    },
  )
  .get(
    "/:resource/:id",
    zValidator("query", z.object({ meta: z.string().optional() })),
    async (c) => {
      const supabase = c.var.supabase;
      const resource = c.req.param("resource");
      const id = c.req.param("id");
      const { meta } = c.req.valid("query");
      const parsedMeta = meta ? JSON.parse(meta) : {};

      const client = parsedMeta.schema
        ? supabase.schema(parsedMeta.schema)
        : supabase;
      const query = client.from(resource).select(parsedMeta.select ?? "*");

      if (parsedMeta.idColumnName) {
        query.eq(parsedMeta.idColumnName as string, id);
      } else {
        query.match({ id });
      }

      const { data, error } = await query.single();

      if (error) return c.json({ error }, 400);
      return c.json({ data });
    },
  )
  .post(
    "/:resource",
    zValidator(
      "json",
      z.object({ variables: z.any(), meta: MetaSchema.optional() }),
    ),
    async (c) => {
      const supabase = c.var.supabase;
      const resource = c.req.param("resource");
      const { variables, meta } = c.req.valid("json");

      const client = meta?.schema ? supabase.schema(meta.schema) : supabase;
      const { data, error } = await client
        .from(resource)
        .insert(variables)
        .select(meta?.select ?? "*");

      if (error) return c.json({ error }, 400);
      return c.json({ data: Array.isArray(data) ? data[0] : data });
    },
  )
  .patch(
    "/:resource/:id",
    zValidator(
      "json",
      z.object({ variables: z.any(), meta: MetaSchema.optional() }),
    ),
    async (c) => {
      const supabase = c.var.supabase;
      const resource = c.req.param("resource");
      const id = c.req.param("id");
      const { variables, meta } = c.req.valid("json");

      const client = meta?.schema ? supabase.schema(meta.schema) : supabase;
      const query = client.from(resource).update(variables);

      if (meta?.idColumnName) {
        query.eq(meta.idColumnName, id);
      } else {
        query.match({ id });
      }

      const { data, error } = await query.select(meta?.select ?? "*");

      if (error) return c.json({ error }, 400);
      return c.json({ data: Array.isArray(data) ? data[0] : data });
    },
  )
  .delete(
    "/:resource/:id",
    zValidator("query", z.object({ meta: z.string().optional() })),
    async (c) => {
      const supabase = c.var.supabase;
      const resource = c.req.param("resource");
      const id = c.req.param("id");
      const { meta } = c.req.valid("query");
      const parsedMeta = meta ? JSON.parse(meta) : {};

      const client = parsedMeta.schema
        ? supabase.schema(parsedMeta.schema)
        : supabase;
      const query = client.from(resource).delete();

      if (parsedMeta.idColumnName) {
        query.eq(parsedMeta.idColumnName as string, id);
      } else {
        query.match({ id });
      }

      const { data, error } = await query.select(parsedMeta.select ?? "*");

      if (error) return c.json({ error }, 400);
      return c.json({ data: Array.isArray(data) ? data[0] : data });
    },
  );
