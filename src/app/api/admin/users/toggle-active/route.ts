import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST - Toggle user active status (ban/unban)
export async function POST(request: NextRequest) {
  try {
    const { userId, isActive } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId es requerido" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update profile is_active field
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ is_active: isActive })
      .eq("id", userId);

    if (profileError) throw profileError;

    // Also ban/unban the auth user
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: isActive ? "none" : "876600h", // ~100 years if banning
    });

    if (authError) {
      console.error("Error updating auth user:", authError);
      // Don't fail if auth update fails, profile is updated
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error toggling user status:", error);
    return NextResponse.json({ error: "Error al cambiar estado del usuario" }, { status: 500 });
  }
}
