-- =====================================================
-- FINYBUDDY - MÓDULO DE APRENDIZAJE
-- =====================================================

-- -----------------------------------------------------
-- Tabla de progreso de aprendizaje del usuario
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS learning_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Nivel de experiencia seleccionado
    experience_level TEXT NOT NULL CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),

    -- Fecha de inicio del programa
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Semana actual desbloqueada (1-4)
    current_week INTEGER NOT NULL DEFAULT 1 CHECK (current_week >= 1 AND current_week <= 4),

    -- Lecciones completadas (JSON array de lesson_ids)
    completed_lessons JSONB DEFAULT '[]'::jsonb,

    -- Fecha de última actividad
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),

    -- Metadatos
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id)
);

-- Índices
CREATE INDEX idx_learning_progress_user ON learning_progress(user_id);

-- RLS
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own learning progress"
    ON learning_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning progress"
    ON learning_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning progress"
    ON learning_progress FOR UPDATE
    USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_learning_progress_updated_at
    BEFORE UPDATE ON learning_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -----------------------------------------------------
-- Función para calcular semana desbloqueada
-- Desbloquea una nueva semana cada 7 días desde started_at
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_unlocked_week(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_started_at TIMESTAMPTZ;
    v_days_elapsed INTEGER;
    v_week INTEGER;
BEGIN
    SELECT started_at INTO v_started_at
    FROM learning_progress
    WHERE user_id = p_user_id;

    IF v_started_at IS NULL THEN
        RETURN 1;
    END IF;

    v_days_elapsed := EXTRACT(DAY FROM (NOW() - v_started_at));
    v_week := LEAST(4, GREATEST(1, (v_days_elapsed / 7) + 1));

    -- Actualizar current_week si ha aumentado
    UPDATE learning_progress
    SET current_week = v_week
    WHERE user_id = p_user_id AND current_week < v_week;

    RETURN v_week;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
