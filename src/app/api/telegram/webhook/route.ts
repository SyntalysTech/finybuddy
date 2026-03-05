import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getFinancialContext, buildSystemPrompt, tools, executeTool } from "@/lib/ai/finybot-engine";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function sendTelegramMessage(chatId: number, text: string) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    });
}

export async function POST(request: NextRequest) {
    if (!TELEGRAM_TOKEN) return NextResponse.json({ error: "No token" }, { status: 500 });

    try {
        const body = await request.json();
        const message = body.message;
        if (!message) return NextResponse.json({ ok: true });

        const chatId = message.chat.id;
        const text = message.text || "";

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Check if user is linked
        const { data: profile } = await supabase
            .from("profiles")
            .select("id, full_name")
            .eq("telegram_chat_id", chatId.toString())
            .single();

        // 2. Handle Authentication
        if (!profile) {
            if (text.startsWith("/start")) {
                await sendTelegramMessage(chatId, "¡Hola! Soy *FinyBot*. 👋\n\nPara empezar a gestionar tus finanzas desde aquí, necesito que vincules tu cuenta.\n\nEscribe:\n`/login correo@ejemplo.com contraseña`\n\n_(Tus datos están seguros y se usan para autenticarte con Supabase)_");
                return NextResponse.json({ ok: true });
            }

            if (text.startsWith("/login")) {
                const parts = text.split(" ");
                if (parts.length < 3) {
                    await sendTelegramMessage(chatId, "⚠️ Formato incorrecto. Usa: `/login email password`.");
                    return NextResponse.json({ ok: true });
                }

                const email = parts[1];
                const password = parts[2];

                try {
                    // Verify credentials using Supabase Auth
                    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                        email,
                        password,
                    });

                    if (authError || !authData.user) {
                        await sendTelegramMessage(chatId, "❌ Credenciales incorrectas. Vuelve a intentarlo.");
                        return NextResponse.json({ ok: true });
                    }

                    // Link chat_id to profile
                    const { error: updateError } = await supabase
                        .from("profiles")
                        .update({ telegram_chat_id: chatId.toString() })
                        .eq("id", authData.user.id);

                    if (updateError) throw updateError;

                    await sendTelegramMessage(chatId, `✅ ¡Vinculación exitosa! Bienvenido, *${authData.user.user_metadata?.full_name || email}*.\n\nYa puedes preguntarme cosas como:\n- ¿Cuánto he gastado este mes?\n- Apunta 15€ en gasolina\n- ¿Cómo van mis metas?`);
                } catch (err) {
                    console.error(err);
                    await sendTelegramMessage(chatId, "❌ Error al vincular la cuenta. Inténtalo más tarde.");
                }
                return NextResponse.json({ ok: true });
            }

            await sendTelegramMessage(chatId, "🔒 Por favor, inicia sesión primero con `/login email password`.");
            return NextResponse.json({ ok: true });
        }

        // 3. User is linked -> Handle AI Chat
        if (text.startsWith("/")) {
            if (text === "/logout") {
                await supabase.from("profiles").update({ telegram_chat_id: null }).eq("id", profile.id);
                await sendTelegramMessage(chatId, "👋 Sesión cerrada. Tu cuenta ha sido desvinculada de este chat de Telegram.");
                return NextResponse.json({ ok: true });
            }
            // Other command handle or ignore
        }

        // Get context
        const context = await getFinancialContext(profile.id);
        const systemPrompt = buildSystemPrompt(context);

        // Call OpenAI
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: text }
                ],
                tools,
                tool_choice: "auto",
                temperature: 0.7,
            }),
        });

        const data = await response.json();
        const assistantMessage = data.choices[0]?.message;

        if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
            const toolResults = [];
            for (const toolCall of assistantMessage.tool_calls) {
                const args = JSON.parse(toolCall.function.arguments);
                const result = await executeTool(profile.id, toolCall.function.name, args);
                toolResults.push({
                    tool_call_id: toolCall.id,
                    role: "tool",
                    content: JSON.stringify(result),
                });
            }

            // Final response after tools
            const finalResponse = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: text },
                        assistantMessage,
                        ...toolResults
                    ],
                }),
            });

            const finalData = await finalResponse.json();
            await sendTelegramMessage(chatId, finalData.choices[0]?.message.content);
        } else {
            await sendTelegramMessage(chatId, assistantMessage.content);
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("Telegram Webhook Error:", err);
        return NextResponse.json({ ok: true }); // Always return 200 to Telegram
    }
}
