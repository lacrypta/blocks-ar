type ThemeSetter = (theme: string) => void;

type ViewTransition = {
  ready: Promise<void>;
  finished: Promise<void>;
};

type ViewTransitionDocument = Document & {
  startViewTransition?: (cb: () => void) => ViewTransition;
};

type TransitionOrigin = {
  x: number;
  y: number;
};

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const SYSTEM_DARK_QUERY = "(prefers-color-scheme: dark)";

export function getSystemTheme(): "dark" | "light" {
  return window.matchMedia(SYSTEM_DARK_QUERY).matches ? "dark" : "light";
}

export function getOppositeTheme(theme: "dark" | "light"): "dark" | "light" {
  return theme === "dark" ? "light" : "dark";
}

export function getElementCenter(
  element: Element | null | undefined,
): TransitionOrigin | undefined {
  const rect = element?.getBoundingClientRect();
  if (!rect) return undefined;

  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function resolveTheme(theme: string): "dark" | "light" | undefined {
  if (theme === "system") return getSystemTheme();
  if (theme === "dark" || theme === "light") return theme;
  return undefined;
}

function applyThemeClass(theme: string) {
  const resolvedTheme = resolveTheme(theme);
  if (!resolvedTheme) return;

  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolvedTheme);
  root.style.colorScheme = resolvedTheme;
}

export async function setThemeWithTransition(
  setTheme: ThemeSetter,
  nextTheme: string,
  origin?: TransitionOrigin,
) {
  const doc = document as ViewTransitionDocument;
  const prefersReduced = window.matchMedia(REDUCED_MOTION_QUERY).matches;

  if (!doc.startViewTransition || prefersReduced) {
    applyThemeClass(nextTheme);
    setTheme(nextTheme);
    return;
  }

  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? window.innerHeight / 2;
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  const transition = doc.startViewTransition(() => {
    applyThemeClass(nextTheme);
    setTheme(nextTheme);
  });
  void transition.finished.catch(() => {});

  try {
    await transition.ready;
  } catch {
    return;
  }

  document.documentElement.animate(
    {
      clipPath: [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ],
    },
    {
      duration: 480,
      easing: "ease-in-out",
      pseudoElement: "::view-transition-new(root)",
    },
  );
}
