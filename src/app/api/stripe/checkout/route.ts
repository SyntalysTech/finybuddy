import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { stripe, PLANS } from "@/lib/stripe";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { priceId } = await request.json();

    if (!priceId) {
      return NextResponse.json(
        { error: "priceId es requerido" },
        { status: 400 }
      );
    }

    // Verificar usuario autenticado desde la sesión (no confiar en el body)
    const serverSupabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await serverSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Usar service role para operaciones de BD (bypass RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name, stripe_customer_id, trial_ends_at")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el priceId es válido
    const planEntry = Object.entries(PLANS).find(
      ([, p]) => p.priceId === priceId
    );
    if (!planEntry || planEntry[0] === "basic") {
      return NextResponse.json(
        { error: "Plan no valido" },
        { status: 400 }
      );
    }

    // Obtener o crear cliente Stripe
    let customerId = profile.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        name: profile.full_name || undefined,
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;

      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId);
    }

    // Solo dar trial si NUNCA lo ha tenido (trial_ends_at === null)
    const trialAlreadyUsed = !!profile.trial_ends_at;

    const subscriptionData: {
      metadata: { supabase_user_id: string };
      trial_period_days?: number;
    } = {
      metadata: { supabase_user_id: userId },
    };

    if (!trialAlreadyUsed) {
      subscriptionData.trial_period_days = 15;

      // Marcar trial como usado AHORA para evitar abusos
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 15);
      await supabase
        .from("profiles")
        .update({
          trial_ends_at: trialEnd.toISOString(),
          subscription_status: "trialing",
        })
        .eq("id", userId);
    }

    const origin =
      request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: subscriptionData,
      success_url: `${origin}/planes?success=true`,
      cancel_url: `${origin}/planes?canceled=true`,
      locale: "es",
      allow_promotion_codes: true,
      metadata: { supabase_user_id: userId, plan: planEntry[0] },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Error al crear la sesion de pago" },
      { status: 500 }
    );
  }
}
