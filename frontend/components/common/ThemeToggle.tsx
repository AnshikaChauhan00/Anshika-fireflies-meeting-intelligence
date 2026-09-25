"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // localStorage unavailable (e.g. private browsing); theme just won't persist
    }
  }

  if (!mounted) return null;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={toggle}
      className={cn(
        "flex h-9 w-16 items-center rounded-full border border-gray-200 px-1 transition-colors dark:border-gray-700",
        isDark ? "bg-gray-800" : "bg-gray-100"
      )}
      aria-label="Toggle dark mode"
    >
      <span
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full bg-white shadow transition-transform dark:bg-gray-900",
          isDark && "translate-x-7"
        )}
      >
        {isDark ? <Moon className="h-3.5 w-3.5 text-brand-400" /> : <Sun className="h-3.5 w-3.5 text-amber-500" />}
      </span>
    </button>
  );
}
