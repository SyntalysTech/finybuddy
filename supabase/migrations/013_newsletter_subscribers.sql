-- =====================================================
-- FINYBUDDY - SUSCRIPTORES DE NEWSLETTER
-- =====================================================

-- Tabla para almacenar suscriptores de la newsletter
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    source TEXT DEFAULT 'landing', -- landing, app, admin
    unsubscribed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_active ON public.newsletter_subscribers(is_active);

-- RLS (Row Level Security)
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Política para insertar (cualquiera puede suscribirse)
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers
    FOR INSERT WITH CHECK (true);

-- Política para que solo admins puedan ver/gestionar suscriptores
CREATE POLICY "Only service role can manage subscribers" ON public.newsletter_subscribers
    FOR ALL USING (auth.role() = 'service_role');

-- Comentarios
COMMENT ON TABLE public.newsletter_subscribers IS 'Suscriptores de la newsletter de FinyBuddy';
COMMENT ON COLUMN public.newsletter_subscribers.source IS 'Origen de la suscripción: landing, app, admin';
