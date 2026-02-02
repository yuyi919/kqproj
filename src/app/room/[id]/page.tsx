import { ChatWindow } from "@components/chat";
import { authProviderServer } from "@providers/auth-provider/auth-provider.server";
import { Authenticated } from "@refinedev/core";
import { createSupabaseServerClient } from "@utils/supabase/server";

export default async function BlogPostShow({
  params,
}: PageProps<"/blog-posts/show/[id]">) {
  const [{ id }, identity] = await Promise.all([
    params,
    authProviderServer.getIdentity(),
  ]);

  const { data: record, error } = await (await createSupabaseServerClient())
    .from("messages")
    .select("*, user:users(id, username, email, avatar_url)")
    .eq("group_id", id);

  return (
    // <Authenticated key={`room/${id}`}>
      <ChatWindow id={id} userId={identity?.id} initialData={record || []} />
    // </Authenticated>
  );
}
