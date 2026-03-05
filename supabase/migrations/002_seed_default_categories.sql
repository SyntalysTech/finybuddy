-- =====================================================
-- FINYBUDDY - CATEGORÍAS PREDETERMINADAS
-- Se insertan automáticamente para cada nuevo usuario
-- =====================================================

-- Función para crear categorías predeterminadas para un usuario
CREATE OR REPLACE FUNCTION public.create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
    -- ==========================================
    -- CATEGORÍAS DE INGRESOS
    -- ==========================================
    INSERT INTO public.categories (user_id, name, icon, color, type, is_default) VALUES
    (NEW.id, 'Nómina', '💼', '#10B981', 'income', true),
    (NEW.id, 'Freelance', '💻', '#06B6D4', 'income', true),
    (NEW.id, 'Inversiones', '📈', '#8B5CF6', 'income', true),
    (NEW.id, 'Alquiler', '🏠', '#F59E0B', 'income', true),
    (NEW.id, 'Ventas', '🛒', '#EC4899', 'income', true),
    (NEW.id, 'Regalos', '🎁', '#EF4444', 'income', true),
    (NEW.id, 'Reembolsos', '💰', '#14B8A6', 'income', true),
    (NEW.id, 'Otros ingresos', '➕', '#6B7280', 'income', true);

    -- ==========================================
    -- CATEGORÍAS DE GASTOS - NECESIDADES (50%)
    -- ==========================================
    INSERT INTO public.categories (user_id, name, icon, color, type, segment, is_default) VALUES
    -- Vivienda
    (NEW.id, 'Alquiler/Hipoteca', '🏠', '#EF4444', 'expense', 'needs', true),
    (NEW.id, 'Comunidad', '🏢', '#F97316', 'expense', 'needs', true),
    (NEW.id, 'Seguro hogar', '🛡️', '#F59E0B', 'expense', 'needs', true),

    -- Suministros
    (NEW.id, 'Electricidad', '⚡', '#FBBF24', 'expense', 'needs', true),
    (NEW.id, 'Gas', '🔥', '#F97316', 'expense', 'needs', true),
    (NEW.id, 'Agua', '💧', '#06B6D4', 'expense', 'needs', true),
    (NEW.id, 'Internet', '🌐', '#8B5CF6', 'expense', 'needs', true),
    (NEW.id, 'Teléfono', '📱', '#A855F7', 'expense', 'needs', true),

    -- Alimentación
    (NEW.id, 'Supermercado', '🛒', '#10B981', 'expense', 'needs', true),

    -- Transporte
    (NEW.id, 'Gasolina', '⛽', '#6366F1', 'expense', 'needs', true),
    (NEW.id, 'Transporte público', '🚌', '#3B82F6', 'expense', 'needs', true),
    (NEW.id, 'Seguro coche', '🚗', '#0EA5E9', 'expense', 'needs', true),
    (NEW.id, 'Mantenimiento vehículo', '🔧', '#14B8A6', 'expense', 'needs', true),

    -- Salud
    (NEW.id, 'Farmacia', '💊', '#EC4899', 'expense', 'needs', true),
    (NEW.id, 'Médico/Dentista', '🏥', '#F43F5E', 'expense', 'needs', true),
    (NEW.id, 'Seguro médico', '🩺', '#FB7185', 'expense', 'needs', true),

    -- Educación
    (NEW.id, 'Educación', '📚', '#8B5CF6', 'expense', 'needs', true),

    -- Otros necesarios
    (NEW.id, 'Impuestos', '📋', '#6B7280', 'expense', 'needs', true),
    (NEW.id, 'Seguros otros', '📄', '#9CA3AF', 'expense', 'needs', true);

    -- ==========================================
    -- CATEGORÍAS DE GASTOS - DESEOS (30%)
    -- ==========================================
    INSERT INTO public.categories (user_id, name, icon, color, type, segment, is_default) VALUES
    (NEW.id, 'Restaurantes', '🍽️', '#F97316', 'expense', 'wants', true),
    (NEW.id, 'Ocio', '🎮', '#8B5CF6', 'expense', 'wants', true),
    (NEW.id, 'Streaming', '📺', '#EF4444', 'expense', 'wants', true),
    (NEW.id, 'Ropa', '👕', '#EC4899', 'expense', 'wants', true),
    (NEW.id, 'Gimnasio', '💪', '#10B981', 'expense', 'wants', true),
    (NEW.id, 'Viajes', '✈️', '#06B6D4', 'expense', 'wants', true),
    (NEW.id, 'Belleza/Cuidado personal', '💅', '#F472B6', 'expense', 'wants', true),
    (NEW.id, 'Hobbies', '🎨', '#A855F7', 'expense', 'wants', true),
    (NEW.id, 'Regalos dados', '🎁', '#FB923C', 'expense', 'wants', true),
    (NEW.id, 'Suscripciones', '📧', '#6366F1', 'expense', 'wants', true),
    (NEW.id, 'Caprichos', '🍫', '#FBBF24', 'expense', 'wants', true),
    (NEW.id, 'Mascotas', '🐾', '#F59E0B', 'expense', 'wants', true),
    (NEW.id, 'Otros gastos', '📝', '#6B7280', 'expense', 'wants', true);

    -- ==========================================
    -- CATEGORÍAS DE AHORRO (20%)
    -- ==========================================
    INSERT INTO public.categories (user_id, name, icon, color, type, segment, is_default) VALUES
    (NEW.id, 'Fondo de emergencia', '🆘', '#EF4444', 'savings', 'savings', true),
    (NEW.id, 'Ahorro general', '🐷', '#F97316', 'savings', 'savings', true),
    (NEW.id, 'Inversiones', '📊', '#10B981', 'savings', 'savings', true),
    (NEW.id, 'Jubilación', '👴', '#8B5CF6', 'savings', 'savings', true),
    (NEW.id, 'Meta específica', '🎯', '#06B6D4', 'savings', 'savings', true);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear categorías al crear perfil
DROP TRIGGER IF EXISTS on_profile_created_create_categories ON public.profiles;
CREATE TRIGGER on_profile_created_create_categories
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.create_default_categories();
