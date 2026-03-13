"use client";

import * as React from "react";
import { AdvancedToggle } from "./components/AdvancedToggle";
import { DeltaConfiguration } from "./components/DeltaConfiguration";
import { FolderConfiguration } from "./components/FolderConfiguration";
import type { AdvancedControlsProps } from "./types/advancedControls";

export type { DeltaMode } from "./types/advancedControls";
export type { AdvancedControlsProps } from "./types/advancedControls";

export function AdvancedControls({
  advancedUser,
  setAdvancedUser,
  deltaMode,
  setDeltaMode,
  deltaValueTxt,
  setDeltaValueTxt,
  advancedEntrada,
  setAdvancedEntrada,
  advancedSalida,
  setAdvancedSalida,
}: AdvancedControlsProps) {
  return (
    <div className="rounded-lg border border-surface-3 bg-surface-0/30 p-4 space-y-4">
      <AdvancedToggle
        advancedUser={advancedUser}
        setAdvancedUser={setAdvancedUser}
      />

      {advancedUser && (
        <div className="space-y-4">
          <DeltaConfiguration
            deltaMode={deltaMode}
            setDeltaMode={setDeltaMode}
            deltaValueTxt={deltaValueTxt}
            setDeltaValueTxt={setDeltaValueTxt}
          />

          <div className="h-px bg-surface-3/50" aria-hidden="true" />

          <FolderConfiguration
            advancedEntrada={advancedEntrada}
            setAdvancedEntrada={setAdvancedEntrada}
            advancedSalida={advancedSalida}
            setAdvancedSalida={setAdvancedSalida}
          />
        </div>
      )}
    </div>
  );
}