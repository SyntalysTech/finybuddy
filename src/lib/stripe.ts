import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

export const PLANS = {
  basic: {
    name: "Basic",
    nameEs: "Basic",
    price: 0,
    priceId: null,
  },
  pro_monthly: {
    name: "Pro Monthly",
    nameEs: "Pro Mensual",
    price: 14.99,
    priceId: process.env.STRIPE_PRICE_PRO_MONTHLY!,
  },
  pro_annual: {
    name: "Pro Annual",
    nameEs: "Pro Anual",
    price: 139.99,
    priceId: process.env.STRIPE_PRICE_PRO_ANNUAL!,
  },
} as const;

export type PlanKey = keyof typeof PLANS;
