import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

async function updateSubscriptionInDB(
  supabase: SupabaseClient,
  userId: string,
  subscription: Stripe.Subscription
) {
  const item = subscription.items.data[0];
  const priceId = item?.price?.id;

  let plan = "basic";
  if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY) {
    plan = "pro_monthly";
  } else if (priceId === process.env.STRIPE_PRICE_PRO_ANNUAL) {
    plan = "pro_annual";
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {
    subscription_status: subscription.status,
    subscription_plan: plan,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    subscription_current_period_end: item?.current_period_end
      ? new Date(item.current_period_end * 1000).toISOString()
      : null,
    subscription_cancel_at_period_end: subscription.cancel_at_period_end,
  };

  // Si la suscripción está en trial, asegurar que trial_ends_at está seteado
  if (subscription.status === "trialing" && subscription.trial_end) {
    updateData.trial_ends_at = new Date(
      subscription.trial_end * 1000
    ).toISOString();
  }

  await supabase.from("profiles").update(updateData).eq("id", userId);
}

async function getUserIdByCustomerId(
  supabase: SupabaseClient,
  customerId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();
  return data?.id || null;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        if (userId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          await updateSubscriptionInDB(supabase, userId, subscription);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId =
          subscription.metadata?.supabase_user_id ||
          (await getUserIdByCustomerId(
            supabase,
            subscription.customer as string
          ));
        if (userId) {
          await updateSubscriptionInDB(supabase, userId, subscription);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId =
          subscription.metadata?.supabase_user_id ||
          (await getUserIdByCustomerId(
            supabase,
            subscription.customer as string
          ));
        if (userId) {
          await supabase
            .from("profiles")
            .update({
              subscription_status: "canceled",
              subscription_plan: "basic",
              stripe_subscription_id: null,
              stripe_price_id: null,
              subscription_current_period_end: null,
              subscription_cancel_at_period_end: false,
            })
            .eq("id", userId);
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(
          `Invoice paid: ${invoice.id} for customer ${invoice.customer}`
        );
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const userId = await getUserIdByCustomerId(
          supabase,
          invoice.customer as string
        );
        if (userId) {
          await supabase
            .from("profiles")
            .update({ subscription_status: "past_due" })
            .eq("id", userId);
        }
        break;
      }

      case "customer.subscription.trial_will_end": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId =
          subscription.metadata?.supabase_user_id ||
          (await getUserIdByCustomerId(
            supabase,
            subscription.customer as string
          ));
        if (userId) {
          await supabase.from("notifications").insert({
            user_id: userId,
            title: "Tu periodo de prueba termina pronto",
            message:
              "Tu prueba gratuita de FinyBuddy Pro termina en 3 dias. Suscribete para seguir disfrutando de todas las funcionalidades.",
            type: "warning",
            icon: "crown",
            action_url: "/planes",
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler error" },
      { status: 500 }
    );
  }
}
