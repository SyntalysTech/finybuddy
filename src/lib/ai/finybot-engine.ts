import { createClient } from "@supabase/supabase-js";

// Use service role key for backend AI operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface FinancialContext {
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
        monthlyPayment: number;
        progress: number;
        status: string;
        creditor: string | null;
        debtType: string;
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

export async function getFinancialContext(userId: string): Promise<FinancialContext> {
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
        const currentBalance = debt.current_balance ?? (debt.original_amount - totalPaid);
        return {
            name: debt.name,
            originalAmount: debt.original_amount,
            currentBalance: Math.max(0, currentBalance),
            interestRate: Number(debt.interest_rate) || 0,
            monthlyPayment: Number(debt.monthly_payment) || 0,
            progress: debt.original_amount > 0 ? Math.round((totalPaid / debt.original_amount) * 100) : 0,
            status: debt.status,
            creditor: debt.creditor,
            debtType: debt.debt_type,
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

    // Monthly trend
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
            balance: monthlyIncome - monthlyExpenses - monthlySavings,
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

export function buildSystemPrompt(context: FinancialContext): string {
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

GASTOS POR CATEGORIA (Top 10):
${context.categories.filter(c => c.operationCount > 0).length > 0
            ? context.categories
                .filter(c => c.operationCount > 0)
                .sort((a, b) => b.totalSpent - a.totalSpent)
                .slice(0, 10)
                .map(c => `${c.name}: ${c.totalSpent.toLocaleString("es-ES")} euros (${c.operationCount} ops)`)
                .join(" | ")
            : "Sin datos este mes"}

CATEGORIAS DISPONIBLES:
${categoriesList}

METAS DE AHORRO:
${context.savingsGoals.length > 0
            ? context.savingsGoals.map(g => `${g.name}: ${g.current.toLocaleString("es-ES")}/${g.target.toLocaleString("es-ES")} (${g.progress}%)`).join(" | ")
            : "Sin metas activas"}

DEUDAS CONFIGURADAS (Gestor de deudas):
${context.debts.length > 0
            ? context.debts.map(d => `- ${d.name}: Acreedor: ${d.creditor || 'No especificado'} | Total: ${d.originalAmount}€ | Pendiente: ${d.currentBalance}€ | Interes: ${d.interestRate}% | Cuota mensual: ${d.monthlyPayment}€ | Tipo: ${d.debtType} | Progreso: ${d.progress}% pagado | Estado: ${d.status}`).join("\n")
            : "Sin deudas configuradas en el gestor."}

ULTIMAS OPERACIONES (con ID):
${context.recentOperations.slice(0, 8).map(op => `[ID:${op.id}] ${op.date}: ${op.concept} ${op.type === "expense" ? "-" : "+"}${op.amount}`).join(" | ")}

=== FUNCIONES DISPONIBLES ===
- create_operation: Registra gastos, ingresos o ahorro.
- delete_operation: Borra por ID.
- create_savings_goal: Nueva meta.
- add_savings_contribution: Aporte a meta.
- create_debt: Nueva deuda.
- add_debt_payment: Pago de deuda.
- create_reminder: Recordatorio.

=== REGLAS FINAL ===
1. USA SIEMPRE las funciones para registrar datos.
2. CONFIRMA cada registro.
3. BREVEDAD: WhatsApp style.
4. CATEGORIZACIÓN OBLIGATORIA.
5. INDEPENDENCIA DE DATOS Y PRECISIÓN EN DEUDAS. `;
}

export const tools = [
    {
        type: "function",
        function: {
            name: "create_operation",
            description: "Crea una nueva operacion financiera (gasto, ingreso o ahorro).",
            parameters: {
                type: "object",
                properties: {
                    amount: { type: "number" },
                    concept: { type: "string" },
                    type: { type: "string", enum: ["expense", "income", "savings"] },
                    category_id: { type: "string" },
                    operation_date: { type: "string" }
                },
                required: ["amount", "concept", "type", "category_id", "operation_date"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "delete_operation",
            description: "Elimina una operacion financiera existente por ID.",
            parameters: {
                type: "object",
                properties: {
                    operation_id: { type: "string" }
                },
                required: ["operation_id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "create_savings_goal",
            description: "Crea una nueva meta de ahorro.",
            parameters: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    target_amount: { type: "number" },
                    target_date: { type: "string" }
                },
                required: ["name", "target_amount"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "add_savings_contribution",
            description: "Añade un aporte a una meta de ahorro.",
            parameters: {
                type: "object",
                properties: {
                    savings_goal_name: { type: "string" },
                    amount: { type: "number" },
                    note: { type: "string" }
                },
                required: ["savings_goal_name", "amount"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "create_debt",
            description: "Crea una nueva deuda.",
            parameters: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    initial_amount: { type: "number" },
                    interest_rate: { type: "number" },
                    monthly_payment: { type: "number" },
                    creditor: { type: "string" },
                    due_date: { type: "string" }
                },
                required: ["name", "initial_amount"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "add_debt_payment",
            description: "Registra un pago de una deuda.",
            parameters: {
                type: "object",
                properties: {
                    debt_name: { type: "string" },
                    amount: { type: "number" },
                    note: { type: "string" }
                },
                required: ["debt_name", "amount"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "create_reminder",
            description: "Crea un recordatorio en el calendario.",
            parameters: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    reminder_date: { type: "string" },
                    description: { type: "string" },
                    amount: { type: "number" },
                    recurrence: { type: "string", enum: ["monthly", "quarterly", "yearly"] }
                },
                required: ["name", "reminder_date"]
            }
        }
    }
];

export async function executeTool(userId: string, functionName: string, args: any) {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (functionName) {
        case "create_operation": {
            const { data, error } = await supabase.from("operations").insert({
                user_id: userId,
                amount: args.amount,
                concept: args.concept,
                type: args.type,
                category_id: args.category_id,
                operation_date: args.operation_date,
            }).select().single();
            return error ? { success: false, error: error.message } : { success: true, operation: data };
        }

        case "delete_operation": {
            const { error } = await supabase.from("operations").delete().eq("id", args.operation_id).eq("user_id", userId);
            return error ? { success: false, error: error.message } : { success: true };
        }

        case "create_savings_goal": {
            const { data, error } = await supabase.from("savings_goals").insert({
                user_id: userId,
                name: args.name,
                target_amount: args.target_amount,
                target_date: args.target_date || null,
                status: "active",
            }).select().single();
            return error ? { success: false, error: error.message } : { success: true, savings_goal: data };
        }

        case "add_savings_contribution": {
            const { data: goals } = await supabase.from("savings_goals").select("id, name").eq("user_id", userId).ilike("name", `%${args.savings_goal_name}%`);
            if (!goals || goals.length === 0) return { success: false, error: "Meta no encontrada" };
            const { data, error } = await supabase.from("savings_contributions").insert({
                savings_goal_id: goals[0].id,
                user_id: userId,
                amount: args.amount,
                note: args.note || null,
                contribution_date: new Date().toISOString().split("T")[0],
            }).select().single();
            return error ? { success: false, error: error.message } : { success: true, contribution: data };
        }

        case "create_debt": {
            const { data, error } = await supabase.from("debts").insert({
                user_id: userId,
                name: args.name,
                original_amount: args.initial_amount,
                current_balance: args.initial_amount,
                interest_rate: args.interest_rate || 0,
                monthly_payment: args.monthly_payment || 0,
                creditor: args.creditor || null,
                due_date: args.due_date || null,
                status: "active",
            }).select().single();
            return error ? { success: false, error: error.message } : { success: true, debt: data };
        }

        case "add_debt_payment": {
            const { data: debts } = await supabase.from("debts").select("id, name").eq("user_id", userId).ilike("name", `%${args.debt_name}%`);
            if (!debts || debts.length === 0) return { success: false, error: "Deuda no encontrada" };
            const { data, error } = await supabase.from("debt_payments").insert({
                debt_id: debts[0].id,
                user_id: userId,
                amount: args.amount,
                note: args.note || null,
                payment_date: new Date().toISOString().split("T")[0],
            }).select().single();
            return error ? { success: false, error: error.message } : { success: true, payment: data };
        }

        case "create_reminder": {
            const { data, error } = await supabase.from("calendar_reminders").insert({
                user_id: userId,
                name: args.name,
                reminder_date: args.reminder_date,
                description: args.description || null,
                amount: args.amount || null,
                recurrence: args.recurrence || null,
                is_completed: false,
            }).select().single();
            return error ? { success: false, error: error.message } : { success: true, reminder: data };
        }

        default:
            return { success: false, error: "Función no reconocida" };
    }
}
