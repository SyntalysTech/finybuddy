"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full gradient-brand flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-4">¡Revisa tu correo!</h1>
          <p className="text-[var(--brand-gray)] mb-6">
            Te hemos enviado un enlace de confirmación a{" "}
            <span className="font-medium text-[var(--foreground)]">{email}</span>.
            Haz clic en el enlace para activar tu cuenta.
          </p>
          <Link href="/login" className="btn-primary inline-block">
            Volver a inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Illustration */}
      <div className="hidden lg:flex flex-1 gradient-brand items-center justify-center p-8">
        <div className="text-center text-white">
          <Image
            src="/assets/finybuddy-mascot.png"
            alt="FinyBuddy Mascot"
            width={300}
            height={300}
            className="mx-auto mb-8"
          />
          <h2 className="text-3xl font-bold mb-4">
            Empieza tu camino financiero
          </h2>
          <p className="text-lg opacity-90 max-w-md">
            Únete a miles de usuarios que ya controlan sus finanzas con FinyBuddy.
            Es gratis y solo te tomará unos segundos.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image
                src="/assets/finybuddy-mascot.png"
                alt="FinyBuddy"
                width={48}
                height={48}
              />
              <Image
                src="/assets/logo-finybuddy-wordmark.png"
                alt="FinyBuddy"
                width={160}
                height={40}
                className="object-contain"
              />
            </Link>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Crear cuenta</h1>
            <p className="text-[var(--brand-gray)]">
              Completa los datos para empezar a usar FinyBuddy
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <div className="p-4 rounded-lg bg-[var(--danger)]/10 text-[var(--danger)] text-sm">
                {error}
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Nombre completo
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-gray)] pointer-events-none" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input"
                  style={{ paddingLeft: '48px' }}
                  placeholder="Tu nombre"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-gray)] pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  style={{ paddingLeft: '48px' }}
                  placeholder="tu@email.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-gray)] pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  style={{ paddingLeft: '48px', paddingRight: '48px' }}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--brand-gray)] hover:text-[var(--foreground)]"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Confirmar contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-gray)] pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input"
                  style={{ paddingLeft: '48px' }}
                  placeholder="Repite tu contraseña"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          {/* Terms */}
          <p className="text-center mt-4 text-xs text-[var(--brand-gray)]">
            Al registrarte, aceptas nuestros{" "}
            <Link href="/terms" className="text-[var(--brand-cyan)] hover:underline">
              Términos de Servicio
            </Link>{" "}
            y{" "}
            <Link href="/privacy" className="text-[var(--brand-cyan)] hover:underline">
              Política de Privacidad
            </Link>
          </p>

          {/* Login Link */}
          <p className="text-center mt-6 text-[var(--brand-gray)]">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="text-[var(--brand-cyan)] hover:underline font-medium"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
