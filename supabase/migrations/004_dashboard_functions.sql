-- =====================================================
-- FINYBUDDY - FUNCIONES PARA DASHBOARD
-- KPIs, estadísticas y consultas optimizadas
-- =====================================================

-- -----------------------------------------------------
-- Obtener resumen financiero del mes
-- -----------------------------------------------------
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
        COALESCE((SELECT total FROM monthly_ops WHERE type = 'transfer'), 0) as total_savings,
        COALESCE((SELECT total FROM monthly_ops WHERE type = 'income'), 0) -
        COALESCE((SELECT SUM(total) FROM monthly_ops WHERE type = 'expense'), 0) as balance,
        COALESCE((SELECT SUM(total) FROM monthly_ops WHERE type = 'expense' AND segment = 'needs'), 0) as needs_total,
        COALESCE((SELECT SUM(total) FROM monthly_ops WHERE type = 'expense' AND segment = 'wants'), 0) as wants_total,
        COALESCE((SELECT SUM(total) FROM monthly_ops WHERE type = 'expense' AND segment = 'savings'), 0) as savings_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------
-- Obtener gastos por categoría del mes
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_expenses_by_category(
    p_user_id UUID,
    p_year INTEGER,
    p_month INTEGER
)
RETURNS TABLE (
    category_id UUID,
    category_name TEXT,
    category_icon TEXT,
    category_color TEXT,
    segment TEXT,
    total_amount DECIMAL,
    operation_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id as category_id,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        c.segment,
        COALESCE(SUM(o.amount), 0) as total_amount,
        COUNT(o.id) as operation_count
    FROM categories c
    LEFT JOIN operations o ON o.category_id = c.id
        AND EXTRACT(YEAR FROM o.operation_date) = p_year
        AND EXTRACT(MONTH FROM o.operation_date) = p_month
    WHERE c.user_id = p_user_id
    AND c.type = 'expense'
    AND c.is_active = true
    GROUP BY c.id, c.name, c.icon, c.color, c.segment
    ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------
-- Obtener comparativa Previsión vs Realidad
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_budget_vs_actual(
    p_user_id UUID,
    p_year INTEGER,
    p_month INTEGER
)
RETURNS TABLE (
    category_id UUID,
    category_name TEXT,
    category_icon TEXT,
    category_color TEXT,
    segment TEXT,
    budgeted DECIMAL,
    actual DECIMAL,
    difference DECIMAL,
    percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id as category_id,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        c.segment,
        COALESCE(b.amount, 0) as budgeted,
        COALESCE(SUM(o.amount), 0) as actual,
        COALESCE(b.amount, 0) - COALESCE(SUM(o.amount), 0) as difference,
        CASE
            WHEN COALESCE(b.amount, 0) > 0 THEN
                ROUND((COALESCE(SUM(o.amount), 0) / b.amount) * 100, 2)
            ELSE 0
        END as percentage
    FROM categories c
    LEFT JOIN budgets b ON b.category_id = c.id
        AND b.year = p_year
        AND b.month = p_month
    LEFT JOIN operations o ON o.category_id = c.id
        AND EXTRACT(YEAR FROM o.operation_date) = p_year
        AND EXTRACT(MONTH FROM o.operation_date) = p_month
    WHERE c.user_id = p_user_id
    AND c.type = 'expense'
    AND c.is_active = true
    GROUP BY c.id, c.name, c.icon, c.color, c.segment, b.amount
    ORDER BY c.segment, c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------
-- Obtener evolución mensual (últimos N meses)
-- -----------------------------------------------------
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

-- -----------------------------------------------------
-- Obtener operaciones del calendario
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_calendar_operations(
    p_user_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    operation_date DATE,
    operations_count BIGINT,
    total_income DECIMAL,
    total_expenses DECIMAL,
    net_amount DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.operation_date,
        COUNT(*) as operations_count,
        COALESCE(SUM(CASE WHEN o.type = 'income' THEN o.amount END), 0) as total_income,
        COALESCE(SUM(CASE WHEN o.type = 'expense' THEN o.amount END), 0) as total_expenses,
        COALESCE(SUM(CASE WHEN o.type = 'income' THEN o.amount ELSE -o.amount END), 0) as net_amount
    FROM operations o
    WHERE o.user_id = p_user_id
    AND o.operation_date BETWEEN p_start_date AND p_end_date
    GROUP BY o.operation_date
    ORDER BY o.operation_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------
-- Obtener ratio deuda/ingresos
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_debt_to_income_ratio(
    p_user_id UUID,
    p_year INTEGER,
    p_month INTEGER
)
RETURNS TABLE (
    monthly_debt_payment DECIMAL,
    monthly_income DECIMAL,
    ratio_percentage DECIMAL,
    status TEXT
) AS $$
DECLARE
    v_debt_payment DECIMAL;
    v_income DECIMAL;
    v_ratio DECIMAL;
BEGIN
    -- Calcular pagos de deuda del mes
    SELECT COALESCE(SUM(dp.amount), 0)
    INTO v_debt_payment
    FROM debt_payments dp
    WHERE dp.user_id = p_user_id
    AND EXTRACT(YEAR FROM dp.payment_date) = p_year
    AND EXTRACT(MONTH FROM dp.payment_date) = p_month;

    -- Calcular ingresos del mes
    SELECT COALESCE(SUM(o.amount), 0)
    INTO v_income
    FROM operations o
    WHERE o.user_id = p_user_id
    AND o.type = 'income'
    AND EXTRACT(YEAR FROM o.operation_date) = p_year
    AND EXTRACT(MONTH FROM o.operation_date) = p_month;

    -- Calcular ratio
    IF v_income > 0 THEN
        v_ratio := ROUND((v_debt_payment / v_income) * 100, 2);
    ELSE
        v_ratio := 0;
    END IF;

    RETURN QUERY
    SELECT
        v_debt_payment,
        v_income,
        v_ratio,
        CASE
            WHEN v_ratio <= 20 THEN 'excellent'
            WHEN v_ratio <= 35 THEN 'good'
            WHEN v_ratio <= 50 THEN 'warning'
            ELSE 'danger'
        END as status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------
-- Obtener resumen de metas de ahorro
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_savings_summary(p_user_id UUID)
RETURNS TABLE (
    total_goals INTEGER,
    active_goals INTEGER,
    completed_goals INTEGER,
    total_target DECIMAL,
    total_saved DECIMAL,
    overall_progress DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total_goals,
        COUNT(*) FILTER (WHERE status = 'active')::INTEGER as active_goals,
        COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as completed_goals,
        COALESCE(SUM(target_amount), 0) as total_target,
        COALESCE(SUM(current_amount), 0) as total_saved,
        CASE
            WHEN COALESCE(SUM(target_amount), 0) > 0 THEN
                ROUND((COALESCE(SUM(current_amount), 0) / SUM(target_amount)) * 100, 2)
            ELSE 0
        END as overall_progress
    FROM savings_goals
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------
-- Obtener resumen de deudas
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_debts_summary(p_user_id UUID)
RETURNS TABLE (
    total_debts INTEGER,
    active_debts INTEGER,
    paid_debts INTEGER,
    total_original DECIMAL,
    total_remaining DECIMAL,
    overall_progress DECIMAL,
    total_monthly_payment DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total_debts,
        COUNT(*) FILTER (WHERE status = 'active')::INTEGER as active_debts,
        COUNT(*) FILTER (WHERE status = 'paid')::INTEGER as paid_debts,
        COALESCE(SUM(original_amount), 0) as total_original,
        COALESCE(SUM(current_balance), 0) as total_remaining,
        CASE
            WHEN COALESCE(SUM(original_amount), 0) > 0 THEN
                ROUND(((SUM(original_amount) - SUM(current_balance)) / SUM(original_amount)) * 100, 2)
            ELSE 0
        END as overall_progress,
        COALESCE(SUM(monthly_payment) FILTER (WHERE status = 'active'), 0) as total_monthly_payment
    FROM debts
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------
-- Resetear presupuestos (copiar del mes anterior o limpiar)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION reset_budgets(
    p_user_id UUID,
    p_year INTEGER,
    p_month INTEGER,
    p_copy_from_previous BOOLEAN DEFAULT false
)
RETURNS void AS $$
DECLARE
    v_prev_year INTEGER;
    v_prev_month INTEGER;
BEGIN
    -- Calcular mes anterior
    IF p_month = 1 THEN
        v_prev_year := p_year - 1;
        v_prev_month := 12;
    ELSE
        v_prev_year := p_year;
        v_prev_month := p_month - 1;
    END IF;

    -- Eliminar presupuestos existentes del mes
    DELETE FROM budgets
    WHERE user_id = p_user_id
    AND year = p_year
    AND month = p_month;

    -- Si se quiere copiar del mes anterior
    IF p_copy_from_previous THEN
        INSERT INTO budgets (user_id, category_id, amount, month, year)
        SELECT user_id, category_id, amount, p_month, p_year
        FROM budgets
        WHERE user_id = p_user_id
        AND year = v_prev_year
        AND month = v_prev_month;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------
-- Limpiar operaciones antiguas
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION clean_old_operations(
    p_user_id UUID,
    p_older_than_months INTEGER DEFAULT 24
)
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM operations
        WHERE user_id = p_user_id
        AND operation_date < CURRENT_DATE - (p_older_than_months || ' months')::INTERVAL
        RETURNING *
    )
    SELECT COUNT(*) INTO v_deleted_count FROM deleted;

    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------
-- Desactivar categorías sin uso (más de 3 meses)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION deactivate_unused_categories(
    p_user_id UUID,
    p_months INTEGER DEFAULT 3
)
RETURNS INTEGER AS $$
DECLARE
    v_deactivated_count INTEGER;
BEGIN
    WITH deactivated AS (
        UPDATE categories
        SET is_active = false
        WHERE user_id = p_user_id
        AND is_active = true
        AND is_default = false
        AND (
            last_used_at IS NULL
            OR last_used_at < CURRENT_DATE - (p_months || ' months')::INTERVAL
        )
        AND NOT EXISTS (
            SELECT 1 FROM operations o
            WHERE o.category_id = categories.id
            AND o.operation_date > CURRENT_DATE - (p_months || ' months')::INTERVAL
        )
        RETURNING *
    )
    SELECT COUNT(*) INTO v_deactivated_count FROM deactivated;

    RETURN v_deactivated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
