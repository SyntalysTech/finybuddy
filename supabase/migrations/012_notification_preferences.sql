-- =====================================================
-- FINYBUDDY - PREFERENCIAS DE NOTIFICACIONES
-- =====================================================

-- Añadir columnas de preferencias de notificaciones a profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_reminder_alerts BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS in_app_monthly_summary BOOLEAN DEFAULT true;

-- Actualizar el constraint de tipo en notifications para incluir monthly_summary
-- Primero eliminamos el constraint existente
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Añadimos el nuevo constraint con monthly_summary incluido
ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN ('info', 'success', 'warning', 'error', 'welcome', 'monthly_summary'));

-- Comentario para documentación
COMMENT ON COLUMN public.profiles.email_reminder_alerts IS 'Preferencia para recibir emails de alerta 1 día antes de vencimiento de recordatorios del calendario';
COMMENT ON COLUMN public.profiles.in_app_monthly_summary IS 'Preferencia para recibir resumen mensual in-app el día 2 de cada mes';
