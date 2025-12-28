"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/client";
import {
  User,
  Mail,
  Camera,
  Save,
  LogOut,
  Lock,
  Eye,
  EyeOff,
  X,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Building2,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  billing_type: string | null;
  billing_name: string | null;
  billing_tax_id: string | null;
  billing_address: string | null;
  billing_country: string | null;
  created_at: string;
  updated_at: string;
}

const BILLING_TYPES = [
  { value: "individual", label: "Particular" },
  { value: "autonomo", label: "Autónomo" },
  { value: "empresa", label: "Empresa" },
];

export default function PerfilPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states
  const [fullName, setFullName] = useState("");
  const [billingType, setBillingType] = useState("");
  const [billingName, setBillingName] = useState("");
  const [billingTaxId, setBillingTaxId] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingCountry, setBillingCountry] = useState("");

  // Track if form has unsaved changes
  const [hasChanges, setHasChanges] = useState(false);
  const initialValuesRef = useRef<{
    fullName: string;
    billingType: string;
    billingName: string;
    billingTaxId: string;
    billingAddress: string;
    billingCountry: string;
  } | null>(null);

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const supabase = createClient();

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      if (profileData) {
        setProfile(profileData);
        const initialFullName = profileData.full_name || "";
        const initialBillingType = profileData.billing_type || "";
        const initialBillingName = profileData.billing_name || "";
        const initialBillingTaxId = profileData.billing_tax_id || "";
        const initialBillingAddress = profileData.billing_address || "";
        const initialBillingCountry = profileData.billing_country || "";

        setFullName(initialFullName);
        setBillingType(initialBillingType);
        setBillingName(initialBillingName);
        setBillingTaxId(initialBillingTaxId);
        setBillingAddress(initialBillingAddress);
        setBillingCountry(initialBillingCountry);
        setAvatarUrl(profileData.avatar_url);

        // Store initial values for change detection
        initialValuesRef.current = {
          fullName: initialFullName,
          billingType: initialBillingType,
          billingName: initialBillingName,
          billingTaxId: initialBillingTaxId,
          billingAddress: initialBillingAddress,
          billingCountry: initialBillingCountry,
        };
        setHasChanges(false);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Error al cargar el perfil");
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Detect changes
  useEffect(() => {
    if (initialValuesRef.current) {
      const changed =
        fullName !== initialValuesRef.current.fullName ||
        billingType !== initialValuesRef.current.billingType ||
        billingName !== initialValuesRef.current.billingName ||
        billingTaxId !== initialValuesRef.current.billingTaxId ||
        billingAddress !== initialValuesRef.current.billingAddress ||
        billingCountry !== initialValuesRef.current.billingCountry;
      setHasChanges(changed);
    }
  }, [fullName, billingType, billingName, billingTaxId, billingAddress, billingCountry]);

  const handleSaveProfile = async () => {
    if (!profile) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || null,
          billing_type: billingType || null,
          billing_name: billingName.trim() || null,
          billing_tax_id: billingTaxId.trim() || null,
          billing_address: billingAddress.trim() || null,
          billing_country: billingCountry.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      // Update initial values to current values after successful save
      initialValuesRef.current = {
        fullName,
        billingType,
        billingName,
        billingTaxId,
        billingAddress,
        billingCountry,
      };
      setHasChanges(false);

      setSuccess("Perfil guardado correctamente");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al guardar";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten imágenes");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no puede superar 5MB");
      return;
    }

    setUploadingAvatar(true);
    setError("");

    try {
      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split("/").pop();
        if (oldPath) {
          await supabase.storage.from("avatars").remove([`${profile.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl, updated_at: new Date().toISOString() })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      setAvatarUrl(urlData.publicUrl);
      setSuccess("Avatar actualizado");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al subir avatar";
      setError(errorMessage);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <>
        <Header title="Perfil" subtitle="Gestiona tu cuenta y preferencias" />
        <div className="p-6">
          <div className="card p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-cyan)] mx-auto"></div>
            <p className="mt-3 text-[var(--brand-gray)]">Cargando perfil...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Perfil" subtitle="Gestiona tu cuenta y preferencias" />

      <div className="p-6 space-y-6">
        {/* Messages */}
        {error && (
          <div className="p-4 rounded-xl bg-[var(--danger)]/10 text-[var(--danger)] flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="text-sm">{error}</span>
            <button onClick={() => setError("")} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {success && (
          <div className="p-4 rounded-xl bg-[var(--success)]/10 text-[var(--success)] flex items-center gap-3">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm">{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Avatar & Basic Info */}
          <div className="space-y-6">
            {/* Avatar Card */}
            <div className="card p-6">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[var(--brand-purple)] to-[var(--brand-cyan)] p-1">
                    <div className="w-full h-full rounded-full bg-[var(--background)] flex items-center justify-center overflow-hidden">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-12 h-12 text-[var(--brand-gray)]" />
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute bottom-0 right-0 p-2 rounded-full bg-[var(--brand-purple)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                {uploadingAvatar && (
                  <p className="text-sm text-[var(--brand-gray)] mt-2">Subiendo...</p>
                )}
                <h3 className="text-lg font-semibold mt-4">{fullName || profile?.email}</h3>
                <p className="text-sm text-[var(--brand-gray)]">{profile?.email}</p>
                <p className="text-xs text-[var(--brand-gray)] mt-2">
                  Miembro desde {profile?.created_at && format(new Date(profile.created_at), "MMMM yyyy", { locale: es })}
                </p>
              </div>
            </div>

            {/* Account Actions */}
            <div className="card overflow-hidden">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-[var(--background-secondary)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-[var(--brand-gray)]" />
                  <span className="font-medium">Cambiar contraseña</span>
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--brand-gray)]" />
              </button>
              <div className="border-t border-[var(--border)]" />
              <button
                onClick={() => setShowLogoutModal(true)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-[var(--danger)]/5 transition-colors text-[var(--danger)]"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Cerrar sesión</span>
                </div>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Right Column - Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Info */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-[var(--brand-purple)]" />
                Información personal
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-gray)]" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Tu nombre"
                      className="w-full pl-10 pr-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-gray)]" />
                    <input
                      type="email"
                      value={profile?.email || ""}
                      disabled
                      className="w-full pl-10 pr-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl opacity-50 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-[var(--brand-gray)] mt-1">El email no se puede cambiar</p>
                </div>
              </div>
            </div>

            {/* Billing Info */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[var(--brand-purple)]" />
                Datos de facturación
                <span className="text-xs font-normal text-[var(--brand-gray)]">(opcional)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tipo</label>
                  <select
                    value={billingType}
                    onChange={(e) => setBillingType(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)] appearance-none"
                  >
                    <option value="">Seleccionar...</option>
                    {BILLING_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre/Razón social</label>
                  <input
                    type="text"
                    value={billingName}
                    onChange={(e) => setBillingName(e.target.value)}
                    placeholder="Nombre completo o empresa"
                    className="w-full px-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">NIF/CIF/DNI</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-gray)]" />
                    <input
                      type="text"
                      value={billingTaxId}
                      onChange={(e) => setBillingTaxId(e.target.value)}
                      placeholder="12345678A"
                      className="w-full pl-10 pr-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">País</label>
                  <input
                    type="text"
                    value={billingCountry}
                    onChange={(e) => setBillingCountry(e.target.value)}
                    placeholder="España"
                    className="w-full px-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-2">Dirección</label>
                  <textarea
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    placeholder="Calle, número, piso, código postal, ciudad..."
                    rows={2}
                    className="w-full px-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)] resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--background)] rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-[var(--danger)]/10">
                <LogOut className="w-5 h-5 text-[var(--danger)]" />
              </div>
              <h3 className="font-semibold">¿Cerrar sesión?</h3>
            </div>
            <p className="text-sm text-[var(--brand-gray)] mb-6">
              Tendrás que volver a iniciar sesión para acceder a tu cuenta.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] font-medium hover:bg-[var(--background-secondary)] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 rounded-lg bg-[var(--danger)] text-white font-medium hover:opacity-90 transition-opacity"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Save Button - appears when there are unsaved changes */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-40 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-white font-medium shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      )}
    </>
  );
}

// Password Change Modal
function PasswordModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      setNewPassword("");
      setConfirmPassword("");
      setError("");
      setSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al cambiar contraseña";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--background)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold">Cambiar contraseña</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--success)]/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-[var(--success)]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Contraseña cambiada</h3>
            <p className="text-sm text-[var(--brand-gray)]">
              Tu contraseña se ha actualizado correctamente.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nueva contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-gray)]" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-12 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5 text-[var(--brand-gray)]" />
                  ) : (
                    <Eye className="w-5 h-5 text-[var(--brand-gray)]" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Confirmar contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-gray)]" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="w-full pl-10 pr-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-[var(--danger)]/10 text-[var(--danger)] text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl border border-[var(--border)] font-medium hover:bg-[var(--background-secondary)] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-xl gradient-brand text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Cambiando..." : "Cambiar contraseña"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
