import { NextResponse } from "next/server";
import { ApiError, apiError, databaseError, isUuid } from "@/lib/api";
import { getCurrentSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const BUCKET      = "mentor-avatars";
const MAX_BYTES   = 3 * 1024 * 1024; // 3 MB
const ALLOWED     = ["image/jpeg", "image/png", "image/webp"];

// POST /api/mentor/avatar
// Public endpoint — called right after self-registration.
// Body: multipart/form-data  { mentorId: string, file: File }
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const mentorId = typeof formData.get("mentorId") === "string" ? (formData.get("mentorId") as string).trim() : "";
    const file     = formData.get("file");

    if (!isUuid(mentorId)) throw new ApiError("A valid mentorId is required.", 400);
    if (!(file instanceof File)) throw new ApiError("No image file was provided.", 400);
    if (!ALLOWED.includes(file.type)) throw new ApiError("Only JPEG, PNG, or WebP images are allowed.", 400);
    if (file.size > MAX_BYTES) throw new ApiError("Image must be smaller than 3 MB.", 400);

    const supabase = getSupabaseAdmin();
    const session  = await getCurrentSession();

    // Verify this mentor actually belongs to the current session
    const { data: mentor, error: mentorErr } = await supabase
      .from("mentors")
      .select("id")
      .eq("id", mentorId)
      .eq("session_id", session.id)
      .maybeSingle();
    if (mentorErr) throw databaseError("Unable to verify mentor.", mentorErr.code);
    if (!mentor)   throw new ApiError("Mentor not found.", 404);

    const ext  = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
    const path = `${session.id}/${mentorId}.${ext}`;
    const buf  = await file.arrayBuffer();

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, buf, { contentType: file.type, upsert: true });

    if (uploadErr) {
      if (uploadErr.message.toLowerCase().includes("bucket")) {
        throw new ApiError(`Storage bucket "${BUCKET}" not found. Create it in Supabase Dashboard → Storage.`, 503);
      }
      throw new ApiError("Failed to upload image. Please try again.", 500);
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const { error: updateErr } = await supabase
      .from("mentors")
      .update({ profile_photo_url: urlData.publicUrl })
      .eq("id", mentorId);
    if (updateErr) throw databaseError("Unable to save profile photo.", updateErr.code);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error) {
    return apiError(error);
  }
}
