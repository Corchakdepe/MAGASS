"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SimulationProvider } from "@/contexts/SimulationContext";
import AppLayout from "@/components/app-layout";

type Props = { children: ReactNode };

export default function AppShell({ children }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const stored = window.localStorage.getItem("theme");

    if (stored === "light" || stored === "dark") {
      if (stored === "dark") root.classList.add("dark");
      else root.classList.remove("dark");
    } else {
      const prefersDark = window
        .matchMedia("(prefers-color-scheme: dark)")
        .matches;
      if (prefersDark) root.classList.add("dark");
      else root.classList.remove("dark");
    }

    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <SimulationProvider>
      <AppLayout>{children}</AppLayout>
    </SimulationProvider>
  );
}