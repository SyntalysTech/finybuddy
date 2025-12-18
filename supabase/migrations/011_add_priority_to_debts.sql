-- =====================================================
-- FINYBUDDY - Añadir campo prioridad a tabla debts
-- =====================================================

-- Añadir columna priority a la tabla debts
ALTER TABLE debts
ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'medium'
CHECK (priority IN ('high', 'medium', 'low'));

-- Actualizar las deudas existentes con prioridad media por defecto
UPDATE debts SET priority = 'medium' WHERE priority IS NULL;
