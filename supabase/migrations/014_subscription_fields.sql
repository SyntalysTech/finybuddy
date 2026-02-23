-- =====================================================
-- FINYBUDDY - CAMPOS DE SUSCRIPCION STRIPE
-- =====================================================

-- Añadir campos de suscripción a profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing'
    CHECK (subscription_status IN ('trialing', 'active', 'canceled', 'past_due', 'unpaid', 'incomplete', 'paused')),
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'basic'
    CHECK (subscription_plan IN ('basic', 'pro_monthly', 'pro_annual')),
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN DEFAULT false;

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON public.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription ON public.profiles(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);

-- Actualizar la función handle_new_user para incluir trial de 15 días
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, subscription_status, subscription_plan, trial_ends_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'trialing',
        'pro_monthly',
        NOW() + INTERVAL '15 days'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill: usuarios existentes sin datos de suscripción
-- (Se les asigna basic ya que su trial habría expirado)
UPDATE public.profiles
SET subscription_status = 'trialing',
    subscription_plan = 'basic',
    trial_ends_at = created_at + INTERVAL '15 days'
WHERE subscription_status IS NULL OR trial_ends_at IS NULL;
