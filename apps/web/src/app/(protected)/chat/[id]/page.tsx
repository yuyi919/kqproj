import { ChatWindow } from "@components/chat";
import type { SupabaseClient } from "@utils/supabase";
import { createSupabaseServerClient } from "@utils/supabase/server";

export default async function Show({
  params,
}: PageProps<"/blog-posts/show/[id]">) {
  const { id } = await params;
  const client = await createSupabaseServerClient();
  const { data: record, error } = await client
    .from("messages")
    .select("*, user:users(id, username, email, avatar_url)")
    .order("created_at", { ascending: true })
    .eq("group_id", id);

  return (
    <GroupProvider id={id} client={client}>
      {(data) => <ChatWindow id={id} initialData={record || []} group={data} />}
    </GroupProvider>
  );
}

export async function GroupProvider({
  id,
  children,
  client,
}: {
  id: string;
  client: SupabaseClient;
  children: (data: any) => React.ReactNode;
}) {
  const { data: record, error } = await client
    .from("groups")
    .select("*, members:group_members(user_id,meta:users(*))")
    .eq("id", id)
    .single();

  return children(record);
}
