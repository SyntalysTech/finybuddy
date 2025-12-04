import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Create Supabase client for server-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface FinancialContext {
  profile: {
    name: string;
    rule: string;
    createdAt: string;
  };
  currentMonth: {
    income: number;
    expenses: number;
    balance: number;
    savingsRate: number;
  };
  categories: {
    name: string;
    type: string;
    segment: string | null;
    totalSpent: number;
    operationCount: number;
  }[];
  savingsGoals: {
    name: string;
    target: number;
    current: number;
    progress: number;
    status: string;
    deadline: string | null;
  }[];
  debts: {
    name: string;
    originalAmount: number;
    currentBalance: number;
    interestRate: number;
    progress: number;
    status: string;
  }[];
  recentOperations: {
    concept: string;
    amount: number;
    type: string;
    category: string;
    date: string;
  }[];
  monthlyTrend: {
    month: string;
    income: number;
    expenses: number;
  }[];
}

async function getFinancialContext(userId: string): Promise<FinancialContext> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const startOfMonth = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
  const endOfMonth = new Date(currentYear, currentMonth, 0).toISOString().split("T")[0];

  // Fetch all data in parallel
  const [
    profileResult,
    operationsResult,
    categoriesResult,
    savingsGoalsResult,
    debtsResult,
    contributionsResult,
    paymentsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("operations").select("*, category:categories(name, type, segment)").eq("user_id", userId).order("operation_date", { ascending: false }).limit(500),
    supabase.from("categories").select("*").eq("user_id", userId).eq("is_active", true),
    supabase.from("savings_goals").select("*").eq("user_id", userId),
    supabase.from("debts").select("*").eq("user_id", userId),
    supabase.from("savings_contributions").select("*").eq("user_id", userId),
    supabase.from("debt_payments").select("*").eq("user_id", userId),
  ]);

  const profile = profileResult.data;
  const operations = operationsResult.data || [];
  const categories = categoriesResult.data || [];
  const savingsGoals = savingsGoalsResult.data || [];
  const debts = debtsResult.data || [];
  const contributions = contributionsResult.data || [];
  const payments = paymentsResult.data || [];

  // Calculate current month totals
  const currentMonthOps = operations.filter(op =>
    op.operation_date >= startOfMonth && op.operation_date <= endOfMonth
  );

  const monthlyIncome = currentMonthOps
    .filter(op => op.type === "income")
    .reduce((sum, op) => sum + op.amount, 0);

  const monthlyExpenses = currentMonthOps
    .filter(op => op.type === "expense")
    .reduce((sum, op) => sum + op.amount, 0);

  // Calculate category spending
  const categorySpending = categories.map(cat => {
    const catOps = operations.filter(op => op.category_id === cat.id);
    return {
      name: cat.name,
      type: cat.type,
      segment: cat.segment,
      totalSpent: catOps.reduce((sum, op) => sum + op.amount, 0),
      operationCount: catOps.length,
    };
  });

  // Process savings goals with contributions
  const processedGoals = savingsGoals.map(goal => {
    const goalContributions = contributions.filter(c => c.savings_goal_id === goal.id);
    const currentAmount = goalContributions.reduce((sum, c) => sum + c.amount, 0);
    return {
      name: goal.name,
      target: goal.target_amount,
      current: currentAmount,
      progress: goal.target_amount > 0 ? Math.round((currentAmount / goal.target_amount) * 100) : 0,
      status: goal.status,
      deadline: goal.target_date,
    };
  });

  // Process debts with payments
  const processedDebts = debts.map(debt => {
    const debtPayments = payments.filter(p => p.debt_id === debt.id);
    const totalPaid = debtPayments.reduce((sum, p) => sum + p.amount, 0);
    const currentBalance = debt.initial_amount - totalPaid;
    return {
      name: debt.name,
      originalAmount: debt.initial_amount,
      currentBalance: Math.max(0, currentBalance),
      interestRate: debt.interest_rate || 0,
      progress: debt.initial_amount > 0 ? Math.round((totalPaid / debt.initial_amount) * 100) : 0,
      status: debt.status,
    };
  });

  // Recent operations (last 20)
  const recentOps = operations.slice(0, 20).map(op => {
    const cat = Array.isArray(op.category) ? op.category[0] : op.category;
    return {
      concept: op.concept,
      amount: op.amount,
      type: op.type,
      category: cat?.name || "Sin categoría",
      date: op.operation_date,
    };
  });

  // Monthly trend (last 6 months)
  const monthlyTrend: { month: string; income: number; expenses: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentYear, currentMonth - 1 - i, 1);
    const monthStart = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split("T")[0];

    const monthOps = operations.filter(op =>
      op.operation_date >= monthStart && op.operation_date <= monthEnd
    );

    monthlyTrend.push({
      month: date.toLocaleDateString("es-ES", { month: "short", year: "numeric" }),
      income: monthOps.filter(op => op.type === "income").reduce((sum, op) => sum + op.amount, 0),
      expenses: monthOps.filter(op => op.type === "expense").reduce((sum, op) => sum + op.amount, 0),
    });
  }

  return {
    profile: {
      name: profile?.full_name || "Usuario",
      rule: `${profile?.rule_needs_percent || 50}/${profile?.rule_wants_percent || 30}/${profile?.rule_savings_percent || 20}`,
      createdAt: profile?.created_at || "",
    },
    currentMonth: {
      income: monthlyIncome,
      expenses: monthlyExpenses,
      balance: monthlyIncome - monthlyExpenses,
      savingsRate: monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100) : 0,
    },
    categories: categorySpending.filter(c => c.operationCount > 0).sort((a, b) => b.totalSpent - a.totalSpent),
    savingsGoals: processedGoals,
    debts: processedDebts,
    recentOperations: recentOps,
    monthlyTrend,
  };
}

