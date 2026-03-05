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
    (NEW.id, 'Nómina', 'Briefcase', '#10B981', 'income', true),
    (NEW.id, 'Freelance', 'Laptop', '#06B6D4', 'income', true),
    (NEW.id, 'Inversiones', 'TrendingUp', '#8B5CF6', 'income', true),
    (NEW.id, 'Alquiler', 'Home', '#F59E0B', 'income', true),
    (NEW.id, 'Ventas', 'ShoppingBag', '#EC4899', 'income', true),
    (NEW.id, 'Regalos', 'Gift', '#EF4444', 'income', true),
    (NEW.id, 'Reembolsos', 'Banknote', '#14B8A6', 'income', true),
    (NEW.id, 'Otros ingresos', 'Plus', '#6B7280', 'income', true);

    -- ==========================================
    -- CATEGORÍAS DE GASTOS - NECESIDADES (50%)
    -- ==========================================
    INSERT INTO public.categories (user_id, name, icon, color, type, segment, is_default) VALUES
    -- Vivienda
    (NEW.id, 'Alquiler/Hipoteca', 'Home', '#EF4444', 'expense', 'needs', true),
    (NEW.id, 'Comunidad', 'Building2', '#F97316', 'expense', 'needs', true),
    (NEW.id, 'Seguro hogar', 'Shield', '#F59E0B', 'expense', 'needs', true),

    -- Suministros
    (NEW.id, 'Electricidad', 'Zap', '#FBBF24', 'expense', 'needs', true),
    (NEW.id, 'Gas', 'Flame', '#F97316', 'expense', 'needs', true),
    (NEW.id, 'Agua', 'Droplets', '#06B6D4', 'expense', 'needs', true),
    (NEW.id, 'Internet', 'Globe', '#8B5CF6', 'expense', 'needs', true),
    (NEW.id, 'Teléfono', 'Smartphone', '#A855F7', 'expense', 'needs', true),

    -- Alimentación
    (NEW.id, 'Supermercado', 'ShoppingBag', '#10B981', 'expense', 'needs', true),

    -- Transporte
    (NEW.id, 'Gasolina', 'Fuel', '#6366F1', 'expense', 'needs', true),
    (NEW.id, 'Transporte público', 'Bus', '#3B82F6', 'expense', 'needs', true),
    (NEW.id, 'Seguro coche', 'Car', '#0EA5E9', 'expense', 'needs', true),
    (NEW.id, 'Mantenimiento vehículo', 'Wrench', '#14B8A6', 'expense', 'needs', true),

    -- Salud
    (NEW.id, 'Farmacia', 'Pill', '#EC4899', 'expense', 'needs', true),
    (NEW.id, 'Médico/Dentista', 'Stethoscope', '#F43F5E', 'expense', 'needs', true),
    (NEW.id, 'Seguro médico', 'Activity', '#FB7185', 'expense', 'needs', true),

    -- Educación
    (NEW.id, 'Educación', 'GraduationCap', '#8B5CF6', 'expense', 'needs', true),

    -- Otros necesarios
    (NEW.id, 'Impuestos', 'FileText', '#6B7280', 'expense', 'needs', true),
    (NEW.id, 'Seguros otros', 'FileText', '#9CA3AF', 'expense', 'needs', true);

    -- ==========================================
    -- CATEGORÍAS DE GASTOS - DESEOS (30%)
    -- ==========================================
    INSERT INTO public.categories (user_id, name, icon, color, type, segment, is_default) VALUES
    (NEW.id, 'Restaurantes', 'Utensils', '#F97316', 'expense', 'wants', true),
    (NEW.id, 'Ocio', 'Gamepad2', '#8B5CF6', 'expense', 'wants', true),
    (NEW.id, 'Streaming', 'Tv', '#EF4444', 'expense', 'wants', true),
    (NEW.id, 'Ropa', 'Shirt', '#EC4899', 'expense', 'wants', true),
    (NEW.id, 'Gimnasio', 'Dumbbell', '#10B981', 'expense', 'wants', true),
    (NEW.id, 'Viajes', 'Plane', '#06B6D4', 'expense', 'wants', true),
    (NEW.id, 'Belleza/Cuidado personal', 'Heart', '#F472B6', 'expense', 'wants', true),
    (NEW.id, 'Hobbies', 'Brush', '#A855F7', 'expense', 'wants', true),
    (NEW.id, 'Regalos dados', 'Gift', '#FB923C', 'expense', 'wants', true),
    (NEW.id, 'Suscripciones', 'Mail', '#6366F1', 'expense', 'wants', true),
    (NEW.id, 'Caprichos', 'Pizza', '#FBBF24', 'expense', 'wants', true),
    (NEW.id, 'Mascotas', 'Dog', '#F59E0B', 'expense', 'wants', true),
    (NEW.id, 'Otros gastos', 'FileEdit', '#6B7280', 'expense', 'wants', true);

    -- ==========================================
    -- CATEGORÍAS DE AHORRO (20%)
    -- ==========================================
    INSERT INTO public.categories (user_id, name, icon, color, type, segment, is_default) VALUES
    (NEW.id, 'Fondo de emergencia', 'Heart', '#EF4444', 'savings', 'savings', true),
    (NEW.id, 'Ahorro general', 'PiggyBank', '#F97316', 'savings', 'savings', true),
    (NEW.id, 'Inversiones', 'TrendingUp', '#10B981', 'savings', 'savings', true),
    (NEW.id, 'Jubilación', 'Users', '#8B5CF6', 'savings', 'savings', true),
    (NEW.id, 'Meta específica', 'Target', '#06B6D4', 'savings', 'savings', true);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear categorías al crear perfil
DROP TRIGGER IF EXISTS on_profile_created_create_categories ON public.profiles;
CREATE TRIGGER on_profile_created_create_categories
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.create_default_categories();
