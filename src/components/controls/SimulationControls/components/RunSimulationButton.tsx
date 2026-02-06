"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  disabled: boolean;
  isLoading: boolean;
  onRunSimulation: () => void;
};

export function RunSimulationButton({ disabled, isLoading, onRunSimulation }: Props) {
  const { t } = useLanguage();

  return (
    <div className="pt-2">
      <Button
        onClick={onRunSimulation}
        disabled={disabled || isLoading}
        className="w-full h-9 text-xs font-medium bg-accent hover:bg-accent/90 text-white disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("runningSimulation") || "Running..."}
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            {t("runSimulation") || "Run Simulation"}
          </>
        )}
      </Button>
    </div>
  );
}
