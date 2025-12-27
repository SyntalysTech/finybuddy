"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  // Load theme from profile on mount
  useEffect(() => {
    const loadTheme = async () => {
      // First check localStorage for immediate feedback
      const storedTheme = localStorage.getItem("theme") as Theme | null;
      if (storedTheme) {
        setThemeState(storedTheme);
      }

      // Then try to load from profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("theme")
          .eq("id", user.id)
          .single();

        if (data?.theme) {
          const profileTheme = data.theme as Theme;
          setThemeState(profileTheme);
          localStorage.setItem("theme", profileTheme);
        }
      }
      setMounted(true);
    };

    loadTheme();
  }, []);

  // Resolve system theme and apply class
  useEffect(() => {
    const updateResolvedTheme = () => {
      let resolved: "light" | "dark";
      if (theme === "system") {
        resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      } else {
        resolved = theme;
      }
      setResolvedTheme(resolved);

      // Apply theme class to html element
      if (resolved === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    updateResolvedTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        updateResolvedTheme();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);

    // Save to profile
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ theme: newTheme, updated_at: new Date().toISOString() })
        .eq("id", user.id);
    }
  };

  // Prevent flash on initial load
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
