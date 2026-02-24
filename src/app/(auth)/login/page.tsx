"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Mail, Lock, ArrowLeft, CheckCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Introduce tu email para recuperar la contraseña");
      return;
    }
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `https://finybuddy.com/auth/callback?next=/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Get user's preferred start page
      let startPage = "/dashboard";
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("start_page")
          .eq("id", data.user.id)
          .single();

        if (profile?.start_page) {
          startPage = `/${profile.start_page}`;
        }
      }
      router.push(startPage);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <Image
                src="/assets/logo-finybuddy-wordmark.png"
                alt="FinyBuddy"
                width={180}
                height={45}
                className="object-contain"
              />
            </Link>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">
              {forgotMode ? "Recuperar contraseña" : "Bienvenido de nuevo"}
            </h1>
            <p className="text-[var(--brand-gray)]">
              {forgotMode
                ? "Te enviaremos un enlace para restablecer tu contraseña"
                : "Inicia sesión para acceder a tu dashboard financiero"}
            </p>
          </div>

          {/* Reset email sent success */}
          {resetSent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[var(--success)]/10 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-[var(--success)]" />
              </div>
              <h3 className="text-lg font-semibold">Email enviado</h3>
              <p className="text-sm text-[var(--brand-gray)]">
                Te hemos enviado un enlace a <span className="font-medium text-[var(--foreground)]">{email}</span> para restablecer tu contraseña. Revisa tu bandeja de entrada.
              </p>
              <button
                onClick={() => {
                  setResetSent(false);
                  setForgotMode(false);
                  setError(null);
                }}
                className="inline-flex items-center gap-2 text-sm text-[var(--brand-cyan)] hover:text-[var(--brand-purple)] font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio de sesión
              </button>
            </div>
          ) : forgotMode ? (
            /* Forgot password form */
            <form onSubmit={handleForgotPassword} className="space-y-5">
              {error && (
                <div className="p-4 rounded-lg bg-[var(--danger)]/10 text-[var(--danger)] text-sm">
                  {error}
                </div>
              )}

              <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--brand-cyan)]/5 border border-[var(--brand-cyan)]/20">
                <Lock className="w-5 h-5 text-[var(--brand-cyan)] mt-0.5 shrink-0" />
                <p className="text-sm text-[var(--brand-gray)]">
                  Por seguridad, te enviaremos un enlace a tu email para que puedas establecer una nueva contraseña.
                </p>
              </div>

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
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Enviando..." : "Enviar email de recuperación"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setForgotMode(false);
                  setError(null);
                }}
                className="w-full inline-flex items-center justify-center gap-2 text-sm text-[var(--brand-gray)] hover:text-[var(--foreground)] font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio de sesión
              </button>
            </form>
          ) : (
            /* Login form */
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="p-4 rounded-lg bg-[var(--danger)]/10 text-[var(--danger)] text-sm">
                  {error}
                </div>
              )}

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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMode(true);
                      setError(null);
                    }}
                    className="text-xs text-[var(--brand-cyan)] hover:text-[var(--brand-purple)] font-medium transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-gray)] pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                    style={{ paddingLeft: '48px', paddingRight: '48px' }}
                    placeholder="••••••••"
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Iniciando sesión..." : "Iniciar sesión"}
              </button>
            </form>
          )}

        </div>
      </div>

      {/* Right Panel - Illustration */}
      <div className="hidden lg:flex flex-1 gradient-brand items-center justify-center p-8">
        <div className="text-center text-white max-w-md">
          <div className="mb-8">
            <Image
              src="/assets/logo-finybuddy-wordmark.png"
              alt="FinyBuddy"
              width={240}
              height={60}
              className="mx-auto brightness-0 invert"
            />
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Toma el control de tus finanzas
          </h2>
          <p className="text-lg opacity-90">
            Gestiona tus ingresos, gastos, ahorros y deudas en un solo lugar.
            Tu compañero financiero personal.
          </p>
        </div>
      </div>
    </div>
  );
}
