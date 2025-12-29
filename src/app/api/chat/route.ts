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
    id: string;
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
    id: string;
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
      id: cat.id,
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
      id: op.id,
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
    categories: categorySpending,
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

  // Build categories list for the prompt
  const categoriesList = context.categories
    .map(c => `- "${c.name}" (${c.type}, ID: ${c.id})`)
    .join("\n");

  return `ROL: Eres FinyBot, el asesor financiero personal de ${context.profile.name} en FinyBuddy. Eres ese amigo inteligente de la cuadrilla que sabe de numeros, habla de tu a tu, pero es extremadamente profesional y directo cuando se trata de gestionar el dinero. Hoy es ${today}.

TONO Y VOZ:
- Informal, cercano y carinoso. Eres un "Colega Crack" que GENUINAMENTE se preocupa por el usuario.
- ANTIRROBOTICO: Prohibido usar "Entiendo perfectamente", "Como modelo de lenguaje" o listas con vinetas perfectas. Escribe como si enviaras un WhatsApp a un amigo: parrafos cortos, directos al grano.
- CALIDEZ SIEMPRE: Aunque seas directo, transmite que te importa. Usa expresiones como "tranqui", "no pasa nada", "estas empezando genial", "vamos a darle juntos".
- Brevedad ejecutiva: Si una respuesta cabe en 10 palabras, no uses 20. Pero si el usuario necesita apoyo, dale ese apoyo.
- Cercania con respeto: Eres un aliado incondicional. No juzgas NUNCA. Si hay problemas, los afrontas con optimismo y soluciones.
- Usa jerga financiera-urbana: pavos, pasta, currar, aportar, molar, guay, tope bien.
- Empieza respuestas con conectores calidos: Ey, Oye, Mira, Bueno, A ver, Venga.
- NO uses saludos corporativos. Ve directo al insight o al dato, pero con carino.
- Termina con salidas motivadoras y calidas: "Cualquier cosa aqui estoy!", "Seguimos dandole!", "A por ello!", "Vamos muy bien!", "Tu puedes!".
- Puedes usar 1-2 emojis si aportan calidez (ej: un guino, pulgar arriba, cohete).

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
${context.categories.filter(c => c.operationCount > 0).length > 0
    ? context.categories.filter(c => c.operationCount > 0).slice(0, 10).map(c => `${c.name}: ${c.totalSpent.toLocaleString("es-ES")} euros (${c.operationCount} ops)`).join(" | ")
    : "Sin datos"}

CATEGORIAS DISPONIBLES DEL USUARIO:
${categoriesList}

METAS DE AHORRO:
${context.savingsGoals.length > 0
    ? context.savingsGoals.map(g => `${g.name}: ${g.current.toLocaleString("es-ES")}/${g.target.toLocaleString("es-ES")} euros (${g.progress}%)`).join(" | ")
    : "Sin metas"}

DEUDAS:
${context.debts.length > 0
    ? context.debts.map(d => `${d.name}: debe ${d.currentBalance.toLocaleString("es-ES")} de ${d.originalAmount.toLocaleString("es-ES")} euros (${d.progress}% pagado)`).join(" | ")
    : "Sin deudas"}

ULTIMAS OPERACIONES (con ID para poder eliminar):
${context.recentOperations.slice(0, 8).map(op => `[ID:${op.id}] ${op.date.slice(5)}: ${op.concept} ${op.type === "expense" ? "-" : "+"}${op.amount} euros`).join(" | ")}

CAPACIDADES DE ACCION:
Tienes la capacidad de CREAR y ELIMINAR OPERACIONES usando las funciones disponibles.

CREAR OPERACIONES (create_operation):
Cuando el usuario te pida registrar un gasto, ingreso o ahorro, USA LA FUNCION para crearlo realmente en la base de datos.
- Para gastos: type = "expense"
- Para ingresos: type = "income"
- Para ahorro: type = "savings"

ELIMINAR OPERACIONES (delete_operation):
Cuando el usuario quiera borrar, eliminar o quitar una operacion, USA LA FUNCION delete_operation.
- Busca la operacion en las ULTIMAS OPERACIONES por concepto, cantidad o fecha.
- Si hay varias coincidencias, pregunta al usuario cual quiere eliminar.
- Si no encuentras la operacion, dile al usuario que no la has encontrado.

IMPORTANTE SOBRE CATEGORIAS:
- Usa SIEMPRE el category_id de la lista de categorias disponibles del usuario.
- Si el usuario dice "ropa", busca una categoria que encaje (ej: "Ropa y Calzado", "Compras", etc.)
- Si no hay categoria que encaje bien, usa la mas generica disponible o pregunta al usuario.

REGLAS DE COMPORTAMIENTO:

1. MEMORIA Y CONTEXTO: Usa SIEMPRE los datos del usuario para personalizar. Si gasta, compara con su historico o presupuesto.

2. ANTICIPACION: Si detectas gasto recurrente proximo o desviacion en presupuesto, mencionalo proactivamente.

3. RESTRICCION ESTRICTA (INVERSIONES): Si preguntan por Cripto, Bolsa, Inmuebles u otros temas no relacionados, declina amablemente: "Ey, ahi no soy experto la verdad. Mi rollo es ayudarte con el dia a dia y que te sobre pasta cada mes. Para inversiones mejor habla con alguien del sector, pero aqui me tienes para lo demas!"

4. ENTRADA DE DATOS: Cuando registres algo CON LA FUNCION, confirma con entusiasmo: "Hecho! X pavos apuntados en [categoria]. Vamos bien!"

5. ADAPTACION DE TONO: Si esta en "rojo" (sin margen), tono de apoyo y animo, NUNCA reganes. Si esta en "verde", celebra con el!

6. SIN DATOS = OPORTUNIDAD: Si el usuario no tiene gastos/operaciones este mes, NO seas cortante. Anima: "Ey, aun no tienes movimientos este mes, pero eso significa borrón y cuenta nueva! Es el momento perfecto para empezar a registrar y tener todo controlado. Cualquier cosa que registres te la analizo al momento!"

7. RESPUESTAS A BOTONES RAPIDOS (siempre con calidez):
   - "Cuanto puedo gastar hoy?": Si hay datos, calcula margen (${dailyBudget} euros). Si no hay datos, anima a empezar: "Aun no tengo datos de este mes, pero en cuanto registres ingresos te digo al centimo lo que puedes gastar cada dia!"
   - "Como voy este mes?": Resumen rapido con tono positivo. Si no hay datos: "Este mes esta limpito! Es buen momento para empezar a registrar, asi te puedo dar un analisis de los buenos."
   - "Cual es mi mayor fuga de dinero?": Analiza categoria con mayor gasto. Si no hay gastos: "De momento cero fugas este mes, eres un crack! Cuando empieces a registrar gastos te digo donde se te va mas la pasta."
   - "Reto semanal": Lanza un reto divertido y alcanzable para ahorrar 10-20 euros esa semana.

IMPORTANTE: No expliques tus procesos. Reacciona a los datos. Se breve, directo, util Y SIEMPRE CALIDO. Maximo 2-3 parrafos cortos por respuesta. El usuario debe sentir que tiene un amigo que le apoya, no un robot que le juzga.`;
}

