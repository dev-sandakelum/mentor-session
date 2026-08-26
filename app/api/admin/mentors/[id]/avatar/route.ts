import { NextResponse } from "next/server";
import { ApiError, apiError, databaseError, isUuid, requireAdmin } from "@/lib/api";
import { getCurrentSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "mentor-avatars";
const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: Request, context: RouteContext<"/api/admin/mentors/[id]/avatar">) {
  try {
    requireAdmin(request);
    const { id } = await context.params;
    if (!isUuid(id)) throw new ApiError("A valid mentor id is required.");
    const session = await getCurrentSession();
    const supabase = getSupabaseAdmin();

    const { data: mentor, error: mentorError } = await supabase
      .from("mentors")
      .select("id")
      .eq("id", id)
      .eq("session_id", session.id)
      .maybeSingle();
    if (mentorError) throw databaseError("Unable to load mentor.", mentorError.code);
    if (!mentor) throw new ApiError("Mentor was not found.", 404);

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) throw new ApiError("No file was provided.", 400);
    if (!ALLOWED_TYPES.includes(file.type)) throw new ApiError("Only JPEG, PNG, WebP, or GIF images are allowed.", 400);
    if (file.size > MAX_BYTES) throw new ApiError("Image must be smaller than 3 MB.", 400);

    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const path = `${session.id}/${mentor.id}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, { contentType: file.type, upsert: true });
    if (uploadError) {
      if (uploadError.message.toLowerCase().includes("bucket")) {
        throw new ApiError(`Storage bucket "${BUCKET}" not found. Create it in Supabase Dashboard → Storage.`, 503);
      }
      throw new ApiError("Failed to upload image. Please try again.", 500);
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = urlData.publicUrl;
    const { error: updateError } = await supabase.from("mentors").update({ profile_photo_url: publicUrl }).eq("id", id);
    if (updateError) throw databaseError("Unable to save profile photo URL.", updateError.code);

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext<"/api/admin/mentors/[id]/avatar">) {
  try {
    requireAdmin(request);
    const { id } = await context.params;
    if (!isUuid(id)) throw new ApiError("A valid mentor id is required.");
    const session = await getCurrentSession();
    const supabase = getSupabaseAdmin();

    const { data: mentor, error: mentorError } = await supabase
      .from("mentors")
      .select("id")
      .eq("id", id)
      .eq("session_id", session.id)
      .maybeSingle();
    if (mentorError) throw databaseError("Unable to load mentor.", mentorError.code);
    if (!mentor) throw new ApiError("Mentor was not found.", 404);

    const { data: files } = await supabase.storage.from(BUCKET).list(`${session.id}`, { search: id });
    if (files?.length) await supabase.storage.from(BUCKET).remove(files.map((f) => `${session.id}/${f.name}`));
    await supabase.from("mentors").update({ profile_photo_url: null }).eq("id", id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
