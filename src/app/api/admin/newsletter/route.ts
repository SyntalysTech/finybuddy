import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET - List all newsletter subscribers
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: subscribers, error } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ subscribers: subscribers || [] });
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    return NextResponse.json({ error: "Error al obtener suscriptores" }, { status: 500 });
  }
}

// DELETE - Remove subscriber
export async function DELETE(request: NextRequest) {
  try {
    const { subscriberId } = await request.json();

    if (!subscriberId) {
      return NextResponse.json({ error: "ID de suscriptor requerido" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from("newsletter_subscribers")
      .delete()
      .eq("id", subscriberId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting subscriber:", error);
    return NextResponse.json({ error: "Error al eliminar suscriptor" }, { status: 500 });
  }
}

// PATCH - Toggle subscriber active status
export async function PATCH(request: NextRequest) {
  try {
    const { subscriberId, isActive } = await request.json();

    if (!subscriberId) {
      return NextResponse.json({ error: "ID de suscriptor requerido" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from("newsletter_subscribers")
      .update({
        is_active: isActive,
        unsubscribed_at: isActive ? null : new Date().toISOString()
      })
      .eq("id", subscriberId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating subscriber:", error);
    return NextResponse.json({ error: "Error al actualizar suscriptor" }, { status: 500 });
  }
}
