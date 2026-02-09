import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { ApiVariables } from "../middleware/supabase";

const app = new Hono<{ Variables: ApiVariables }>()
  .post(
    "/avatar",
    zValidator(
      "form",
      z.object({
        file: z
          .instanceof(File)
          .refine(
            (file) => file.size <= 5 * 1024 * 1024,
            "File size must be less than 5MB",
          )
          .refine(
            (file) =>
              ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
                file.type,
              ),
            "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.",
          ),
      }),
    ),
    async (c) => {
      const supabase = c.get("supabase");
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Validated body from zValidator
      const { file } = c.req.valid("form");

      // 3. Prepare Paths
      const fileExt = file.name.split(".").pop() || "jpg";
      // Use a high-precision timestamp to avoid collision
      const timestamp = Date.now();
      const fileName = `${user.id}/${timestamp}.${fileExt}`;

      // 4. Upload New Avatar
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          // upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return c.json({ error: "Failed to upload avatar" }, 500);
      }

      // 5. Update User Profile (Public URL)
      // We use a query param `v` to bust client-side caches
      const proxyUrl = `/api/users/${user.id}/avatar?v=${timestamp}`;

      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: proxyUrl })
        .eq("id", user.id);

      if (updateError) {
        console.error("Profile update error:", updateError);
        return c.json({ error: "Failed to update profile" }, 500);
      }

      // 6. Cleanup Old Avatars (Async, don't block response)
      (async () => {
        const { data: files } = await supabase.storage
          .from("avatars")
          .list(user.id);
        if (files && files.length > 0) {
          const filesToDelete = files
            .filter((f) => f.name !== `${timestamp}.${fileExt}`) // Keep the new file
            .map((f) => `${user.id}/${f.name}`);

          if (filesToDelete.length > 0) {
            await supabase.storage.from("avatars").remove(filesToDelete);
          }
        }
      })().catch((err) => console.error("Cleanup error:", err));

      return c.json({ url: proxyUrl });
    },
  )
  .get(
    "/:id/avatar",
    zValidator(
      "param",
      z.object({
        id: z.uuid("Invalid User ID"),
      }),
    ),
    async (c) => {
      const { id: userId } = c.req.valid("param");
      const supabase = c.get("supabase");

      // 2. Find Avatar File
      const { data: files, error: listError } = await supabase.storage
        .from("avatars")
        .list(userId, {
          limit: 1,
          sortBy: { column: "created_at", order: "desc" },
        });
      // console.log(userId, files, listError);
      // 3. Handle Not Found (Return Default Avatar)
      if (listError || !files || files.length === 0) {
        // Return a generated SVG placeholder
        const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
          <rect width="128" height="128" fill="#e2e8f0"/>
          <path d="M64 16a32 32 0 100 64 32 32 0 000-64zM32 96c0-12.8 14.3-24 32-24s32 11.2 32 24H32z" fill="#94a3b8"/>
        </svg>
       `;
        c.header("Content-Type", "image/svg+xml");
        c.header("Cache-Control", "public, max-age=3600");
        return c.body(svg);
      }

      const latestFile = files[0];
      const filePath = `${userId}/${latestFile.name}`;

      // 4. Download File
      const { data, error: downloadError } = await supabase.storage
        .from("avatars")
        .download(filePath);

      if (downloadError || !data) {
        console.error("Download error:", downloadError);
        return c.json({ error: "Failed to download avatar" }, 500);
      }

      // 5. Serve File
      const mimeType = latestFile.metadata?.mimetype || "image/jpeg";
      c.header("Content-Type", mimeType);
      // Cache for 1 hour, browser will re-validate if URL changes (v param)
      c.header("Cache-Control", "public, max-age=3600");

      return c.body(data as any, 200);
    },
  );

export default app;
