"use client";

import * as React from "react";
import {useLanguage} from "@/contexts/LanguageContext";
import type {FiltersPanelProps} from "./types/filters";

export function FiltersPanel({runId}: FiltersPanelProps) {
  const {t} = useLanguage();

  return (
    <div className="h-full w-full overflow-auto p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary mb-1">
          {t("filters")}
        </h2>
        <p className="text-sm text-text-secondary">
          {t("configureDataFilters")}
        </p>
      </div>

      <div className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md p-4">
        <p className="text-sm text-text-secondary">
          Filters configuration for run: <code className="font-mono text-xs">{runId}</code>
        </p>
        {/* TODO: Add actual filters implementation */}
      </div>
    </div>
  );
}
