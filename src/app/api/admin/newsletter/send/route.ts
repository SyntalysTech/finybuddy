import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { subject, content, testEmail } = await request.json();

    if (!subject || !content) {
      return NextResponse.json({ error: "Asunto y contenido son requeridos" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // If testEmail is provided, only send to that email
    let recipients: string[] = [];

    if (testEmail) {
      recipients = [testEmail];
    } else {
      // Get active subscribers
      const { data: subscribers, error } = await supabase
        .from("newsletter_subscribers")
        .select("email")
        .eq("is_active", true);

      if (error) throw error;

      recipients = subscribers?.map(s => s.email) || [];
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: "No hay destinatarios activos" }, { status: 400 });
    }

    // Build HTML email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; margin: 0; padding: 24px;">
        <div style="max-width: 600px; margin: 0 auto;">
          <!-- Header con logo -->
          <div style="text-align: center; padding: 32px 0;">
            <img src="https://finybuddy.com/assets/logo-finybuddy-wordmark.png" alt="FinyBuddy" style="height: 48px; width: auto;">
          </div>

          <!-- Card principal -->
          <div style="background: linear-gradient(145deg, #1e293b 0%, #334155 100%); border-radius: 20px; overflow: hidden; border: 1px solid #475569;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #02EAFF 0%, #9945FF 100%); padding: 20px 24px; text-align: center;">
              <h1 style="color: white; font-size: 20px; font-weight: 600; margin: 0;">${subject}</h1>
            </div>

            <!-- Contenido -->
            <div style="padding: 28px; color: #f1f5f9; font-size: 15px; line-height: 1.7;">
              ${content.replace(/\n/g, '<br>')}
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 24px 0;">
            <p style="color: #64748b; margin: 0 0 8px 0; font-size: 13px;">
              Puedes darte de baja enviando un email a soporte@finybuddy.com
            </p>
            <p style="color: #475569; margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} FinyBuddy · Tu asistente financiero personal
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    let sent = 0;
    const errors: string[] = [];

    // Send emails in batches of 10 to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const promises = batch.map(async (email) => {
        try {
          await resend.emails.send({
            from: "FinyBuddy <newsletter@finybuddy.com>",
            to: email,
            subject: subject,
            html: htmlContent,
          });
          sent++;
        } catch (err) {
          console.error(`Error sending to ${email}:`, err);
          errors.push(email);
        }
      });

      await Promise.all(promises);

      // Small delay between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      total: recipients.length,
      errors: errors.length > 0 ? errors : undefined,
      isTest: !!testEmail
    });
  } catch (error) {
    console.error("Error sending newsletter:", error);
    return NextResponse.json({ error: "Error al enviar newsletter" }, { status: 500 });
  }
}
