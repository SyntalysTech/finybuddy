import Stripe from "stripe";

// Lazy initialization para evitar crash en build de Vercel
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY no está configurado");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    });
  }
  return _stripe;
}

// Mantener export "stripe" como getter para compatibilidad
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const PLANS = {
  basic: {
    name: "Basic",
    nameEs: "Basic",
    price: 0,
    priceId: null as string | null,
  },
  pro_monthly: {
    name: "Pro Monthly",
    nameEs: "Pro Mensual",
    price: 14.99,
    priceId: process.env.STRIPE_PRICE_PRO_MONTHLY || null,
  },
  pro_annual: {
    name: "Pro Annual",
    nameEs: "Pro Anual",
    price: 139.99,
    priceId: process.env.STRIPE_PRICE_PRO_ANNUAL || null,
  },
} as const;

export type PlanKey = keyof typeof PLANS;
