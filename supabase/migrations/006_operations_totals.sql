-- =====================================================
-- FINYBUDDY - FUNCIONES ADICIONALES PARA OPERACIONES
-- Totales del mes calculados desde BD
-- =====================================================

-- -----------------------------------------------------
-- Obtener totales del mes para la página de Operaciones
-- Esta función calcula los totales sin depender de paginación
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_operations_totals(
    p_user_id UUID,
    p_year INTEGER,
    p_month INTEGER,
    p_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    total_income DECIMAL,
    total_expenses DECIMAL,
    balance DECIMAL,
    operation_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH filtered_ops AS (
        SELECT
            o.type,
            o.amount
        FROM operations o
        WHERE o.user_id = p_user_id
        AND EXTRACT(YEAR FROM o.operation_date) = p_year
        AND EXTRACT(MONTH FROM o.operation_date) = p_month
        AND (p_type IS NULL OR o.type = p_type)
    )
    SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as balance,
        COUNT(*) as operation_count
    FROM filtered_ops;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------
-- Obtener últimas operaciones para el Dashboard
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_recent_operations(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    amount DECIMAL,
    concept TEXT,
    description TEXT,
    operation_date DATE,
    category_id UUID,
    category_name TEXT,
    category_icon TEXT,
    category_color TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.type,
        o.amount,
        o.concept,
        o.description,
        o.operation_date,
        c.id as category_id,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color
    FROM operations o
    LEFT JOIN categories c ON o.category_id = c.id
    WHERE o.user_id = p_user_id
    ORDER BY o.operation_date DESC, o.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------
-- Obtener gastos por segmento (Necesidades/Deseos/Ahorro)
-- para cálculo de la regla 50/30/20
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_expenses_by_segment(
    p_user_id UUID,
    p_year INTEGER,
    p_month INTEGER
)
RETURNS TABLE (
    segment TEXT,
    total_amount DECIMAL,
    percentage DECIMAL
) AS $$
DECLARE
    v_total_income DECIMAL;
BEGIN
    -- Get total income for the month
    SELECT COALESCE(SUM(amount), 0)
    INTO v_total_income
    FROM operations
    WHERE user_id = p_user_id
    AND type = 'income'
    AND EXTRACT(YEAR FROM operation_date) = p_year
    AND EXTRACT(MONTH FROM operation_date) = p_month;

    RETURN QUERY
    SELECT
        c.segment,
        COALESCE(SUM(o.amount), 0) as total_amount,
        CASE
            WHEN v_total_income > 0 THEN
                ROUND((COALESCE(SUM(o.amount), 0) / v_total_income) * 100, 2)
            ELSE 0
        END as percentage
    FROM operations o
    JOIN categories c ON o.category_id = c.id
    WHERE o.user_id = p_user_id
    AND o.type = 'expense'
    AND EXTRACT(YEAR FROM o.operation_date) = p_year
    AND EXTRACT(MONTH FROM o.operation_date) = p_month
    AND c.segment IS NOT NULL
    GROUP BY c.segment
    ORDER BY c.segment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------
-- Comparativa mes actual vs mes anterior
-- Para mostrar porcentajes de variación en Dashboard
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_month_comparison(
    p_user_id UUID,
    p_year INTEGER,
    p_month INTEGER
)
RETURNS TABLE (
    current_income DECIMAL,
    previous_income DECIMAL,
    income_change_percent DECIMAL,
    current_expenses DECIMAL,
    previous_expenses DECIMAL,
    expenses_change_percent DECIMAL,
    current_balance DECIMAL,
    previous_balance DECIMAL
) AS $$
DECLARE
    v_prev_year INTEGER;
    v_prev_month INTEGER;
BEGIN
    -- Calculate previous month
    IF p_month = 1 THEN
        v_prev_year := p_year - 1;
        v_prev_month := 12;
    ELSE
        v_prev_year := p_year;
        v_prev_month := p_month - 1;
    END IF;

    RETURN QUERY
    WITH current_month AS (
        SELECT
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0) as income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) as expenses
        FROM operations
        WHERE user_id = p_user_id
        AND EXTRACT(YEAR FROM operation_date) = p_year
        AND EXTRACT(MONTH FROM operation_date) = p_month
    ),
    previous_month AS (
        SELECT
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0) as income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) as expenses
        FROM operations
        WHERE user_id = p_user_id
        AND EXTRACT(YEAR FROM operation_date) = v_prev_year
        AND EXTRACT(MONTH FROM operation_date) = v_prev_month
    )
    SELECT
        cm.income as current_income,
        pm.income as previous_income,
        CASE
            WHEN pm.income > 0 THEN ROUND(((cm.income - pm.income) / pm.income) * 100, 2)
            WHEN cm.income > 0 THEN 100
            ELSE 0
        END as income_change_percent,
        cm.expenses as current_expenses,
        pm.expenses as previous_expenses,
        CASE
            WHEN pm.expenses > 0 THEN ROUND(((cm.expenses - pm.expenses) / pm.expenses) * 100, 2)
            WHEN cm.expenses > 0 THEN 100
            ELSE 0
        END as expenses_change_percent,
        cm.income - cm.expenses as current_balance,
        pm.income - pm.expenses as previous_balance
    FROM current_month cm, previous_month pm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------
