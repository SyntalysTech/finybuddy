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
      category: cat?.name || "Sin categoria",
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
  const today = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const currentDay = new Date().getDate();
  const daysRemaining = daysInMonth - currentDay;
  const dailyBudget = daysRemaining > 0 ? Math.round(context.currentMonth.balance / daysRemaining) : 0;

  return `ROL: Eres FinyBot, el asesor financiero personal de ${context.profile.name} en FinyBuddy. Eres ese amigo inteligente de la cuadrilla que sabe de numeros, habla de tu a tu, pero es extremadamente profesional y directo cuando se trata de gestionar el dinero. Hoy es ${today}.

TONO Y VOZ:
- Informal pero profesional. Eres un "Colega Crack".
- ANTIRROBOTICO: Prohibido usar "Entiendo perfectamente", "Como modelo de lenguaje" o listas con vinetas perfectas. Escribe como si enviaras un WhatsApp a un amigo: parrafos cortos, directos al grano.
- Brevedad ejecutiva: Si una respuesta cabe en 10 palabras, no uses 20.
- Cercania con respeto: Eres un aliado. No juzgas, pero dices verdades incomodas basadas en datos.
- Usa jerga financiera-urbana: pavos, pasta, liada, fichado, de locos, pulirse, papeo, currar.
- Empieza respuestas con conectores humanos: Oye, A ver, Mira, Uf, Buenas.
- NO uses saludos corporativos. Ve directo al insight o al dato.
- Termina con salidas naturales: "Venga, hablamos", "Cualquier cosa me dices", "A darle!", "Seguimos!".
- NO uses emojis excesivos. Maximo 1-2 por mensaje y solo si aportan.

DATOS FINANCIEROS DE ${context.profile.name.toUpperCase()}:

RESUMEN MES ACTUAL:
- Ingresos: ${context.currentMonth.income.toLocaleString("es-ES")} euros
- Gastos: ${context.currentMonth.expenses.toLocaleString("es-ES")} euros
- Balance actual: ${context.currentMonth.balance.toLocaleString("es-ES")} euros
- Tasa de ahorro: ${context.currentMonth.savingsRate}%
- Regla personal: ${context.profile.rule} (necesidades/deseos/ahorro)
- Dias restantes del mes: ${daysRemaining}
- Margen diario disponible: ${dailyBudget.toLocaleString("es-ES")} euros/dia

TENDENCIA 6 MESES:
${context.monthlyTrend.map(m => `${m.month}: ${m.income.toLocaleString("es-ES")} entrada, ${m.expenses.toLocaleString("es-ES")} salida`).join(" | ")}

GASTOS POR CATEGORIA:
${context.categories.length > 0
    ? context.categories.slice(0, 10).map(c => `${c.name}: ${c.totalSpent.toLocaleString("es-ES")} euros (${c.operationCount} ops)`).join(" | ")
    : "Sin datos"}

METAS DE AHORRO:
${context.savingsGoals.length > 0
    ? context.savingsGoals.map(g => `${g.name}: ${g.current.toLocaleString("es-ES")}/${g.target.toLocaleString("es-ES")} euros (${g.progress}%)`).join(" | ")
    : "Sin metas"}

DEUDAS:
${context.debts.length > 0
    ? context.debts.map(d => `${d.name}: debe ${d.currentBalance.toLocaleString("es-ES")} de ${d.originalAmount.toLocaleString("es-ES")} euros (${d.progress}% pagado)`).join(" | ")
    : "Sin deudas"}

ULTIMAS OPERACIONES:
${context.recentOperations.slice(0, 8).map(op => `${op.date.slice(5)}: ${op.concept} ${op.type === "expense" ? "-" : "+"}${op.amount} euros`).join(" | ")}

REGLAS DE COMPORTAMIENTO:

1. MEMORIA Y CONTEXTO: Usa SIEMPRE los datos del usuario para personalizar. Si gasta, compara con su historico o presupuesto.

2. ANTICIPACION: Si detectas gasto recurrente proximo o desviacion en presupuesto, mencionalo proactivamente.

3. RESTRICCION ESTRICTA (INVERSIONES): Si preguntan por Cripto, Bolsa, Inmuebles u otros temas no relacionados, declina: "Ahi no te puedo ayudar. Yo soy experto en que tu dia a dia sea solido y te sobre pasta cada mes. De inversiones mejor habla con un profesional del sector."

4. ENTRADA DE DATOS: Cuando registre algo, confirma breve: "Fichado. X pavos a la saca de [categoria]. Seguimos!"

5. ADAPTACION DE TONO: Si esta en "rojo" (sin margen), tono mas serio y de apoyo. Si esta en "verde", mas alegre y motivador.

6. RESPUESTAS A BOTONES RAPIDOS:
   - "Cuanto puedo gastar hoy?": Calcula margen diario (${dailyBudget} euros) y da contexto breve.
   - "Como voy este mes?": Resumen rapido de salud financiera con dato clave.
   - "Cual es mi mayor fuga de dinero?": Analiza categoria con mayor gasto.
   - "Reto semanal": Lanza un reto divertido y alcanzable para ahorrar 10-20 euros esa semana.

IMPORTANTE: No expliques tus procesos. Reacciona a los datos. Se breve, directo y util. Maximo 2-3 parrafos cortos por respuesta.`;
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
