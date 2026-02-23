"use client";

import { useState } from "react";
import Link from "next/link";
import { useSubscription } from "@/hooks/useSubscription";
import { Clock, AlertTriangle, X } from "lucide-react";

export default function TrialBanner() {
  const { isTrialing, trialDaysLeft, trialExpired, isPro, loading } =
    useSubscription();
  const [dismissed, setDismissed] = useState(false);

  if (loading || dismissed) return null;

  if (isTrialing && trialDaysLeft <= 5) {
    return (
      <div className="bg-gradient-to-r from-[#02EAFF]/10 to-[#7739FE]/10 border-b border-[#02EAFF]/20 px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-[#02EAFF] shrink-0" />
          <span>
            Te quedan <strong>{trialDaysLeft} dias</strong> de prueba Pro.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/planes"
            className="text-xs px-3 py-1 rounded-lg bg-gradient-to-r from-[#02EAFF] to-[#7739FE] text-white font-medium hover:opacity-90 transition-opacity"
          >
            Suscribirse
          </Link>
          <button onClick={() => setDismissed(true)}>
            <X className="w-4 h-4 text-[var(--brand-gray)]" />
          </button>
        </div>
      </div>
    );
  }

  if (trialExpired && !isPro) {
    return (
      <div className="bg-[#F59E0B]/10 border-b border-[#F59E0B]/20 px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0" />
          <span>
            Tu periodo de prueba ha terminado. Algunas funciones estan
            limitadas.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/planes"
            className="text-xs px-3 py-1 rounded-lg bg-gradient-to-r from-[#02EAFF] to-[#7739FE] text-white font-medium hover:opacity-90 transition-opacity"
          >
            Ver planes
          </Link>
          <button onClick={() => setDismissed(true)}>
            <X className="w-4 h-4 text-[var(--brand-gray)]" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
