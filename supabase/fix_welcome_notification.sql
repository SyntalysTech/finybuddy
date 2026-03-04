-- =====================================================
-- FIX: Actualizar mensaje de bienvenida
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Verificar que la tabla notifications existe
-- (Si no existe, créala primero ejecutando 005_notifications.sql)

-- 2. Actualizar la función de notificación de bienvenida
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
EXCEPTION
    WHEN OTHERS THEN
        -- Si falla la notificación, no bloquear la creación del usuario
        RAISE WARNING 'No se pudo crear la notificación de bienvenida: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Asegurar que el trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created_notification ON auth.users;
CREATE TRIGGER on_auth_user_created_notification
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_welcome_notification();
