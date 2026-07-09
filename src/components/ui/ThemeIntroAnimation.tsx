"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import {
  getElementCenter,
  getSystemTheme,
  setThemeWithTransition,
} from "@/lib/themeTransition";

const INTRO_FLAG = "__blocksThemeIntroPlayed";
const THEME_TOGGLE_SELECTOR = "[data-theme-toggle]";
const THEME_SETTLE_DELAY_MS = 160;

export function ThemeIntroAnimation() {
  const { setTheme } = useTheme();

  useEffect(() => {
    const win = window as Window & { [INTRO_FLAG]?: boolean };
    if (win[INTRO_FLAG]) return;

    win[INTRO_FLAG] = true;

    const switchBackToSystem = () => {
      const systemTheme = getSystemTheme();
      const currentTheme = document.documentElement.classList.contains("dark")
        ? "dark"
        : "light";

      if (currentTheme === systemTheme) {
        setTheme("system");
        return;
      }

      const themeToggle = document.querySelector(THEME_TOGGLE_SELECTOR);
      window.setTimeout(() => {
        void setThemeWithTransition(
          setTheme,
          "system",
          getElementCenter(themeToggle),
        );
      }, THEME_SETTLE_DELAY_MS);
    };

    if (document.readyState === "complete") {
      switchBackToSystem();
      return;
    }

    window.addEventListener("load", switchBackToSystem, { once: true });
    return () => window.removeEventListener("load", switchBackToSystem);
  }, [setTheme]);

  return null;
}
