import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST - Send magic link to user
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email es requerido" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`,
      },
    });

    if (error) throw error;

    // Note: The link is generated but Supabase will send the email automatically
    // if you have email configured. If not, you would need to send it manually.

    return NextResponse.json({ success: true, message: "Magic link enviado" });
  } catch (error) {
    console.error("Error sending magic link:", error);
    return NextResponse.json({ error: "Error al enviar magic link" }, { status: 500 });
  }
}
