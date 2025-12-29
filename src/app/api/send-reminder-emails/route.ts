import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

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

  // Obtener recordatorios que vencen mañana
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  // Obtener recordatorios con usuarios que tienen email_reminder_alerts activado
  const { data: reminders, error: remindersError } = await supabase
    .from("reminders")
    .select(
      `
      id,
      concept,
      amount,
      reminder_date,
      user_id
    `
    )
    .eq("reminder_date", tomorrowStr)
    .eq("is_completed", false);

  if (remindersError) {
    console.error("Error fetching reminders:", remindersError);
    return NextResponse.json(
      { error: remindersError.message },
      { status: 500 }
    );
  }

  if (!reminders || reminders.length === 0) {
    return NextResponse.json({ sent: 0, message: "No reminders for tomorrow" });
  }

  // Obtener los user_ids únicos
  const userIds = [...new Set(reminders.map((r) => r.user_id))];

  // Obtener perfiles de esos usuarios con email_reminder_alerts activado
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email, full_name, email_reminder_alerts")
    .in("id", userIds)
    .eq("email_reminder_alerts", true);

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
    return NextResponse.json(
      { error: profilesError.message },
      { status: 500 }
    );
  }

  // Crear mapa de perfiles
  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  let sent = 0;
  const errors: string[] = [];

  // Agrupar recordatorios por usuario
  const remindersByUser = new Map<string, typeof reminders>();
  for (const reminder of reminders) {
    const profile = profileMap.get(reminder.user_id);
    if (!profile) continue; // Usuario no tiene emails activados

    if (!remindersByUser.has(reminder.user_id)) {
      remindersByUser.set(reminder.user_id, []);
    }
    remindersByUser.get(reminder.user_id)!.push(reminder);
  }

  // Enviar un email por usuario con todos sus recordatorios
  for (const [userId, userReminders] of remindersByUser) {
    const profile = profileMap.get(userId);
    if (!profile?.email) continue;

    const formatAmount = (amount: number) =>
      amount.toLocaleString("es-ES", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    const remindersList = userReminders
      .map(
        (r) =>
          `<li><strong>${r.concept}</strong> - ${formatAmount(Number(r.amount))} €</li>`
      )
      .join("");

    const totalAmount = userReminders.reduce(
      (sum, r) => sum + Number(r.amount),
      0
    );

    try {
      await resend.emails.send({
        from: "FinyBuddy <notificaciones@finybuddy.com>",
        to: profile.email,
        subject:
          userReminders.length === 1
            ? `Recordatorio: ${userReminders[0].concept} vence mañana`
            : `Tienes ${userReminders.length} recordatorios que vencen mañana`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
            <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 24px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">FinyBuddy</h1>
              </div>
              <div style="padding: 24px;">
                <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px;">
                  Hola${profile.full_name ? ` ${profile.full_name}` : ""}! 👋
                </h2>
                <p style="color: #4b5563; margin: 0 0 16px 0; line-height: 1.5;">
                  Te recordamos que mañana <strong>(${new Date(tomorrowStr).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })})</strong> vence${userReminders.length === 1 ? "" : "n"}:
                </p>
                <ul style="color: #1f2937; padding-left: 20px; margin: 0 0 16px 0; line-height: 1.8;">
                  ${remindersList}
                </ul>
                ${
                  userReminders.length > 1
                    ? `<p style="color: #6b7280; margin: 0 0 16px 0; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 12px;">
                    <strong>Total: ${formatAmount(totalAmount)} €</strong>
                  </p>`
                    : ""
                }
                <a href="https://finybuddy.com/calendario" style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500;">
                  Ver calendario
                </a>
              </div>
              <div style="background: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                  Puedes desactivar estos emails desde Ajustes en tu cuenta.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      sent++;
    } catch (error) {
      console.error(`Error sending email to ${profile.email}:`, error);
      errors.push(`${profile.email}: ${String(error)}`);
    }
  }

  return NextResponse.json({
    success: true,
    sent,
    totalReminders: reminders.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}

// También permitir GET para testing manual (con autenticación)
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return POST(request);
}
