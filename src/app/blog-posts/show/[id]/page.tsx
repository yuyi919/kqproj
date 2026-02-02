// "use client";

import {
  DateField,
  MarkdownField,
  NumberField,
  Show,
  TextField,
} from "@refinedev/antd";
import {
  useCreate,
  useGetIdentity,
  useList,
  useOne,
  useShow,
} from "@refinedev/core";
import { Typography, Avatar, Skeleton } from "antd";
import React from "react";
import { Bubble } from "@ant-design/x";
import { ChatInput } from "@components/chat/input";
// import { useParams } from "next/navigation";
import { supabaseBrowserClient } from "@utils/supabase/client";
import { createSupabaseServerClient } from "@utils/supabase/server";
import GroupShow from "@components/pages/groups/show";
const { Title } = Typography;

export default async function BlogPostShow({
  params,
}: PageProps<"/blog-posts/show/[id]">) {
  const { id } = await params;
  const { data: record, error } = await (await createSupabaseServerClient())
    .from("groups")
    .select("*, members:group_members(user_id,meta:users(*))")
    .single();
  console.log(record, id);
  // const { result: record, query } = useShow<Group>({
  //   resource: "groups",
  //   id,
  //   meta: {
  //     select: "*, members:group_members(user_id,meta:users(*))",
  //   },
  // });
  // const { isLoading } = query;

  // // console.log(isLoading)
  return <GroupShow id={id} initialData={record} />;
  // return null;
}
