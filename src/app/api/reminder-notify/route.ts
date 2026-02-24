import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const supabase = await createClient();

  // Verificar usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reminderName, reminderAmount, reminderDate } = await request.json();

  if (!reminderName || !reminderDate) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Verificar que el usuario tiene emails activados
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, email_reminder_alerts")
    .eq("id", user.id)
    .single();

  if (!profile?.email_reminder_alerts) {
    return NextResponse.json({ skipped: true, reason: "Email alerts disabled" });
  }

  // Determinar si es hoy o mañana
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const isToday = reminderDate === today;
  const isTomorrow = reminderDate === tomorrowStr;

  if (!isToday && !isTomorrow) {
    return NextResponse.json({ skipped: true, reason: "Not today or tomorrow" });
  }

  const dateLabel = isToday ? "hoy" : "mañana";
  const dateFormatted = new Date(reminderDate + "T00:00:00").toLocaleDateString(
    "es-ES",
    { weekday: "long", day: "numeric", month: "long" }
  );

  const formatAmount = (amount: number) =>
    amount.toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const amountHtml = reminderAmount
    ? `<td style="color: #3b82f6; font-weight: 700; font-size: 18px; text-align: right;">${formatAmount(Number(reminderAmount))} €</td>`
    : "";

  try {
    await resend.emails.send({
      from: "FinyBuddy <notificaciones@finybuddy.com>",
      to: profile.email,
      subject: `⏰ ${isToday ? "Hoy" : "Mañana"} vence: ${reminderName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; margin: 0; padding: 24px;">
          <div style="max-width: 480px; margin: 0 auto;">
            <div style="text-align: center; padding: 32px 0;">
              <img src="https://finybuddy.com/assets/logo-finybuddy-wordmark.png" alt="FinyBuddy" style="height: 48px; width: auto;">
            </div>

            <div style="background: linear-gradient(145deg, #1e293b 0%, #334155 100%); border-radius: 20px; overflow: hidden; border: 1px solid #475569;">
              <div style="background: linear-gradient(135deg, ${isToday ? "#ef4444" : "#f59e0b"} 0%, ${isToday ? "#dc2626" : "#d97706"} 100%); padding: 16px 24px; text-align: center;">
                <span style="color: white; font-size: 16px; font-weight: 600;">⏰ Recordatorio${isToday ? " urgente" : ""}</span>
              </div>

              <div style="padding: 28px;">
                <h2 style="color: #f1f5f9; margin: 0 0 8px 0; font-size: 22px; font-weight: 600; text-align: center;">
                  ¡Hola${profile.full_name ? ` ${profile.full_name}` : ""}! 👋
                </h2>
                <p style="color: #94a3b8; margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; text-align: center;">
                  Te recordamos que ${dateLabel} <strong style="color: #f1f5f9;">${dateFormatted}</strong> vence:
                </p>

                <div style="background: #0f172a; border-radius: 12px; padding: 4px; margin-bottom: 20px;">
                  <div style="background: #1e293b; border-radius: 10px; padding: 16px; margin: 8px; border-left: 4px solid #3b82f6;">
                    <table style="width: 100%;"><tr>
                      <td style="color: #f1f5f9; font-weight: 600; font-size: 15px;">${reminderName}</td>
                      ${amountHtml}
                    </tr></table>
                  </div>
                </div>

                <a href="https://finybuddy.com/calendario" style="display: block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 16px 24px; border-radius: 12px; font-weight: 600; text-align: center; font-size: 15px;">
                  📅 Ver mi calendario
                </a>
              </div>
            </div>

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

    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error("Error sending reminder email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
