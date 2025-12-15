-- =====================================================
-- FINYBUDDY - RECORDATORIOS DEL CALENDARIO
-- Tabla para recordatorios financieros no recurrentes
-- =====================================================

-- -----------------------------------------------------
-- TABLA: calendar_reminders (Recordatorios del calendario)
-- Para ITV, seguros, renovaciones, etc.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.calendar_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    description TEXT,

    -- Fecha del recordatorio
    reminder_date DATE NOT NULL,

    -- Importe opcional (para referencia, no afecta cálculos)
    amount DECIMAL(12, 2),

    -- Recurrencia opcional
    recurrence TEXT CHECK (recurrence IN ('monthly', 'quarterly', 'yearly') OR recurrence IS NULL),

    -- Estado
    is_completed BOOLEAN DEFAULT false,

    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_calendar_reminders_user ON public.calendar_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_reminders_date ON public.calendar_reminders(user_id, reminder_date);

-- Trigger para updated_at
CREATE TRIGGER update_calendar_reminders_updated_at
    BEFORE UPDATE ON public.calendar_reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE public.calendar_reminders ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view own calendar reminders"
    ON public.calendar_reminders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own calendar reminders"
    ON public.calendar_reminders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar reminders"
    ON public.calendar_reminders FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar reminders"
    ON public.calendar_reminders FOR DELETE
    USING (auth.uid() = user_id);
