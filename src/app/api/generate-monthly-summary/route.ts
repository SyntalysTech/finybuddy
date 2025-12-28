import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Verificar que viene de Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Calcular mes anterior
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const monthName = lastMonth.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  // Obtener usuarios con resumen mensual activado
  const { data: users, error: usersError } = await supabase
    .from("profiles")
    .select("id, full_name, in_app_monthly_summary")
    .eq("in_app_monthly_summary", true);

  if (usersError) {
    console.error("Error fetching users:", usersError);
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  let created = 0;
  const errors: string[] = [];

  for (const user of users || []) {
    try {
      // Obtener operaciones del mes anterior
      const { data: operations, error: opsError } = await supabase
        .from("operations")
        .select("type, amount")
        .eq("user_id", user.id)
        .gte("operation_date", lastMonth.toISOString().split("T")[0])
        .lte("operation_date", lastMonthEnd.toISOString().split("T")[0]);

      if (opsError) {
        errors.push(`User ${user.id}: ${opsError.message}`);
        continue;
      }

      // Si no hay operaciones, no crear notificación
      if (!operations || operations.length === 0) continue;

      const income = operations
        .filter((op) => op.type === "income")
        .reduce((sum, op) => sum + Number(op.amount), 0);
      const expenses = operations
        .filter((op) => op.type === "expense")
        .reduce((sum, op) => sum + Number(op.amount), 0);
      const savings = operations
        .filter((op) => op.type === "savings")
        .reduce((sum, op) => sum + Number(op.amount), 0);
      const balance = income - expenses;

      // Formatear cantidades
      const formatAmount = (amount: number) =>
        amount.toLocaleString("es-ES", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

      // Crear notificación
      const { error: insertError } = await supabase
        .from("notifications")
        .insert({
          user_id: user.id,
          title: `Resumen de ${monthName}`,
          message: `Ingresos: ${formatAmount(income)} € | Gastos: ${formatAmount(expenses)} € | Ahorro: ${formatAmount(savings)} € | Balance: ${balance >= 0 ? "+" : ""}${formatAmount(balance)} €`,
          type: "monthly_summary",
          icon: "bar-chart",
        });

      if (insertError) {
        errors.push(`User ${user.id} notification: ${insertError.message}`);
        continue;
      }

      created++;
    } catch (err) {
      errors.push(`User ${user.id}: ${String(err)}`);
    }
  }

  return NextResponse.json({
    success: true,
    created,
    totalUsers: users?.length || 0,
    errors: errors.length > 0 ? errors : undefined,
  });
}

// También permitir GET para testing manual (con autenticación)
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Redirigir a POST
  return POST(request);
}
