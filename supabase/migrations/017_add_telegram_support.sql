-- =====================================================
-- FINYBUDDY - Añadir soporte para Telegram
-- =====================================================

-- Añadir columna telegram_chat_id a la tabla profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT UNIQUE;

-- Crear un índice para búsquedas rápidas por chat_id
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_chat_id ON public.profiles(telegram_chat_id);