-- Exportar datos del usuario en formato estructurado
-- Para la funcionalidad de "Exportar Mis Datos"
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION export_user_data(
    p_user_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'export_date', NOW(),
        'user_id', p_user_id,
        'date_range', json_build_object(
            'start', COALESCE(p_start_date, '1900-01-01'::DATE),
            'end', COALESCE(p_end_date, CURRENT_DATE)
        ),
        'categories', (
            SELECT COALESCE(json_agg(row_to_json(c)), '[]'::json)
            FROM (
                SELECT id, name, icon, color, type, segment, is_active, is_default, created_at
                FROM categories
                WHERE user_id = p_user_id
                ORDER BY type, name
            ) c
        ),
        'operations', (
            SELECT COALESCE(json_agg(row_to_json(o)), '[]'::json)
            FROM (
                SELECT
                    o.id, o.type, o.amount, o.concept, o.description,
                    o.operation_date, o.is_recurring, o.recurring_frequency,
                    c.name as category_name
                FROM operations o
                LEFT JOIN categories c ON o.category_id = c.id
                WHERE o.user_id = p_user_id
                AND (p_start_date IS NULL OR o.operation_date >= p_start_date)
                AND (p_end_date IS NULL OR o.operation_date <= p_end_date)
                ORDER BY o.operation_date DESC
            ) o
        ),
        'budgets', (
            SELECT COALESCE(json_agg(row_to_json(b)), '[]'::json)
            FROM (
                SELECT
                    b.id, b.amount, b.month, b.year,
                    c.name as category_name
                FROM budgets b
                LEFT JOIN categories c ON b.category_id = c.id
                WHERE b.user_id = p_user_id
                ORDER BY b.year DESC, b.month DESC
            ) b
        ),
        'savings_goals', (
            SELECT COALESCE(json_agg(row_to_json(s)), '[]'::json)
            FROM (
                SELECT
                    id, name, description, icon, color,
                    target_amount, current_amount, target_date,
                    status, priority, created_at, completed_at
                FROM savings_goals
                WHERE user_id = p_user_id
                ORDER BY created_at DESC
            ) s
        ),
        'debts', (
            SELECT COALESCE(json_agg(row_to_json(d)), '[]'::json)
            FROM (
                SELECT
                    id, name, description, creditor,
                    original_amount, current_balance,
                    monthly_payment, start_date, due_date,
                    status, debt_type, created_at, paid_at
                FROM debts
                WHERE user_id = p_user_id
                ORDER BY created_at DESC
            ) d
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
