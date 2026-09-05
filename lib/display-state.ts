/**
 * Display state — backed by Supabase so all server instances share the same state.
 * Works across Vercel serverless deployments and multiple admin devices.
 */

import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type DisplayScene =
  | { type: "idle" }
  | { type: "allocation"; count: number; total: number }
  | { type: "results"; assigned: number; unmatched: number; satisfaction: number }
  | { type: "custom"; text: string; sub?: string }
  | {
      type: "mentor-card";
      mentor: {
        id: string;
        name: string;
        studentId: string | null;
        batch: string | null;
        photoUrl: string | null;
        communicationMethod: string;
      };
      mentees: { name: string; studentId: string }[];
      index: number;   // 0-based position among all mentors
      total: number;   // total mentor count
    };

export type DisplayState = {
  scene: DisplayScene;
  updatedAt: number;
};

export async function getDisplayState(): Promise<DisplayState> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("display_state")
    .select("scene, updated_at")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return { scene: { type: "idle" }, updatedAt: 0 };
  }

  return {
    scene:     data.scene as DisplayScene,
    updatedAt: new Date(data.updated_at as string).getTime(),
  };
}

export async function setDisplayState(scene: DisplayScene): Promise<DisplayState> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("display_state")
    .upsert({ id: 1, scene, updated_at: now }, { onConflict: "id" });

  if (error) throw new Error(`Unable to update display state: ${error.message}`);

  return { scene, updatedAt: Date.now() };
}