function buildSystemPrompt(context: FinancialContext): string {
  const today = new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return `Eres FinyBot, el asistente financiero personal de ${context.profile.name} en FinyBuddy. Hoy es ${today}.

DATOS FINANCIEROS DEL USUARIO:

📊 RESUMEN DEL MES ACTUAL:
- Ingresos: ${context.currentMonth.income.toLocaleString("es-ES")} €
- Gastos: ${context.currentMonth.expenses.toLocaleString("es-ES")} €
- Balance: ${context.currentMonth.balance.toLocaleString("es-ES")} €
- Tasa de ahorro: ${context.currentMonth.savingsRate}%
- Regla financiera personal: ${context.profile.rule} (necesidades/deseos/ahorro)

📈 TENDENCIA ÚLTIMOS 6 MESES:
${context.monthlyTrend.map(m => `- ${m.month}: Ingresos ${m.income.toLocaleString("es-ES")} €, Gastos ${m.expenses.toLocaleString("es-ES")} €`).join("\n")}

🏷️ GASTOS POR CATEGORÍA (histórico):
${context.categories.length > 0
  ? context.categories.slice(0, 15).map(c => `- ${c.name} (${c.segment || c.type}): ${c.totalSpent.toLocaleString("es-ES")} € (${c.operationCount} operaciones)`).join("\n")
  : "No hay categorías con gastos registrados"}

🎯 METAS DE AHORRO:
${context.savingsGoals.length > 0
  ? context.savingsGoals.map(g => `- ${g.name}: ${g.current.toLocaleString("es-ES")} € de ${g.target.toLocaleString("es-ES")} € (${g.progress}%) - ${g.status}${g.deadline ? ` - Fecha límite: ${g.deadline}` : ""}`).join("\n")
  : "No hay metas de ahorro configuradas"}

💳 DEUDAS:
${context.debts.length > 0
  ? context.debts.map(d => `- ${d.name}: Debe ${d.currentBalance.toLocaleString("es-ES")} € de ${d.originalAmount.toLocaleString("es-ES")} € (${d.progress}% pagado)${d.interestRate > 0 ? ` - ${d.interestRate}% interés` : ""} - ${d.status}`).join("\n")
  : "No hay deudas registradas"}

📝 ÚLTIMAS OPERACIONES:
${context.recentOperations.slice(0, 10).map(op => `- ${op.date}: ${op.concept} - ${op.type === "expense" ? "-" : "+"}${op.amount.toLocaleString("es-ES")} € (${op.category})`).join("\n")}

INSTRUCCIONES:
1. Responde SIEMPRE en español de España, de forma cercana y amigable pero profesional
2. Usa los datos reales del usuario para dar consejos personalizados
3. Sé específico con números y porcentajes basados en sus datos
4. Si el usuario pregunta algo que no puedes saber (como predicciones exactas), sé honesto
5. Sugiere mejoras basadas en su situación real
6. Usa emojis moderadamente para hacer la conversación más amena
7. Si detectas patrones preocupantes (gastos excesivos, poca tasa de ahorro), menciónalos con tacto
8. Mantén respuestas concisas pero útiles (máximo 3-4 párrafos)
9. Si el usuario te saluda, preséntate brevemente y ofrece ayuda
10. Puedes hacer cálculos y proyecciones basadas en los datos históricos`;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, userId } = await request.json();

    if (!messages || !userId) {
      return NextResponse.json({ error: "Messages and userId are required" }, { status: 400 });
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    // Get user's financial context
    const context = await getFinancialContext(userId);
    const systemPrompt = buildSystemPrompt(context);

    // Call OpenAI API
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
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI error:", error);
      return NextResponse.json({ error: "Failed to get AI response" }, { status: 500 });
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content || "Lo siento, no pude generar una respuesta.";

    return NextResponse.json({ message: assistantMessage });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
