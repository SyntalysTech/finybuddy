"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
  locale: string;
  theme: string;
  start_page: string;
  show_decimals: boolean;
  rule_needs_percent: number;
  rule_wants_percent: number;
  rule_savings_percent: number;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const getFirstName = () => {
    if (!profile?.full_name) return null;
    return profile.full_name.split(" ")[0];
  };

  return { profile, loading, getFirstName };
}
