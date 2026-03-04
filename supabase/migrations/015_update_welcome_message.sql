-- =====================================================
-- FINYBUDDY - ACTUALIZAR MENSAJE DE BIENVENIDA
-- =====================================================
-- Actualiza el texto de la notificación de bienvenida
-- para reflejar el flujo correcto de configuración inicial:
-- 1. Configurar categorías
-- 2. Crear previsión mensual
-- =====================================================

CREATE OR REPLACE FUNCTION create_welcome_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (user_id, title, message, type, icon)
    VALUES (
        NEW.id,
        '¡Bienvenido a FinyBuddy!',
        'Empieza configurando tus categorías y luego creando tu previsión mensual.',
        'welcome',
        'sparkles'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
