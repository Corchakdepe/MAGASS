"use client";

import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import StressType from "./components/StressType";
import { FormHeader } from "@/components/controls/SimulationControls/components/FormHeader";
import type { StressTypeValue } from "./types/types";
import { SimulationNameField } from "./components/SimulationNameField";
import { PercentSliderField } from "./components/PercentSliderField";
import { DeltaField } from "./components/DeltaField";
import { RunSimulationButton } from "./components/RunSimulationButton";
import FileUpload from "@/components/sidebar/components/file-upload";

type SimulationFormProps = {
  stress: number;
  setStress: (v: number) => void;
  walkCost: number;
  setWalkCost: (v: number) => void;
  delta: number;
  setDelta: (v: number) => void;
  stressType: StressTypeValue;
  setStressType: (v: StressTypeValue) => void;
  simName: string;
  setSimName: (v: string) => void;
  folderPath: string;
  setFolderPath: (v: string) => void;
  onFileUpload?: (files: File[]) => Promise<string | null>;
  uploadedFiles?: File[];
  onRunSimulation: () => void;
  isLoading: boolean;
};

export default function SimulationForm(props: SimulationFormProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <FormHeader
        title={t("simulationParameters")}
        description={t("nameStressWalkingCostDelta")}
      />
      <div className="h-px w-full bg-surface-3" />

      <SimulationNameField simName={props.simName} setSimName={props.setSimName} />

      <FileUpload
        setFolderPath={props.setFolderPath}
        folderPath={props.folderPath}
        onFileUpload={props.onFileUpload}
        uploadedFiles={props.uploadedFiles}
      />

      <PercentSliderField
        id="stress"
        label={t("stressLevel")}
        value={props.stress}
        setValue={props.setStress}
      />
      <PercentSliderField
        id="walkCost"
        label={t("walkCost")}
        value={props.walkCost}
        setValue={props.setWalkCost}
      />
      <DeltaField delta={props.delta} setDelta={props.setDelta} />
      <StressType stressType={props.stressType} setStressType={props.setStressType} />
      <RunSimulationButton
        onRunSimulation={props.onRunSimulation}
        isLoading={props.isLoading}
        disabled={!props.simName.trim() || !props.folderPath}
      />
    </div>
  );
}