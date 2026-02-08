"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    const root = document.documentElement;
    if (initial === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, []);

  const handleToggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    const root = document.documentElement;
    if (next === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    window.localStorage.setItem("theme", next);
  };

  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";
  const tooltip = isDark ? "Switch to Light" : "Switch to Dark";

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={label}
      title={tooltip}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-sand-300 bg-white text-slate-700 transition-colors hover:bg-sand-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 active:scale-[0.98]"
    >
      {isDark ? (
        <svg
          aria-hidden="true"
          className="h-4.5 w-4.5"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M12 3.75a1 1 0 0 1 1 1v1.5a1 1 0 1 1-2 0v-1.5a1 1 0 0 1 1-1Z"
            fill="currentColor"
          />
          <path
            d="M6.34 6.34a1 1 0 0 1 1.42 0l1.06 1.06a1 1 0 0 1-1.42 1.42L6.34 7.76a1 1 0 0 1 0-1.42Z"
            fill="currentColor"
          />
          <path
            d="M3.75 12a1 1 0 0 1 1-1h1.5a1 1 0 1 1 0 2h-1.5a1 1 0 0 1-1-1Z"
            fill="currentColor"
          />
          <path
            d="M6.34 17.66a1 1 0 0 1 1.42 0l1.06 1.06a1 1 0 0 1-1.42 1.42l-1.06-1.06a1 1 0 0 1 0-1.42Z"
            fill="currentColor"
          />
          <path
            d="M12 17.75a1 1 0 0 1 1 1v1.5a1 1 0 1 1-2 0v-1.5a1 1 0 0 1 1-1Z"
            fill="currentColor"
          />
          <path
            d="M16.18 18.72a1 1 0 0 1 1.42-1.42l1.06 1.06a1 1 0 0 1-1.42 1.42l-1.06-1.06Z"
            fill="currentColor"
          />
          <path
            d="M17.75 12a1 1 0 0 1 1-1h1.5a1 1 0 1 1 0 2h-1.5a1 1 0 0 1-1-1Z"
            fill="currentColor"
          />
          <path
            d="M16.18 5.28a1 1 0 0 1 1.42 0l1.06 1.06a1 1 0 1 1-1.42 1.42l-1.06-1.06a1 1 0 0 1 0-1.42Z"
            fill="currentColor"
          />
          <path
            d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"
            fill="currentColor"
          />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          className="h-4.5 w-4.5"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M20.1 14.5A8.5 8.5 0 0 1 9.5 3.9 7 7 0 1 0 20.1 14.5Z"
            fill="currentColor"
          />
        </svg>
      )}
    </button>
  );
}
