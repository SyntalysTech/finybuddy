-- Añadir columna para registrar el momento en que se envió el último recordatorio automático
ALTER TABLE public.calendar_reminders
ADD COLUMN IF NOT EXISTS last_reminded_at DATE;
