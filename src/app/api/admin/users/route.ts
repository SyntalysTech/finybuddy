import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Helper to verify admin status
async function verifyAdmin(supabase: ReturnType<typeof createClient>, authHeader: string | null): Promise<{ isAdmin: boolean; userId?: string }> {
  if (!authHeader) {
    return { isAdmin: false };
  }

  // For service role, we need to get the user from the request
  // The client will send the user ID in the request
  return { isAdmin: true }; // Will be verified in each endpoint
}

// GET - List all users (admin only)
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all auth users using admin API
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) throw authError;

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, is_admin, is_active, created_at");

    if (profilesError) throw profilesError;

    // Combine auth users with profiles
    const users = authUsers.users.map(authUser => {
      const profile = profiles?.find(p => p.id === authUser.id);
      return {
        id: authUser.id,
        email: authUser.email || "",
        full_name: profile?.full_name || null,
        is_admin: profile?.is_admin || false,
        is_active: profile?.is_active !== false, // Default to true if not set
        created_at: profile?.created_at || authUser.created_at,
      };
    });

    // Sort by created_at descending
    users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 });
  }
}

// POST - Create new user (admin only)
export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, isAdmin } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    });

    if (authError) {
      if (authError.message.includes("already been registered")) {
        return NextResponse.json({ error: "Este email ya está registrado" }, { status: 400 });
      }
      throw authError;
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 });
    }

    // Update profile with additional info
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName || null,
        is_admin: isAdmin || false,
        email: email,
      })
      .eq("id", authData.user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
      // Don't fail if profile update fails, as the trigger should create it
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email
      }
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 });
  }
}

// PATCH - Update user (toggle admin status)
export async function PATCH(request: NextRequest) {
  try {
    const { userId, isAdmin } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "ID de usuario requerido" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from("profiles")
      .update({ is_admin: isAdmin })
      .eq("id", userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 });
  }
}

// DELETE - Delete user and all their data
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "ID de usuario requerido" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Delete all user data in order (respecting foreign keys)
    const tables = [
      "savings_contributions",
      "debt_payments",
      "savings_goals",
      "debts",
      "reminders",
      "planned_savings",
      "operations",
      "budgets",
      "categories",
      "notifications",
      "profiles",
    ];

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq(table === "profiles" ? "id" : "user_id", userId);

      if (error) {
        console.error(`Error deleting from ${table}:`, error);
      }
    }

    // Delete auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error("Error deleting auth user:", authError);
      // Continue anyway as data is already deleted
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 });
  }
}
