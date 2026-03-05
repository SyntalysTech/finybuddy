import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

function buildReminderEmailHtml(
    profile: { full_name: string | null; email: string },
    reminders: { name: string; amount: number | null }[],
    dateLabel: string,
    dateFormatted: string
) {
    const formatAmount = (amount: number) =>
        amount.toLocaleString("es-ES", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    const colors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];
    const remindersList = reminders
        .map(
            (r, i) =>
                `<div style="background: #1e293b; border-radius: 10px; padding: 16px; margin: 8px; border-left: 4px solid ${colors[i % colors.length]};">
          <table style="width: 100%;"><tr>
            <td style="color: #f1f5f9; font-weight: 600; font-size: 15px;">${r.name}</td>
            ${r.amount ? `<td style="color: ${colors[i % colors.length]}; font-weight: 700; font-size: 18px; text-align: right;">${formatAmount(Number(r.amount))} €</td>` : ""}
          </tr></table>
        </div>`
        )
        .join("");

    const remindersWithAmount = reminders.filter((r) => r.amount);
    const totalAmount = remindersWithAmount.reduce(
        (sum, r) => sum + Number(r.amount),
        0
    );

    return `
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
            <h2 style="color: #f1f5f9; margin: 0 0 8px 0; font-size: 22px; font-weight: 600; text-align: center;">
              ¡Hola${profile.full_name ? ` ${profile.full_name}` : ""}! 👋
            </h2>
            <p style="color: #94a3b8; margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; text-align: center;">
              Te recordamos que ${dateLabel} <strong style="color: #f1f5f9;">${dateFormatted}</strong> vence${reminders.length === 1 ? "" : "n"}:
            </p>

            <!-- Recordatorios -->
            <div style="background: #0f172a; border-radius: 12px; padding: 4px; margin-bottom: 20px;">
              ${remindersList}
            </div>

            <!-- Total -->
            ${remindersWithAmount.length > 1
            ? `<div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 24px;">
                <div style="color: rgba(255,255,255,0.8); font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Total ${dateLabel}</div>
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
  `;
}

export async function POST(request: Request) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Obtener perfil para verificar preferencias
    const { data: profile } = await supabase
        .from("profiles")
        .select("id, email, full_name, email_reminder_alerts")
        .eq("id", user.id)
        .single();

    if (!profile?.email_reminder_alerts || !profile.email) {
        return NextResponse.json({ skipped: true, reason: "Alerts disabled or no email" });
    }

    // Obtener recordatorios de hoy y mañana no completados
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const { data: reminders, error: remindersError } = await supabase
        .from("calendar_reminders")
        .select("id, name, amount, reminder_date")
        .eq("user_id", user.id)
        .in("reminder_date", [todayStr, tomorrowStr])
        .eq("is_completed", false);

    if (remindersError) {
        console.error("Error fetching reminders:", remindersError);
        return NextResponse.json({ error: remindersError.message }, { status: 500 });
    }

    if (!reminders || reminders.length === 0) {
        return NextResponse.json({ sent: 0, message: "No reminders due" });
    }

    // Agrupar por fecha
    const remindersByDate = {
        today: reminders.filter(r => r.reminder_date === todayStr),
        tomorrow: reminders.filter(r => r.reminder_date === tomorrowStr)
    };

    let sent = 0;

    // Enviar batch de hoy
    if (remindersByDate.today.length > 0) {
        const dateFormatted = new Date(todayStr + "T00:00:00").toLocaleDateString("es-ES", {
            weekday: "long", day: "numeric", month: "long",
        });
        const subjectPrefix = "⏰ Hoy vence";
        const subject = remindersByDate.today.length === 1
            ? `${subjectPrefix}: ${remindersByDate.today[0].name}`
            : `⏰ Tienes ${remindersByDate.today.length} recordatorios que vencen hoy`;

        try {
            await resend.emails.send({
                from: "FinyBuddy <notificaciones@finybuddy.com>",
                to: profile.email,
                subject,
                html: buildReminderEmailHtml(profile, remindersByDate.today, "hoy", dateFormatted),
            });
            sent++;
        } catch (e) {
            console.error(e);
        }
    }

    // Enviar batch de mañana
    if (remindersByDate.tomorrow.length > 0) {
        const dateFormatted = new Date(tomorrowStr + "T00:00:00").toLocaleDateString("es-ES", {
            weekday: "long", day: "numeric", month: "long",
        });
        const subjectPrefix = "Recordatorio";
        const subject = remindersByDate.tomorrow.length === 1
            ? `${subjectPrefix}: ${remindersByDate.tomorrow[0].name}`
            : `Tienes ${remindersByDate.tomorrow.length} recordatorios que vencen mañana`;

        try {
            await resend.emails.send({
                from: "FinyBuddy <notificaciones@finybuddy.com>",
                to: profile.email,
                subject,
                html: buildReminderEmailHtml(profile, remindersByDate.tomorrow, "mañana", dateFormatted),
            });
            sent++;
        } catch (e) {
            console.error(e);
        }
    }

    return NextResponse.json({ success: true, sent });
}
