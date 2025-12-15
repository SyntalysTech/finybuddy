-- =====================================================
-- FINYBUDDY - AHORRO PREVISTO MENSUAL
-- Tabla para almacenar el ahorro previsto configurado por el usuario
-- =====================================================

-- -----------------------------------------------------
-- TABLA: planned_savings (Ahorro previsto por mes)
-- Para que el usuario defina su ahorro mensual previsto
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.planned_savings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Mes y año
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),

    -- Importe de ahorro previsto
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (amount >= 0),

    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, month, year)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_planned_savings_user ON public.planned_savings(user_id);
CREATE INDEX IF NOT EXISTS idx_planned_savings_period ON public.planned_savings(user_id, year, month);

-- Trigger para updated_at
CREATE TRIGGER update_planned_savings_updated_at
    BEFORE UPDATE ON public.planned_savings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE public.planned_savings ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view own planned savings"
    ON public.planned_savings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own planned savings"
    ON public.planned_savings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own planned savings"
    ON public.planned_savings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own planned savings"
    ON public.planned_savings FOR DELETE
    USING (auth.uid() = user_id);
