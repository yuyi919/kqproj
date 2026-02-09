import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { ApiVariables } from "../middleware/supabase";

const app = new Hono<{ Variables: ApiVariables }>()
  .post(
    "/rooms",
    zValidator(
      "json",
      z.object({
        name: z.string().min(1).max(50),
        config: z.record(z.any(), z.any()).optional(),
      })
    ),
    async (c) => {
      const supabase = c.get("supabase");
      const { name, config } = c.req.valid("json");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // 1. Create Room
      const { data: room, error: createError } = await supabase
        .from("game_rooms")
        .insert({
          name,
          host_id: user.id,
          status: "WAITING",
          config: config || {},
        })
        .select()
        .single();

      if (createError) {
        return c.json({ error: createError.message }, 500);
      }

      // 2. Join Host as Player (Seat 0)
      const { error: joinError } = await supabase
        .from("game_players")
        .insert({
          room_id: room.id,
          user_id: user.id,
          seat_number: 0,
          status: "READY",
        });

      if (joinError) {
        // Cleanup room if join fails? Or just return error
        return c.json({ error: "Room created but failed to join: " + joinError.message }, 500);
      }

      return c.json(room);
    }
  )
  .post(
    "/rooms/:id/join",
    zValidator(
      "param",
      z.object({
        id: z.uuid(),
      })
    ),
    async (c) => {
      const supabase = c.get("supabase");
      const roomId = c.req.param("id");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // 1. Check Room Status & Capacity
      const { data: room, error: roomError } = await supabase
        .from("game_rooms")
        .select("*, players:game_players(count)")
        .eq("id", roomId)
        .single();

      if (roomError || !room) {
        return c.json({ error: "Room not found" }, 404);
      }

      if (room.status !== "WAITING") {
        return c.json({ error: "Game already started or finished" }, 400);
      }
      
      // Parse config for maxPlayers (default to 7)
      const maxPlayers = (room.config as any)?.maxPlayers || 7;
      // @ts-ignore
      const currentPlayerCount = room.players?.[0]?.count || 0;

      if (currentPlayerCount >= maxPlayers) {
        return c.json({ error: "Room is full" }, 400);
      }

      // 2. Check if already joined
      const { data: existingPlayer } = await supabase
        .from("game_players")
        .select("id")
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .single();

      if (existingPlayer) {
        return c.json({ message: "Already joined", id: existingPlayer.id });
      }

      // 3. Join
      const { data: player, error: joinError } = await supabase
        .from("game_players")
        .insert({
          room_id: roomId,
          user_id: user.id,
          status: "JOINED",
          seat_number: currentPlayerCount, // Simple seat assignment
        })
        .select()
        .single();

      if (joinError) {
        return c.json({ error: joinError.message }, 500);
      }

      return c.json(player);
    }
  )
  .post(
    "/rooms/:id/leave",
    async (c) => {
      const supabase = c.get("supabase");
      const roomId = c.req.param("id");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // 1. Remove player
      const { error: leaveError } = await supabase
        .from("game_players")
        .delete()
        .eq("room_id", roomId)
        .eq("user_id", user.id);

      if (leaveError) {
        return c.json({ error: leaveError.message }, 500);
      }
      
      // 2. Check if room is empty or host left
      // This logic can be complex (assign new host, delete room, etc.)
      // For now, let's just leave it to Supabase cascades or background jobs, 
      // or implement simple "delete if empty" logic.
      
      const { count } = await supabase
        .from("game_players")
        .select("*", { count: "exact", head: true })
        .eq("room_id", roomId);
        
      if (count === 0) {
        // Logic Delete: Set status to DESTROYED
        await supabase.from("game_rooms").update({ status: "DESTROYED" }).eq("id", roomId);
      }

      return c.json({ success: true });
    }
  )
  .post(
    "/rooms/:id/ready",
    zValidator(
      "json",
      z.object({
        ready: z.boolean(),
      })
    ),
    async (c) => {
      const supabase = c.get("supabase");
      const roomId = c.req.param("id");
      const { ready } = c.req.valid("json");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { data, error } = await supabase
        .from("game_players")
        .update({ status: ready ? "READY" : "JOINED" })
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        return c.json({ error: error.message }, 500);
      }

      return c.json(data);
    }
  )
  .post(
    "/rooms/:id/start",
    async (c) => {
      const supabase = c.get("supabase");
      const roomId = c.req.param("id");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // 1. Verify Host
      const { data: room, error: roomError } = await supabase
        .from("game_rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (roomError || !room) {
        return c.json({ error: "Room not found" }, 404);
      }

      if (room.host_id !== user.id) {
        return c.json({ error: "Only host can start the game" }, 403);
      }

      // 2. Check all players ready (optional, but good practice)
      // For now, let's just start it.

      // 3. Update Status
      const { data, error } = await supabase
        .from("game_rooms")
        .update({ status: "PLAYING" })
        .eq("id", roomId)
        .select()
        .single();

      if (error) {
        return c.json({ error: error.message }, 500);
      }

      return c.json(data);
    }
  );

export default app;
