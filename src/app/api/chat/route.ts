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
    savings: number;
    balance: number;
    available: number;
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

  const monthlySavings = currentMonthOps
    .filter(op => op.type === "savings")
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
    // Use current_balance from DB (updated by trigger) or calculate from original_amount
    const currentBalance = debt.current_balance ?? (debt.original_amount - totalPaid);
    return {
      name: debt.name,
      originalAmount: debt.original_amount,
      currentBalance: Math.max(0, currentBalance),
      interestRate: debt.interest_rate || 0,
      progress: debt.original_amount > 0 ? Math.round((totalPaid / debt.original_amount) * 100) : 0,
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
      savings: monthlySavings,
      balance: monthlyIncome - monthlyExpenses,
      available: monthlyIncome - monthlyExpenses - monthlySavings,
      savingsRate: monthlyIncome > 0 ? Math.round((monthlySavings / monthlyIncome) * 100) : 0,
    },
    categories: categorySpending,
    savingsGoals: processedGoals,
    debts: processedDebts,
    recentOperations: recentOps,
    monthlyTrend,
  };
}

function buildSystemPrompt(context: FinancialContext): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const today = now.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const daysInMonth = new Date(currentYear, now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = daysInMonth - currentDay;
  const dailyBudget = daysRemaining > 0 ? Math.round(context.currentMonth.available / daysRemaining) : 0;

  const categoriesList = context.categories
    .map(c => `- "${c.name}" (${c.type}, ID: ${c.id})`)
    .join("\n");

  return `ROL: Eres FinyBot, el asistente financiero personal de ${context.profile.name} en FinyBuddy. Tu personalidad es una mezcla de Analista Financiero Senior y Amigo Inteligente. Eres cercano, divertido pero muy profesional y SIEMPRE VAS DIRECTO AL GRANO.

FECHA ACTUAL: ${today} (Ano ${currentYear})
IMPORTANTE FECHAS: Estamos en ${currentYear}. Si el usuario dice "enero", "febrero", etc. sin especificar ano, SIEMPRE usa ${currentYear}. Si dice "el mes pasado" en enero, seria diciembre ${currentYear - 1}.

TUS PRINCIPIOS FUNDAMENTALES:
1. DIRECTO AL GRANO: No saludes con "Hola, como estas?". Entra directo: "Ey ${context.profile.name}, he visto algo en tus cuentas..."
2. TRADUCTOR DE VALOR: Nunca hables solo de dinero. Traduce a Tiempo (horas de trabajo) o Experiencias (viajes, cenas, libertad).
3. PROACTIVIDAD RADAR: Anticipa problemas antes de que ocurran.
4. TONO: Profesional pero con "calle". Ironia fina, humor inteligente, empatia. Jamas condescendiente. Real, nunca robotico.
5. GAMIFICACION: Trata las finanzas como un juego de estrategia donde el objetivo es subir de nivel.

REGLA DE VERIFICACION: No tienes ojos en el mundo real. Solo ves movimientos.
- NUNCA afirmes: "No has ido al gimnasio"
- PREGUNTA/PROVOCA: "Estas amortizando la cuota del gym?"

DATOS FINANCIEROS DE ${context.profile.name.toUpperCase()}:

RESUMEN MES ACTUAL:
- Ingresos: ${context.currentMonth.income.toLocaleString("es-ES")} euros
- Gastos: ${context.currentMonth.expenses.toLocaleString("es-ES")} euros
- Ahorro registrado: ${context.currentMonth.savings.toLocaleString("es-ES")} euros
- Disponible real (ingresos - gastos - ahorro): ${context.currentMonth.available.toLocaleString("es-ES")} euros
- Tasa de ahorro: ${context.currentMonth.savingsRate}%
- Regla personal: ${context.profile.rule} (necesidades/deseos/ahorro)
- Dias restantes: ${daysRemaining} | Margen diario: ${dailyBudget} euros/dia

TENDENCIA 6 MESES:
${context.monthlyTrend.map(m => `${m.month}: +${m.income.toLocaleString("es-ES")} / -${m.expenses.toLocaleString("es-ES")}`).join(" | ")}

GASTOS POR CATEGORIA:
${context.categories.filter(c => c.operationCount > 0).length > 0
    ? context.categories.filter(c => c.operationCount > 0).slice(0, 10).map(c => `${c.name}: ${c.totalSpent.toLocaleString("es-ES")} euros (${c.operationCount} ops)`).join(" | ")
    : "Sin datos este mes"}

CATEGORIAS DISPONIBLES:
${categoriesList}

METAS DE AHORRO:
${context.savingsGoals.length > 0
    ? context.savingsGoals.map(g => `${g.name}: ${g.current.toLocaleString("es-ES")}/${g.target.toLocaleString("es-ES")} (${g.progress}%)`).join(" | ")
    : "Sin metas activas"}

DEUDAS:
${context.debts.length > 0
    ? context.debts.map(d => `${d.name}: debe ${d.currentBalance.toLocaleString("es-ES")} de ${d.originalAmount.toLocaleString("es-ES")} (${d.progress}% pagado)`).join(" | ")
    : "Sin deudas"}

ULTIMAS OPERACIONES (con ID):
${context.recentOperations.slice(0, 8).map(op => `[ID:${op.id}] ${op.date}: ${op.concept} ${op.type === "expense" ? "-" : "+"}${op.amount}`).join(" | ")}

=== FUNCIONES DISPONIBLES ===

OPERACIONES (create_operation):
- Registra gastos (type="expense"), ingresos (type="income") o ahorro (type="savings")
- FECHAS: Si el usuario dice "para el dia 15", "dentro de 5 dias", "el proximo viernes", calcula la fecha correcta en formato YYYY-MM-DD
- OPERACIONES FUTURAS: Puedes crear operaciones con fechas futuras sin problema

ELIMINAR (delete_operation): Busca por ID en las ultimas operaciones

METAS DE AHORRO:
- create_savings_goal: Nueva meta ("quiero ahorrar para X", "necesito juntar X euros")
- add_savings_contribution: Aportar a meta existente ("he metido X en mi ahorro de Y")

DEUDAS:
- create_debt: Nueva deuda ("debo X a Y", "tengo un prestamo de X")
- add_debt_payment: Pago de deuda ("he pagado X de mi deuda")

RECORDATORIOS:
- create_reminder: Recordatorio para pagos futuros ("recuerdame pagar X el dia Y", "avisame de la ITV en marzo")

=== DETECCION DE EMOCIONES Y RESPUESTAS ===

EVASION (no abre app en dias): "Se que da miedo mirar cuando has gastado mucho. Pero ignorarlo sale mas caro. Solo categoriza 1 gasto hoy."

STRESS SPENDING (muchos gastos pequenos): "Veo mucho delivery y taxi. Semana dura? Tu dinero me dice que estas agotado. Hoy cena en casa, tu salud y tu cuenta lo necesitan."

EUFORIA POST-NOMINA (gasto grande tras cobrar): "Cuidado, sentirte rico el dia 1 es peligroso. Ese dinero tiene que durar 30 dias. Bloquea el 20% en Ahorro AHORA."

TRACKING MANUAL (usuario categoriza): "Bien hecho! Categorizar te hace un 40% mas consciente. +10 XP de Gestor!"

FRUSTRACION (borra meta): "No pasa nada. Borrar la meta no es fracasar, es recalcular. Creamos una mas pequena?"

LOGRO (30 dias sin rojos): "Hace un mes estabas sufriendo. Hoy tienes el control. Sientete orgulloso!"

=== RESPUESTAS POR TIPO DE GASTO ===

VAMPIROS DIARIOS (cafes, kiosco <3 euros): "5 cafes esta semana = 15 euros. Te dan la vida o es inercia? En un ano es un vuelo."

SUSCRIPCIONES: "Cargo del gym detectado. Has ido esta semana o estamos patrocinando el local?"

DELIVERY: "Tercer pedido de la semana. La pereza sale cara. Diferencia vs super: +40 euros."

COMPRAS NOCTURNAS (>23h): "Shopping nocturno detectado. Necesidad o terapia? Dejalo en el carrito hasta manana."

BNPL (Klarna/Aplazame): "Trampa mental: si tienes que fraccionar 50 euros, es que no te lo puedes permitir."

DIA DE COBRO: "Dia de cobro! Regla de oro: Pagate a ti primero. Mueve el 10-20% a Ahorro ANTES de gastar."

NUMEROS ROJOS: "ALERTA! El banco te va a crujir a comisiones. Cubre el descubierto YA."

=== BOTONES RAPIDOS ===

"Cuanto puedo gastar hoy?": Calcula ${dailyBudget} euros/dia. Si no hay datos: "Registra tus ingresos y te digo al centimo!"

"Como voy este mes?": Resumen rapido con contexto emocional segun estado.

"Cual es mi mayor fuga?": Categoria con mas gasto + traduccion a experiencias.

"Reto semanal": Reto divertido y alcanzable para ahorrar 10-20 euros.

=== REGLAS FINALES ===

1. USA SIEMPRE las funciones para registrar datos. NUNCA simules que registraste algo.
2. CONFIRMA cada registro: "Hecho! X pavos apuntados en [categoria]. Seguimos!"
3. NUNCA juzgues. Si hay problemas, apoyo + solucion.
4. BREVEDAD: Maximo 2-3 parrafos cortos. WhatsApp style.
5. SIEMPRE en euros con el simbolo correcto.
6. Si preguntan por inversiones/cripto/bolsa: "Ahi no soy experto. Mi rollo es ayudarte con el dia a dia. Para inversiones, mejor un especialista!"
7. Termina con energia: "Cualquier cosa aqui estoy!", "Seguimos dandole!", "A por ello!"`;
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
  },
  {
    type: "function",
    function: {
      name: "create_savings_goal",
      description: "Crea una nueva meta de ahorro para el usuario. Usa esta funcion cuando el usuario quiera crear un objetivo de ahorro (ej: 'quiero ahorrar para unas vacaciones', 'voy a ahorrar para un coche').",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Nombre de la meta de ahorro (ej: 'Vacaciones', 'Fondo de emergencia', 'Coche nuevo')"
          },
          target_amount: {
            type: "number",
            description: "Cantidad objetivo a ahorrar en euros"
          },
          target_date: {
            type: "string",
            description: "Fecha limite opcional en formato YYYY-MM-DD. Puede ser null si no hay fecha limite."
          }
        },
        required: ["name", "target_amount"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_savings_contribution",
      description: "Añade un aporte a una meta de ahorro existente. Usa esta funcion cuando el usuario quiera añadir dinero a una de sus metas de ahorro.",
      parameters: {
        type: "object",
        properties: {
          savings_goal_name: {
            type: "string",
            description: "Nombre de la meta de ahorro a la que añadir el aporte. Busca en las METAS DE AHORRO del usuario."
          },
          amount: {
            type: "number",
            description: "Cantidad a aportar en euros"
          },
          note: {
            type: "string",
            description: "Nota opcional sobre el aporte"
          }
        },
        required: ["savings_goal_name", "amount"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_debt",
      description: "Crea una nueva deuda para el usuario. Usa esta funcion cuando el usuario quiera registrar una deuda (ej: 'debo 500 euros a mi hermano', 'tengo un prestamo de 10000 euros').",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Nombre o descripcion de la deuda (ej: 'Prestamo coche', 'Deuda con Juan', 'Tarjeta de credito')"
          },
          initial_amount: {
            type: "number",
            description: "Cantidad total de la deuda en euros"
          },
          interest_rate: {
            type: "number",
            description: "Tasa de interes anual en porcentaje. Usar 0 si no tiene intereses."
          },
          due_date: {
            type: "string",
            description: "Fecha de vencimiento opcional en formato YYYY-MM-DD"
          }
        },
        required: ["name", "initial_amount"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_debt_payment",
      description: "Registra un pago de una deuda existente. Usa esta funcion cuando el usuario quiera registrar que ha pagado parte de una deuda.",
      parameters: {
        type: "object",
        properties: {
          debt_name: {
            type: "string",
            description: "Nombre de la deuda a la que añadir el pago. Busca en las DEUDAS del usuario."
          },
          amount: {
            type: "number",
            description: "Cantidad pagada en euros"
          },
          note: {
            type: "string",
            description: "Nota opcional sobre el pago"
          }
        },
        required: ["debt_name", "amount"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_reminder",
      description: "Crea un recordatorio en el calendario del usuario. Usa esta funcion cuando el usuario quiera que le recuerdes un pago, renovacion o cualquier evento financiero futuro (ej: 'recuerdame pagar la ITV en marzo', 'avisame del seguro del coche', 'recordatorio para pagar el alquiler').",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Nombre del recordatorio (ej: 'Pagar ITV', 'Renovar seguro coche', 'Cuota gym')"
          },
          reminder_date: {
            type: "string",
            description: "Fecha del recordatorio en formato YYYY-MM-DD. Calcula la fecha correcta segun lo que diga el usuario."
          },
          description: {
            type: "string",
            description: "Descripcion opcional con mas detalles del recordatorio"
          },
          amount: {
            type: "number",
            description: "Importe estimado del pago en euros (opcional)"
          },
          recurrence: {
            type: "string",
            enum: ["monthly", "quarterly", "yearly"],
            description: "Frecuencia de recurrencia opcional: monthly (mensual), quarterly (trimestral), yearly (anual)"
          }
        },
        required: ["name", "reminder_date"]
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

// Function to create a savings goal
async function executeCreateSavingsGoal(
  userId: string,
  args: {
    name: string;
    target_amount: number;
    target_date?: string;
  }
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from("savings_goals")
    .insert({
      user_id: userId,
      name: args.name,
      target_amount: args.target_amount,
      target_date: args.target_date || null,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating savings goal:", error);
    return { success: false, error: error.message };
  }

  return { success: true, savings_goal: data };
}

// Function to add a contribution to a savings goal
async function executeAddSavingsContribution(
  userId: string,
  args: {
    savings_goal_name: string;
    amount: number;
    note?: string;
  }
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Find the savings goal by name
  const { data: goals, error: findError } = await supabase
    .from("savings_goals")
    .select("id, name")
    .eq("user_id", userId)
    .ilike("name", `%${args.savings_goal_name}%`);

  if (findError || !goals || goals.length === 0) {
    return { success: false, error: `No se encontro ninguna meta de ahorro con el nombre "${args.savings_goal_name}"` };
  }

  const goal = goals[0];

  const { data, error } = await supabase
    .from("savings_contributions")
    .insert({
      savings_goal_id: goal.id,
      user_id: userId,
      amount: args.amount,
      note: args.note || null,
      contribution_date: new Date().toISOString().split("T")[0],
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding savings contribution:", error);
    return { success: false, error: error.message };
  }

  return { success: true, contribution: data, goal_name: goal.name };
}

// Function to create a debt
async function executeCreateDebt(
  userId: string,
  args: {
    name: string;
    initial_amount: number;
    interest_rate?: number;
    due_date?: string;
  }
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from("debts")
    .insert({
      user_id: userId,
      name: args.name,
      original_amount: args.initial_amount,
      current_balance: args.initial_amount,
      interest_rate: args.interest_rate || 0,
      due_date: args.due_date || null,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating debt:", error);
    return { success: false, error: error.message };
  }

  return { success: true, debt: data };
}

// Function to add a payment to a debt
async function executeAddDebtPayment(
  userId: string,
  args: {
    debt_name: string;
    amount: number;
    note?: string;
  }
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Find the debt by name
  const { data: debts, error: findError } = await supabase
    .from("debts")
    .select("id, name, initial_amount")
    .eq("user_id", userId)
    .ilike("name", `%${args.debt_name}%`);

  if (findError || !debts || debts.length === 0) {
    return { success: false, error: `No se encontro ninguna deuda con el nombre "${args.debt_name}"` };
  }

  const debt = debts[0];

  const { data, error } = await supabase
    .from("debt_payments")
    .insert({
      debt_id: debt.id,
      user_id: userId,
      amount: args.amount,
      note: args.note || null,
      payment_date: new Date().toISOString().split("T")[0],
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding debt payment:", error);
    return { success: false, error: error.message };
  }

  return { success: true, payment: data, debt_name: debt.name };
}

// Function to create a calendar reminder
async function executeCreateReminder(
  userId: string,
  args: {
    name: string;
    reminder_date: string;
    description?: string;
    amount?: number;
    recurrence?: "monthly" | "quarterly" | "yearly";
  }
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from("calendar_reminders")
    .insert({
      user_id: userId,
      name: args.name,
      reminder_date: args.reminder_date,
      description: args.description || null,
      amount: args.amount || null,
      recurrence: args.recurrence || null,
      is_completed: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating reminder:", error);
    return { success: false, error: error.message };
  }

  return { success: true, reminder: data };
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
        } else if (toolCall.function.name === "create_savings_goal") {
          result = await executeCreateSavingsGoal(userId, args);
        } else if (toolCall.function.name === "add_savings_contribution") {
          result = await executeAddSavingsContribution(userId, args);
        } else if (toolCall.function.name === "create_debt") {
          result = await executeCreateDebt(userId, args);
        } else if (toolCall.function.name === "add_debt_payment") {
          result = await executeAddDebtPayment(userId, args);
        } else if (toolCall.function.name === "create_reminder") {
          result = await executeCreateReminder(userId, args);
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
