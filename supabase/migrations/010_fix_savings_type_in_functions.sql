-- =====================================================
-- FINYBUDDY - FIX: Cambiar type 'transfer' a 'savings'
-- en funciones SQL del dashboard
-- =====================================================

-- PRIMERO: Modificar el CHECK constraint para incluir 'savings'
-- Eliminar el constraint existente
ALTER TABLE operations DROP CONSTRAINT IF EXISTS operations_type_check;

-- Crear nuevo constraint que incluye 'savings'
ALTER TABLE operations ADD CONSTRAINT operations_type_check
    CHECK (type IN ('income', 'expense', 'transfer', 'savings'));

-- Actualizar get_monthly_summary para usar 'savings' en lugar de 'transfer'
CREATE OR REPLACE FUNCTION get_monthly_summary(
    p_user_id UUID,
    p_year INTEGER,
    p_month INTEGER
)
RETURNS TABLE (
    total_income DECIMAL,
    total_expenses DECIMAL,
    total_savings DECIMAL,
    balance DECIMAL,
    needs_total DECIMAL,
    wants_total DECIMAL,
    savings_total DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH monthly_ops AS (
        SELECT
            o.type,
            c.segment,
            SUM(o.amount) as total
        FROM operations o
        LEFT JOIN categories c ON o.category_id = c.id
        WHERE o.user_id = p_user_id
        AND EXTRACT(YEAR FROM o.operation_date) = p_year
        AND EXTRACT(MONTH FROM o.operation_date) = p_month
        GROUP BY o.type, c.segment
    )
    SELECT
        COALESCE((SELECT total FROM monthly_ops WHERE type = 'income'), 0) as total_income,
        COALESCE((SELECT SUM(total) FROM monthly_ops WHERE type = 'expense'), 0) as total_expenses,
        COALESCE((SELECT total FROM monthly_ops WHERE type = 'savings'), 0) as total_savings,
        COALESCE((SELECT total FROM monthly_ops WHERE type = 'income'), 0) -
        COALESCE((SELECT SUM(total) FROM monthly_ops WHERE type = 'expense'), 0) as balance,
        COALESCE((SELECT SUM(total) FROM monthly_ops WHERE type = 'expense' AND segment = 'needs'), 0) as needs_total,
        COALESCE((SELECT SUM(total) FROM monthly_ops WHERE type = 'expense' AND segment = 'wants'), 0) as wants_total,
        COALESCE((SELECT SUM(total) FROM monthly_ops WHERE type = 'expense' AND segment = 'savings'), 0) as savings_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Actualizar cualquier operación existente que tenga type = 'transfer' a 'savings'
UPDATE operations SET type = 'savings' WHERE type = 'transfer';
