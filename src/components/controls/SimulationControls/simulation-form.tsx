"use client";

import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { CheckCircle, Circle, ChevronRight, Upload, Settings, Play, Zap, Sliders } from "lucide-react";
import StressType from "./components/StressType";
import type { StressTypeValue } from "./types/types";
import { SimulationNameField } from "./components/SimulationNameField";
import { PercentSliderField } from "./components/PercentSliderField";
import { DeltaField } from "./components/DeltaField";
import { RunSimulationButton } from "./components/RunSimulationButton";
import FileUpload from "@/components/sidebar/components/file-upload";
import { cn } from "@/lib/utils";

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

type Step = "setup" | "parameters" | "advanced";

export default function SimulationForm(props: SimulationFormProps) {
  const { t } = useLanguage();
  const [activeStep, setActiveStep] = useState<Step>("setup");

  const steps = [
    { id: "setup", label: "Setup", icon: Upload },
    { id: "parameters", label: "Parameters", icon: Zap },
    { id: "advanced", label: "Advanced", icon: Sliders },
  ];

  const isStepComplete = (step: Step) => {
    switch (step) {
      case "setup":
        return !!props.simName.trim() && !!props.folderPath;
      case "parameters":
        return true; // Parameters always have defaults
      case "advanced":
        return true; // Advanced always has defaults
      default:
        return false;
    }
  };

  const StepIndicator = ({ step, label, isActive, isComplete, icon: Icon }: any) => (
    <button
      onClick={() => setActiveStep(step)}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg w-full transition-all text-left",
        isActive
          ? "bg-accent-soft border border-accent/20"
          : "hover:bg-surface-2"
      )}
    >
      <div className={cn(
        "p-1.5 rounded-full shrink-0",
        isComplete
          ? "bg-success-soft text-success"
          : isActive
          ? "bg-accent-soft text-accent"
          : "bg-surface-3 text-text-tertiary"
      )}>
        {isComplete ? (
          <CheckCircle className="h-3.5 w-3.5" />
        ) : (
          <Icon className="h-3.5 w-3.5" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-text-primary truncate">{label}</div>
        <div className="text-[10px] text-text-secondary">
          {isComplete ? "Complete" : "Incomplete"}
        </div>
      </div>
      <ChevronRight className={cn(
        "h-3.5 w-3.5 shrink-0 transition-transform",
        isActive ? "rotate-90" : "text-text-tertiary"
      )} />
    </button>
  );

  return (
    <div className="space-y-3 p-3">
      {/* Header - More Compact */}
      <div className="flex items-center gap-2 pb-3 border-b border-surface-3">
        <div className="p-1.5 rounded-md bg-gradient-to-br from-accent to-accent-hover shadow-xs">
          <Play className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-text-primary truncate">
            New Simulation
          </h2>
          <p className="text-[10px] text-text-tertiary truncate">
            Step-by-step configuration
          </p>
        </div>
      </div>

      {/* Step Indicators - More Compact */}
      <div className="space-y-1.5">
        {steps.map((step) => (
          <StepIndicator
            key={step.id}
            step={step.id}
            label={step.label}
            icon={step.icon}
            isActive={activeStep === step.id}
            isComplete={isStepComplete(step.id as Step)}
          />
        ))}
      </div>

      {/* Active Step Content - More Compact */}
      <div className="rounded-lg border border-surface-3 bg-surface-1 shadow-mac-panel p-4">
        {activeStep === "setup" && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-text-primary mb-2 tracking-wide uppercase">
              Simulation Setup
            </h3>
            <div className="space-y-2">
              <SimulationNameField simName={props.simName} setSimName={props.setSimName} compact />
              <FileUpload
                setFolderPath={props.setFolderPath}
                folderPath={props.folderPath}
                onFileUpload={props.onFileUpload}
                uploadedFiles={props.uploadedFiles}
                compact
              />
            </div>
            <div className="flex gap-2 pt-3">
              <button
                onClick={() => setActiveStep("parameters")}
                disabled={!props.simName.trim() || !props.folderPath}
                className={cn(
                  "flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all",
                  props.simName.trim() && props.folderPath
                    ? "bg-accent text-white hover:bg-accent-hover shadow-xs"
                    : "bg-surface-3 text-text-tertiary cursor-not-allowed"
                )}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {activeStep === "parameters" && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-text-primary mb-2 tracking-wide uppercase">
              Stress Parameters
            </h3>
            <div className="space-y-2">
              <PercentSliderField
                id="stress"
                label={t("stressLevel")}
                value={props.stress}
                setValue={props.setStress}
                compact
              />
              <PercentSliderField
                id="walkCost"
                label={t("walkCost")}
                value={props.walkCost}
                setValue={props.setWalkCost}
                compact
              />
            </div>
            <div className="flex gap-2 pt-3">
              <button
                onClick={() => setActiveStep("setup")}
                className="flex-1 py-1.5 px-3 rounded-md border border-surface-3 bg-surface-2 text-xs font-medium text-text-primary hover:bg-surface-3 transition-all"
              >
                Back
              </button>
              <button
                onClick={() => setActiveStep("advanced")}
                className="flex-1 py-1.5 px-3 rounded-md bg-accent text-white text-xs font-medium hover:bg-accent-hover shadow-xs transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {activeStep === "advanced" && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-text-primary mb-2 tracking-wide uppercase">
              Advanced Settings
            </h3>
            <div className="space-y-2">
              <DeltaField delta={props.delta} setDelta={props.setDelta} compact />
              <StressType
                stressType={props.stressType}
                setStressType={props.setStressType}
                compact
              />
            </div>
            <div className="flex gap-2 pt-3">
              <button
                onClick={() => setActiveStep("parameters")}
                className="flex-1 py-1.5 px-3 rounded-md border border-surface-3 bg-surface-2 text-xs font-medium text-text-primary hover:bg-surface-3 transition-all"
              >
                Back
              </button>
              <RunSimulationButton
                onRunSimulation={props.onRunSimulation}
                isLoading={props.isLoading}
                disabled={!props.simName.trim() || !props.folderPath}
                className="flex-1"
                compact
              />
            </div>
          </div>
        )}
      </div>

      {/* Status Indicator */}
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-2 border border-surface-3">
          <div className={cn(
            "h-1.5 w-1.5 rounded-full",
            activeStep === "setup" && !isStepComplete("setup") ? "bg-warning" :
            activeStep === "parameters" ? "bg-accent" :
            activeStep === "advanced" ? "bg-success" : "bg-surface-3"
          )} />
          <span className="text-[10px] font-medium text-text-secondary">
            Step {["setup", "parameters", "advanced"].indexOf(activeStep) + 1} of 3
          </span>
        </div>
      </div>
    </div>
  );
}