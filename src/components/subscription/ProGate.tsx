"use client";

import { useSubscription } from "@/hooks/useSubscription";
import Link from "next/link";
import { Crown, Sparkles } from "lucide-react";

interface ProGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  featureName?: string;
}

export default function ProGate({
  children,
  fallback,
  featureName,
}: ProGateProps) {
  const { isPro, loading } = useSubscription();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-cyan)]" />
      </div>
    );
  }

  if (isPro) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--brand-cyan)] to-[var(--brand-purple)] flex items-center justify-center">
        <Crown className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-xl font-bold">
        {featureName
          ? `${featureName} es una funcion Pro`
          : "Funcion exclusiva Pro"}
      </h2>
      <p className="text-[var(--brand-gray)] max-w-md">
        Actualiza a FinyBuddy Pro para desbloquear esta funcionalidad y muchas
        mas. Prueba gratis durante 15 dias.
      </p>
      <Link
        href="/planes"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--brand-cyan)] to-[var(--brand-purple)] text-white font-semibold hover:opacity-90 transition-opacity"
      >
        <Sparkles className="w-5 h-5" />
        Ver planes
      </Link>
    </div>
  );
}
