import { NextRequest, NextResponse } from "next/server";
import { getFinancialContext, buildSystemPrompt, tools, executeTool } from "@/lib/ai/finybot-engine";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { messages, userId } = await request.json();

    if (!messages || !userId) {
      return NextResponse.json({ error: "Messages and userId are required" }, { status: 400 });
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    // Get user's financial context using shared engine
    const context = await getFinancialContext(userId);
    const systemPrompt = buildSystemPrompt(context);

    // Initial call to detect tools
    const firstResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools,
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!firstResponse.ok) {
      const error = await firstResponse.text();
      console.error("OpenAI error:", error);
      return NextResponse.json({ error: "Failed to get AI response" }, { status: 500 });
    }

    const firstData = await firstResponse.json();
    const assistantMessage = firstData.choices[0]?.message;

    // Execute tools if needed
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolResults = [];

      for (const toolCall of assistantMessage.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments);
        const result = await executeTool(userId, toolCall.function.name, args);

        toolResults.push({
          tool_call_id: toolCall.id,
          role: "tool",
          content: JSON.stringify(result),
        });
      }

      // Stream the follow-up
      const followUpResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
            assistantMessage,
            ...toolResults,
          ],
          stream: true,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!followUpResponse.ok || !followUpResponse.body) {
        return NextResponse.json({ error: "Failed to get follow-up" }, { status: 500 });
      }

      return new Response(followUpResponse.body, {
        headers: { "Content-Type": "text/event-stream" }
      });
    }

    // No tool calls: stream directly
    const streamResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    return new Response(streamResponse.body, {
      headers: { "Content-Type": "text/event-stream" }
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
