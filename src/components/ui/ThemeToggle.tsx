"use client";

import { useRef } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/cn";
import {
  getElementCenter,
  setThemeWithTransition,
} from "@/lib/themeTransition";

/**
 * Dark/light toggle with the View Transitions circular reveal
 * (technique from theme-toggle.rdsx.dev). Falls back to an instant
 * switch when the View Transitions API isn't available.
 *
 * Icons are toggled with CSS `dark:` variants (no mount flag needed):
 * next-themes sets the `.dark` class before first paint, so there is no
 * hydration mismatch.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme } = useTheme();
  const btnRef = useRef<HTMLButtonElement>(null);

  const toggle = () => {
    const isDark = document.documentElement.classList.contains("dark");
    const next = isDark ? "light" : "dark";

    void setThemeWithTransition(setTheme, next, getElementCenter(btnRef.current));
  };

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={toggle}
      aria-label="Cambiar tema"
      data-theme-toggle
      className={cn(
        "glass-pill inline-flex h-9 w-9 items-center justify-center rounded-lg border text-fg transition-colors hover:bg-white/18 dark:hover:bg-white/5",
        className,
      )}
    >
      <MoonIcon className="h-5 w-5 text-primary dark:hidden" />
      <SunIcon className="hidden h-5 w-5 text-gold dark:block" />
    </button>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
