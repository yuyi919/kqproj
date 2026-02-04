import type {
  CreateManyResponse,
  CreateResponse,
  DataProvider,
  DeleteManyResponse,
  DeleteOneResponse,
  GetListResponse,
  GetManyResponse,
  GetOneResponse,
  MetaQuery,
  UpdateManyResponse,
  UpdateResponse,
} from "@refinedev/core";
import { rpc } from "@utils/api/rpc";

export const dataProvider = (): DataProvider => {
  return {
    getList: async ({ resource, pagination, filters, sorters, meta }) => {
      const res = await rpc.data[":resource"].$get({
        param: { resource },
        query: {
          pagination: JSON.stringify(pagination),
          filters: JSON.stringify(filters),
          sorters: JSON.stringify(sorters),
          meta: JSON.stringify(pickMeta(meta)),
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw error;
      }

      return (await res.json()) as GetListResponse<any>;
    },

    getMany: async ({ resource, ids, meta }) => {
      // Use getList with an 'in' filter for getMany
      const res = await rpc.data[":resource"].$get({
        param: { resource },
        query: {
          filters: JSON.stringify([
            {
              field: meta?.idColumnName ?? "id",
              operator: "in",
              value: ids,
            },
          ]),
          meta: JSON.stringify(pickMeta(meta)),
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw error;
      }

      const { data } = await res.json();
      return { data } as GetManyResponse<any>;
    },

    getOne: async ({ resource, id, meta }) => {
      const res = await rpc.data[":resource"][":id"].$get({
        param: { resource, id: id.toString() },
        query: {
          meta: JSON.stringify(pickMeta(meta)),
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw error;
      }

      return (await res.json()) as GetOneResponse<any>;
    },

    create: async ({ resource, variables, meta }) => {
      const res = await rpc.data[":resource"].$post({
        param: { resource },
        json: { variables, meta: meta as {} },
      });

      if (!res.ok) {
        const error = await res.json();
        throw error;
      }

      return (await res.json()) as CreateResponse<any>;
    },

    createMany: async ({ resource, variables, meta }) => {
      const results = await Promise.all(
        variables.map((v) =>
          rpc.data[":resource"].$post({
            param: { resource },
            json: { variables: v, meta: meta as {} },
          }),
        ),
      );

      const data = await Promise.all(
        results.map(async (res) => {
          if (!res.ok) throw await res.json();
          const { data } = await res.json();
          return data;
        }),
      );

      return { data } as CreateManyResponse<any>;
    },

    update: async ({ resource, id, variables, meta }) => {
      const res = await rpc.data[":resource"][":id"].$patch({
        param: { resource, id: id.toString() },
        json: { variables, meta: meta as {} },
      });

      if (!res.ok) {
        const error = await res.json();
        throw error;
      }

      return (await res.json()) as UpdateResponse<any>;
    },

    updateMany: async ({ resource, ids, variables, meta }) => {
      const results = await Promise.all(
        ids.map((id) =>
          rpc.data[":resource"][":id"].$patch({
            param: { resource, id: id.toString() },
            json: { variables, meta: meta as {} },
          }),
        ),
      );

      const data = await Promise.all(
        results.map(async (res) => {
          if (!res.ok) throw await res.json();
          const { data } = await res.json();
          return data;
        }),
      );

      return { data } as UpdateManyResponse<any>;
    },

    deleteOne: async ({ resource, id, meta }) => {
      const res = await rpc.data[":resource"][":id"].$delete({
        param: { resource, id: id.toString() },
        query: { meta: JSON.stringify(pickMeta(meta)) },
      });

      if (!res.ok) {
        const error = await res.json();
        throw error;
      }

      return (await res.json()) as DeleteOneResponse<any>;
    },

    deleteMany: async ({ resource, ids, meta }) => {
      const results = await Promise.all(
        ids.map((id) =>
          rpc.data[":resource"][":id"].$delete({
            param: { resource, id: id.toString() },
            query: { meta: JSON.stringify(pickMeta(meta)) },
          }),
        ),
      );

      const data = await Promise.all(
        results.map(async (res) => {
          if (!res.ok) throw await res.json();
          const { data } = await res.json();
          return data;
        }),
      );

      return { data } as DeleteManyResponse<any>;
    },

    getApiUrl: () => "/api/data",

    custom: async ({
      url,
      method,
      filters,
      sorters,
      payload,
      query,
      headers,
      meta,
    }) => {
      // For custom, we might need a more flexible endpoint or just use fetch
      // But for now, let's keep it simple or throw
      throw new Error("Custom method not implemented in Hono Data Provider");
    },
  };
};
function pickMeta(meta?: MetaQuery): MetaQuery {
  return {
    schema: meta?.schema,
    count: meta?.count,
    select: meta?.select,
    idColumnName: meta?.idColumnName,
  };
}
