-- =====================================================
-- FINYBUDDY - ESQUEMA INICIAL DE BASE DE DATOS
-- Dashboard Financiero Personal
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLAS PRINCIPALES
-- =====================================================

-- -----------------------------------------------------
-- TABLA: profiles (Perfiles de usuario)
-- Extiende auth.users con datos adicionales
-- -----------------------------------------------------
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,

    -- Preferencias de la aplicación
    currency TEXT DEFAULT 'EUR' CHECK (currency IN ('EUR', 'USD', 'GBP', 'MXN', 'ARS', 'COP', 'CLP', 'PEN')),
    locale TEXT DEFAULT 'es-ES',
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
    start_page TEXT DEFAULT 'dashboard' CHECK (start_page IN ('dashboard', 'prevision-vs-realidad', 'calendario', 'operaciones')),
    show_decimals BOOLEAN DEFAULT true,

    -- Regla financiera 50/30/20 personalizable
    rule_needs_percent INTEGER DEFAULT 50 CHECK (rule_needs_percent >= 0 AND rule_needs_percent <= 100),
    rule_wants_percent INTEGER DEFAULT 30 CHECK (rule_wants_percent >= 0 AND rule_wants_percent <= 100),
    rule_savings_percent INTEGER DEFAULT 20 CHECK (rule_savings_percent >= 0 AND rule_savings_percent <= 100),

    -- Datos de facturación (opcional, para futuro)
    billing_type TEXT CHECK (billing_type IN ('individual', 'autonomo', 'empresa')),
    billing_name TEXT,
    billing_tax_id TEXT, -- NIF/CIF/DNI
    billing_address TEXT,
    billing_country TEXT,

    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_financial_rule CHECK (rule_needs_percent + rule_wants_percent + rule_savings_percent = 100)
);

-- -----------------------------------------------------
-- TABLA: categories (Categorías de operaciones)
-- -----------------------------------------------------
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    icon TEXT DEFAULT '📁',
    color TEXT DEFAULT '#7739FE',

    -- Tipo: ingreso, gasto, ahorro
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'savings')),

    -- Segmento para la regla 50/30/20 (solo para gastos)
    segment TEXT CHECK (segment IN ('needs', 'wants', 'savings') OR segment IS NULL),

    -- Estado de la categoría
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false, -- Categorías predeterminadas del sistema

    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,

    UNIQUE(user_id, name, type)
);

-- -----------------------------------------------------
-- TABLA: operations (Operaciones/Transacciones)
-- -----------------------------------------------------
CREATE TABLE public.operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,

    -- Datos de la operación
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    concept TEXT NOT NULL,
    description TEXT,

    -- Fecha de la operación
    operation_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Para operaciones recurrentes (futuro)
    is_recurring BOOLEAN DEFAULT false,
    recurring_frequency TEXT CHECK (recurring_frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
    recurring_end_date DATE,
    parent_operation_id UUID REFERENCES public.operations(id) ON DELETE SET NULL,

    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------
-- TABLA: budgets (Presupuestos mensuales por categoría)
-- Para el módulo "Previsión"
-- -----------------------------------------------------
CREATE TABLE public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,

    -- Presupuesto mensual
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),

    -- Mes y año del presupuesto
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),

    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, category_id, month, year)
);

-- -----------------------------------------------------
-- TABLA: savings_goals (Metas de ahorro)
-- -----------------------------------------------------
CREATE TABLE public.savings_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '🎯',
    color TEXT DEFAULT '#02EAFF',

    -- Objetivo y progreso
    target_amount DECIMAL(12, 2) NOT NULL CHECK (target_amount > 0),
    current_amount DECIMAL(12, 2) DEFAULT 0 CHECK (current_amount >= 0),

    -- Fechas
    target_date DATE,

    -- Estado
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),

    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- -----------------------------------------------------
-- TABLA: savings_contributions (Aportes a metas de ahorro)
-- -----------------------------------------------------
CREATE TABLE public.savings_contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    savings_goal_id UUID NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
    operation_id UUID REFERENCES public.operations(id) ON DELETE SET NULL,

    amount DECIMAL(12, 2) NOT NULL CHECK (amount != 0), -- Positivo = aporte, Negativo = retiro
    contribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,

    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------
