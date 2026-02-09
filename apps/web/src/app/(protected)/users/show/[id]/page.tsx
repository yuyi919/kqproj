"use client";

import { UserMeta } from "@interfaces/user";
import { NumberField, Show, TextField } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";

const { Title } = Typography;

export default function CategoryShow() {
  const { result: record, query } = useShow<UserMeta>({});
  const { isLoading } = query;

  return (
    <Show isLoading={isLoading}>
      <Title level={5}>{"ID"}</Title>
      <TextField value={record?.id} />
      <Title level={5}>{"Name"}</Title>
      <TextField value={record?.username} />
    </Show>
  );
}
