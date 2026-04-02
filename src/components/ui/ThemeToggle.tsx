"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useState, useEffect } from "react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDarkTheme = document.documentElement.classList.contains("dark");
    setIsDark(isDarkTheme);
  }, []);

  const handleToggle = () => {
    const root = document.documentElement;
    const isNowDark = root.classList.toggle("dark");
    localStorage.setItem("pacto-theme", isNowDark ? "dark" : "light");
    setIsDark(isNowDark);
  };

  if (!mounted) {
    return (
      <button
        type="button"
        className="fixed top-5 right-5 z-[70] h-11 w-11 rounded-full glass-panel hover-lift magnetic flex items-center justify-center text-foreground"
        aria-label="Alternar tema"
        disabled
      />
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="fixed top-5 right-5 z-[70] h-11 w-11 rounded-full glass-panel hover-lift magnetic flex items-center justify-center text-foreground"
      aria-label="Alternar tema claro/escuro"
      title="Alternar tema"
    >
      {isDark ? <SunMedium className="h-5 w-5" /> : <MoonStar className="h-5 w-5" />}
    </button>
  );
}
