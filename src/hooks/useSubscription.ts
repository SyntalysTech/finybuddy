"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SubscriptionStatus, SubscriptionPlan } from "@/types/database";

interface SubscriptionData {
  subscription_status: SubscriptionStatus;
  subscription_plan: SubscriptionPlan;
  trial_ends_at: string | null;
  subscription_current_period_end: string | null;
  subscription_cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
}

interface UseSubscriptionReturn {
  isPro: boolean;
  isTrialing: boolean;
  trialDaysLeft: number;
  trialExpired: boolean;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  willCancel: boolean;
  periodEnd: string | null;
  hasStripeCustomer: boolean;
  loading: boolean;
}

export function useSubscription(): UseSubscriptionReturn {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const fetchSubscription = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select(
          "subscription_status, subscription_plan, trial_ends_at, subscription_current_period_end, subscription_cancel_at_period_end, stripe_customer_id"
        )
        .eq("id", user.id)
        .single();

      if (!error && profile) {
        setData(profile as SubscriptionData);
      }
      setLoading(false);
    };

    fetchSubscription();
  }, []);

  return useMemo(() => {
    if (!data || loading) {
      return {
        isPro: false,
        isTrialing: false,
        trialDaysLeft: 0,
        trialExpired: false,
        plan: "basic" as SubscriptionPlan,
        status: "incomplete" as SubscriptionStatus,
        willCancel: false,
        periodEnd: null,
        hasStripeCustomer: false,
        loading,
      };
    }

    const now = new Date();
    const trialEnd = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
    const isTrialing =
      data.subscription_status === "trialing" &&
      trialEnd !== null &&
      trialEnd > now;
    const trialExpired =
      trialEnd !== null &&
      trialEnd <= now &&
      data.subscription_status !== "active";
    const trialDaysLeft =
      isTrialing && trialEnd
        ? Math.max(
            0,
            Math.ceil(
              (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            )
          )
        : 0;

    const hasActiveSubscription = data.subscription_status === "active";
    const isPro = isTrialing || hasActiveSubscription;

    return {
      isPro,
      isTrialing,
      trialDaysLeft,
      trialExpired,
      plan: isPro ? data.subscription_plan : "basic",
      status: data.subscription_status,
      willCancel: data.subscription_cancel_at_period_end,
      periodEnd: data.subscription_current_period_end,
      hasStripeCustomer: !!data.stripe_customer_id,
      loading: false,
    };
  }, [data, loading]);
}