-- TABLA: debts (Deudas)
-- -----------------------------------------------------
CREATE TABLE public.debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    description TEXT,
    creditor TEXT, -- A quién se debe (banco, persona, etc.)

    -- Montos
    original_amount DECIMAL(12, 2) NOT NULL CHECK (original_amount > 0),
    current_balance DECIMAL(12, 2) NOT NULL CHECK (current_balance >= 0),
    interest_rate DECIMAL(5, 2) DEFAULT 0 CHECK (interest_rate >= 0),

    -- Cuota mensual esperada
    monthly_payment DECIMAL(12, 2) CHECK (monthly_payment >= 0),

    -- Fechas
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,

    -- Estado
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'paid')),

    -- Tipo de deuda
    debt_type TEXT DEFAULT 'other' CHECK (debt_type IN ('mortgage', 'car_loan', 'personal_loan', 'credit_card', 'student_loan', 'other')),

    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);

-- -----------------------------------------------------
-- TABLA: debt_payments (Pagos de deudas)
-- -----------------------------------------------------
CREATE TABLE public.debt_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
    operation_id UUID REFERENCES public.operations(id) ON DELETE SET NULL,

    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,

    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------
-- TABLA: alerts (Alertas y recordatorios)
-- -----------------------------------------------------
CREATE TABLE public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    title TEXT NOT NULL,
    description TEXT,

    -- Tipo de alerta
    alert_type TEXT NOT NULL CHECK (alert_type IN ('payment_due', 'budget_exceeded', 'goal_reminder', 'custom')),

    -- Referencia opcional a otras entidades
    reference_type TEXT CHECK (reference_type IN ('debt', 'savings_goal', 'budget', 'operation')),
    reference_id UUID,

    -- Programación
    alert_date DATE NOT NULL,
    alert_time TIME,
    is_recurring BOOLEAN DEFAULT false,
    recurring_frequency TEXT CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),

    -- Estado
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,

    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------
-- TABLA: ai_conversations (Conversaciones con asistente IA)
-- -----------------------------------------------------
CREATE TABLE public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    title TEXT DEFAULT 'Nueva conversación',

    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------
-- TABLA: ai_messages (Mensajes del asistente IA)
-- -----------------------------------------------------
CREATE TABLE public.ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,

    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,

    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA RENDIMIENTO
-- =====================================================

-- Profiles
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- Categories
CREATE INDEX idx_categories_user ON public.categories(user_id);
CREATE INDEX idx_categories_type ON public.categories(type);
CREATE INDEX idx_categories_active ON public.categories(user_id, is_active);

-- Operations
CREATE INDEX idx_operations_user ON public.operations(user_id);
CREATE INDEX idx_operations_date ON public.operations(operation_date);
CREATE INDEX idx_operations_user_date ON public.operations(user_id, operation_date);
CREATE INDEX idx_operations_category ON public.operations(category_id);
CREATE INDEX idx_operations_type ON public.operations(type);

-- Budgets
CREATE INDEX idx_budgets_user ON public.budgets(user_id);
CREATE INDEX idx_budgets_period ON public.budgets(user_id, year, month);

-- Savings Goals
CREATE INDEX idx_savings_goals_user ON public.savings_goals(user_id);
CREATE INDEX idx_savings_goals_status ON public.savings_goals(user_id, status);

-- Savings Contributions
CREATE INDEX idx_savings_contributions_goal ON public.savings_contributions(savings_goal_id);
CREATE INDEX idx_savings_contributions_user ON public.savings_contributions(user_id);

-- Debts
CREATE INDEX idx_debts_user ON public.debts(user_id);
CREATE INDEX idx_debts_status ON public.debts(user_id, status);

-- Debt Payments
CREATE INDEX idx_debt_payments_debt ON public.debt_payments(debt_id);
CREATE INDEX idx_debt_payments_user ON public.debt_payments(user_id);

-- Alerts
CREATE INDEX idx_alerts_user ON public.alerts(user_id);
CREATE INDEX idx_alerts_date ON public.alerts(user_id, alert_date);
CREATE INDEX idx_alerts_unread ON public.alerts(user_id, is_read) WHERE is_read = false;

