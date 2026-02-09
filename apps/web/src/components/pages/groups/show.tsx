"use client";
import { MemberAvatars } from "@components/Avatar";
import { Group } from "@components/chat";
import { DateField, MarkdownField, Show, TextField } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";

const { Title } = Typography;
export default function GroupShow({
  id,
  initialData,
}: {
  id: string;
  initialData?: Group;
}) {
  const { result: record = initialData, query } = useShow<Group>({
    resource: "groups",
    id,
    meta: {
      select: "*, members:group_members(user_id,meta:users(*))",
    },
  });
  const { isLoading } = query;
  return (
    <Show isLoading={isLoading}>
      <Title level={5}>{"ID"}</Title>
      <TextField value={record?.id} />
      <Title level={5}>{"Name"}</Title>
      <TextField value={record?.name} />
      <Title level={5}>{"Description"}</Title>
      <MarkdownField value={record?.description!} />
      <Title level={5}>{"Members"}</Title>
      {/* <ChatWindow id={id} /> */}
      {/* <TextField
        value={categoryIsLoading ? <>Loading...</> : <>{category?.title}</>}
      /> */}
      <TextField value={<MemberAvatars members={record?.members} />} />
      {/* <Title level={5}>{"Status"}</Title>
      <TextField value={record?.is_default} /> */}
      <Title level={5}>{"CreatedAt"}</Title>
      <DateField value={record?.created_at} />
    </Show>
  );
  // return null;
}
