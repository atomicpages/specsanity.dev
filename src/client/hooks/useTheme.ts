import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { type Theme, themeAtom } from "../atoms/theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function subscribeToSystemTheme(callback: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

export function useTheme() {
  const [theme, setThemeRaw] = useAtom(themeAtom);
  const systemTheme = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemTheme,
    () => "light" as const,
  );

  const resolvedTheme = useMemo(() => {
    if (theme === "system") {
      return systemTheme;
    }
    return theme;
  }, [theme, systemTheme]);

  const applyTheme = useCallback((resolved: "light" | "dark") => {
    const root = document.documentElement;
    if (resolved === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, []);

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme, applyTheme]);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeRaw(next);
    },
    [setThemeRaw],
  );

  return { theme, setTheme, resolvedTheme } as const;
}
