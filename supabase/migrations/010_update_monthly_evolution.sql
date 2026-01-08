-- =====================================================
-- ACTUALIZAR FUNCIÓN get_monthly_evolution PARA INCLUIR AHORRO REAL
-- =====================================================

CREATE OR REPLACE FUNCTION get_monthly_evolution(
    p_user_id UUID,
    p_months INTEGER DEFAULT 12
)
RETURNS TABLE (
    year INTEGER,
    month INTEGER,
    month_name TEXT,
    total_income DECIMAL,
    total_expenses DECIMAL,
    total_savings DECIMAL,
    balance DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH months AS (
        SELECT
            EXTRACT(YEAR FROM d)::INTEGER as year,
            EXTRACT(MONTH FROM d)::INTEGER as month,
            TO_CHAR(d, 'Mon') as month_name
        FROM generate_series(
            DATE_TRUNC('month', CURRENT_DATE) - (p_months - 1 || ' months')::INTERVAL,
            DATE_TRUNC('month', CURRENT_DATE),
            '1 month'::INTERVAL
        ) d
    )
    SELECT
        m.year,
        m.month,
        m.month_name,
        COALESCE(SUM(CASE WHEN o.type = 'income' THEN o.amount END), 0) as total_income,
        COALESCE(SUM(CASE WHEN o.type = 'expense' THEN o.amount END), 0) as total_expenses,
        COALESCE(SUM(CASE WHEN o.type = 'savings' THEN o.amount END), 0) as total_savings,
        COALESCE(SUM(CASE WHEN o.type = 'income' THEN o.amount END), 0) -
        COALESCE(SUM(CASE WHEN o.type = 'expense' THEN o.amount END), 0) as balance
    FROM months m
    LEFT JOIN operations o ON o.user_id = p_user_id
        AND EXTRACT(YEAR FROM o.operation_date) = m.year
        AND EXTRACT(MONTH FROM o.operation_date) = m.month
    GROUP BY m.year, m.month, m.month_name
    ORDER BY m.year, m.month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
