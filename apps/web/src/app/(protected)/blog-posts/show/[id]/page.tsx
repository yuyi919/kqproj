import GroupShow from "@components/pages/groups/show";
import { createSupabaseServerClient } from "@utils/supabase/server";

export default async function BlogPostShow({
  params,
}: PageProps<"/blog-posts/show/[id]">) {
  const { id } = await params;
  const { data: record, error } = await (await createSupabaseServerClient())
    .from("groups")
    .select("*, members:group_members(user_id,meta:users(*))")
    .single();
  return <GroupShow id={id} initialData={record} />;
}