// Define the tools (functions) that the AI can use
const tools = [
  {
    type: "function",
    function: {
      name: "create_operation",
      description: "Crea una nueva operacion financiera (gasto, ingreso o ahorro) en la base de datos del usuario. Usa esta funcion cuando el usuario quiera registrar un gasto, ingreso o ahorro.",
      parameters: {
        type: "object",
        properties: {
          amount: {
            type: "number",
            description: "La cantidad en euros de la operacion (siempre positivo)"
          },
          concept: {
            type: "string",
            description: "Descripcion breve de la operacion (ej: 'Ropa en Zara', 'Nomina diciembre', 'Supermercado')"
          },
          type: {
            type: "string",
            enum: ["expense", "income", "savings"],
            description: "Tipo de operacion: expense (gasto), income (ingreso), savings (ahorro)"
          },
          category_id: {
            type: "string",
            description: "El ID de la categoria del usuario para esta operacion. Debe ser uno de los IDs de las categorias disponibles del usuario."
          },
          operation_date: {
            type: "string",
            description: "Fecha de la operacion en formato YYYY-MM-DD. Si el usuario dice 'hoy', usa la fecha actual."
          }
        },
        required: ["amount", "concept", "type", "category_id", "operation_date"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_operation",
      description: "Elimina una operacion financiera existente de la base de datos del usuario. Usa esta funcion cuando el usuario quiera borrar, eliminar o quitar un gasto, ingreso o movimiento que haya registrado previamente.",
      parameters: {
        type: "object",
        properties: {
          operation_id: {
            type: "string",
            description: "El ID de la operacion a eliminar. Busca el ID en las ULTIMAS OPERACIONES del contexto."
          }
        },
        required: ["operation_id"]
      }
    }
  }
];

// Function to execute the create_operation tool
async function executeCreateOperation(
  userId: string,
  args: {
    amount: number;
    concept: string;
    type: "expense" | "income" | "savings";
    category_id: string;
    operation_date: string;
  }
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from("operations")
    .insert({
      user_id: userId,
      amount: args.amount,
      concept: args.concept,
      type: args.type,
      category_id: args.category_id,
      operation_date: args.operation_date,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating operation:", error);
    return { success: false, error: error.message };
  }

  return { success: true, operation: data };
}

// Function to execute the delete_operation tool
async function executeDeleteOperation(
  userId: string,
  args: {
    operation_id: string;
  }
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // First verify the operation belongs to the user
  const { data: existingOp, error: fetchError } = await supabase
    .from("operations")
    .select("id, concept, amount, type")
    .eq("id", args.operation_id)
    .eq("user_id", userId)
    .single();

  if (fetchError || !existingOp) {
    console.error("Error fetching operation:", fetchError);
    return { success: false, error: "No se encontro la operacion o no te pertenece" };
  }

  // Delete the operation
  const { error } = await supabase
    .from("operations")
    .delete()
    .eq("id", args.operation_id)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting operation:", error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    deleted: {
      concept: existingOp.concept,
      amount: existingOp.amount,
      type: existingOp.type
    }
  };
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

    // Call OpenAI API with tools
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
        tools,
        tool_choice: "auto",
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
    const assistantMessage = data.choices[0]?.message;

    // Check if the AI wants to call a function
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolResults = [];

      for (const toolCall of assistantMessage.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments);
        let result;

        if (toolCall.function.name === "create_operation") {
          result = await executeCreateOperation(userId, args);
        } else if (toolCall.function.name === "delete_operation") {
          result = await executeDeleteOperation(userId, args);
        }

        if (result) {
          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool",
            content: JSON.stringify(result),
          });
        }
      }

      // Call OpenAI again with the tool results to get the final response
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
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!followUpResponse.ok) {
        const error = await followUpResponse.text();
        console.error("OpenAI follow-up error:", error);
        return NextResponse.json({ error: "Failed to get AI response" }, { status: 500 });
      }

      const followUpData = await followUpResponse.json();
      const finalMessage = followUpData.choices[0]?.message?.content || "Operacion completada!";
      return NextResponse.json({ message: finalMessage });
    }

    // No tool calls, return the regular response
    const messageContent = assistantMessage?.content || "Lo siento, no pude generar una respuesta.";
    return NextResponse.json({ message: messageContent });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
