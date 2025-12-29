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

    const colors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];
    const remindersList = userReminders
      .map(
        (r, i) =>
          `<div style="background: #1e293b; border-radius: 10px; padding: 16px; margin: 8px; border-left: 4px solid ${colors[i % colors.length]};">
            <table style="width: 100%;"><tr>
              <td style="color: #f1f5f9; font-weight: 600; font-size: 15px;">${r.concept}</td>
              <td style="color: ${colors[i % colors.length]}; font-weight: 700; font-size: 18px; text-align: right;">${formatAmount(Number(r.amount))} €</td>
            </tr></table>
          </div>`
      )
      .join("");

    const totalAmount = userReminders.reduce(
      (sum, r) => sum + Number(r.amount),
      0
    );

    const tomorrowFormatted = new Date(tomorrowStr).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

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
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; margin: 0; padding: 24px;">
            <div style="max-width: 480px; margin: 0 auto;">
              <!-- Header con logo -->
              <div style="text-align: center; padding: 32px 0;">
                <img src="https://finybuddy.com/assets/logo-finybuddy-wordmark.png" alt="FinyBuddy" style="height: 48px; width: auto;">
              </div>

              <!-- Card principal -->
              <div style="background: linear-gradient(145deg, #1e293b 0%, #334155 100%); border-radius: 20px; overflow: hidden; border: 1px solid #475569;">
                <!-- Alerta -->
                <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 16px 24px; text-align: center;">
                  <span style="color: white; font-size: 16px; font-weight: 600;">⏰ Recordatorio de vencimientos</span>
                </div>

                <!-- Contenido -->
                <div style="padding: 28px;">
                  <div style="text-align: center; margin-bottom: 20px;">
                    <img src="https://finybuddy.com/assets/finybuddy-mascot.png" alt="FinyBuddy" style="height: 80px; width: auto;">
                  </div>

                  <h2 style="color: #f1f5f9; margin: 0 0 8px 0; font-size: 22px; font-weight: 600; text-align: center;">
                    ¡Hola${profile.full_name ? ` ${profile.full_name}` : ""}! 👋
                  </h2>
                  <p style="color: #94a3b8; margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; text-align: center;">
                    Te recordamos que mañana <strong style="color: #f1f5f9;">${tomorrowFormatted}</strong> vence${userReminders.length === 1 ? "" : "n"}:
                  </p>

                  <!-- Recordatorios -->
                  <div style="background: #0f172a; border-radius: 12px; padding: 4px; margin-bottom: 20px;">
                    ${remindersList}
                  </div>

                  <!-- Total -->
                  ${
                    userReminders.length > 1
                      ? `<div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 24px;">
                      <div style="color: rgba(255,255,255,0.8); font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Total a pagar mañana</div>
                      <div style="color: white; font-size: 32px; font-weight: 700; margin-top: 4px;">${formatAmount(totalAmount)} €</div>
                    </div>`
                      : ""
                  }

                  <!-- Botón -->
                  <a href="https://finybuddy.com/calendario" style="display: block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 16px 24px; border-radius: 12px; font-weight: 600; text-align: center; font-size: 15px;">
                    📅 Ver mi calendario
                  </a>
                </div>
              </div>

              <!-- Footer -->
              <div style="text-align: center; padding: 24px 0;">
                <p style="color: #64748b; margin: 0 0 8px 0; font-size: 13px;">
                  Puedes desactivar estos emails desde Ajustes en tu cuenta.
                </p>
                <p style="color: #475569; margin: 0; font-size: 12px;">
                  © 2025 FinyBuddy · Tu asistente financiero personal
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