-- AI Conversations
CREATE INDEX idx_ai_conversations_user ON public.ai_conversations(user_id);
CREATE INDEX idx_ai_messages_conversation ON public.ai_messages(conversation_id);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_operations_updated_at
    BEFORE UPDATE ON public.operations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_budgets_updated_at
    BEFORE UPDATE ON public.budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_savings_goals_updated_at
    BEFORE UPDATE ON public.savings_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_debts_updated_at
    BEFORE UPDATE ON public.debts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ai_conversations_updated_at
    BEFORE UPDATE ON public.ai_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil al registrarse
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función para actualizar balance de deuda al registrar pago
CREATE OR REPLACE FUNCTION update_debt_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.debts
        SET current_balance = current_balance - NEW.amount,
            status = CASE
                WHEN current_balance - NEW.amount <= 0 THEN 'paid'
                ELSE status
            END,
            paid_at = CASE
                WHEN current_balance - NEW.amount <= 0 THEN NOW()
                ELSE paid_at
            END
        WHERE id = NEW.debt_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.debts
        SET current_balance = current_balance + OLD.amount,
            status = CASE
                WHEN status = 'paid' THEN 'active'
                ELSE status
            END,
            paid_at = CASE
                WHEN status = 'paid' THEN NULL
                ELSE paid_at
            END
        WHERE id = OLD.debt_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_debt_on_payment
    AFTER INSERT OR DELETE ON public.debt_payments
    FOR EACH ROW EXECUTE FUNCTION update_debt_balance();

-- Función para actualizar progreso de meta de ahorro
CREATE OR REPLACE FUNCTION update_savings_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.savings_goals
        SET current_amount = current_amount + NEW.amount,
            status = CASE
                WHEN current_amount + NEW.amount >= target_amount THEN 'completed'
                ELSE status
            END,
            completed_at = CASE
                WHEN current_amount + NEW.amount >= target_amount THEN NOW()
                ELSE completed_at
            END
        WHERE id = NEW.savings_goal_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.savings_goals
        SET current_amount = current_amount - OLD.amount,
            status = CASE
                WHEN status = 'completed' AND current_amount - OLD.amount < target_amount THEN 'active'
                ELSE status
            END,
            completed_at = CASE
                WHEN status = 'completed' AND current_amount - OLD.amount < target_amount THEN NULL
                ELSE completed_at
            END
        WHERE id = OLD.savings_goal_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_savings_on_contribution
    AFTER INSERT OR DELETE ON public.savings_contributions
    FOR EACH ROW EXECUTE FUNCTION update_savings_goal_progress();

-- Función para actualizar last_used_at de categoría
CREATE OR REPLACE FUNCTION update_category_last_used()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.category_id IS NOT NULL THEN
        UPDATE public.categories
        SET last_used_at = NOW()
        WHERE id = NEW.category_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_category_on_operation
    AFTER INSERT ON public.operations
    FOR EACH ROW EXECUTE FUNCTION update_category_last_used();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Políticas para categories
CREATE POLICY "Users can view own categories"
    ON public.categories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own categories"
    ON public.categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
    ON public.categories FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
    ON public.categories FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para operations
CREATE POLICY "Users can view own operations"
    ON public.operations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own operations"
    ON public.operations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own operations"
    ON public.operations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own operations"
    ON public.operations FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para budgets
CREATE POLICY "Users can view own budgets"
    ON public.budgets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own budgets"
    ON public.budgets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
    ON public.budgets FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
    ON public.budgets FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para savings_goals
CREATE POLICY "Users can view own savings goals"
    ON public.savings_goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own savings goals"
    ON public.savings_goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own savings goals"
    ON public.savings_goals FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own savings goals"
    ON public.savings_goals FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para savings_contributions
CREATE POLICY "Users can view own savings contributions"
    ON public.savings_contributions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own savings contributions"
    ON public.savings_contributions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own savings contributions"
    ON public.savings_contributions FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para debts
CREATE POLICY "Users can view own debts"
    ON public.debts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own debts"
    ON public.debts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own debts"
    ON public.debts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own debts"
    ON public.debts FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para debt_payments
CREATE POLICY "Users can view own debt payments"
    ON public.debt_payments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own debt payments"
    ON public.debt_payments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own debt payments"
    ON public.debt_payments FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para alerts
CREATE POLICY "Users can view own alerts"
    ON public.alerts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own alerts"
    ON public.alerts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
    ON public.alerts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
    ON public.alerts FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para ai_conversations
CREATE POLICY "Users can view own ai conversations"
    ON public.ai_conversations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own ai conversations"
    ON public.ai_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai conversations"
    ON public.ai_conversations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ai conversations"
    ON public.ai_conversations FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para ai_messages (basadas en conversación)
CREATE POLICY "Users can view own ai messages"
    ON public.ai_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.ai_conversations
            WHERE id = ai_messages.conversation_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own ai messages"
    ON public.ai_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ai_conversations
            WHERE id = conversation_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own ai messages"
    ON public.ai_messages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.ai_conversations
            WHERE id = ai_messages.conversation_id
            AND user_id = auth.uid()
        )
    );
