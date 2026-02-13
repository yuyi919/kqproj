import { GameRoomClient } from "@components/game/GameRoom/GameRoomClient";
import { IGameRoom } from "@interfaces/game-room";
import { createSupabaseServerClient } from "@utils/supabase/server";
import { notFound } from "next/navigation";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  // Prefetch room data
  const { data: room, error } = await supabase
    .from("game_rooms")
    .select("*, players:game_players(*, user:users(username, avatar_url))")
    .eq("id", id)
    .single();

  if (error || !room) {
    // If room not found or error, we can either return 404 or let client handle it.
    // But since this is a server page, returning notFound() is better for SEO/UX.
    // However, if it's an auth error (RLS), maybe we should let client try?
    // Let's pass undefined if error, let client show "Room not found".
    // Or simpler:
    // return notFound();
    // But maybe user is just not logged in?
    // If not logged in, Supabase client might return null data due to RLS.
    // So passing undefined is safer, let GameRoomClient handle "Room not found" or "Login required".
  }

  // Cast type because we are not using generated types here yet
  return (
    <GameRoomClient
      roomId={id}
      initialRoomData={room as unknown as IGameRoom}
    />
  );
}
