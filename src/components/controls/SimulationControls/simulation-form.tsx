"use client";

import React, {useState, useCallback, memo, useEffect} from "react";
import {useLanguage} from "@/contexts/LanguageContext";
import {CheckCircle, ChevronRight, Upload, Play, Zap, Sliders, RotateCcw} from "lucide-react";
import StressType from "./components/StressType";
import type {StressTypeValue} from "./types/types";
import {SimulationNameField} from "./components/SimulationNameField";
import {PercentSliderField} from "./components/PercentSliderField";
import {DeltaField} from "./components/DeltaField";
import {RunSimulationButton} from "./components/RunSimulationButton";
import FileUpload from "@/components/sidebar/components/simulation/file-upload";
import {cn} from "@/lib/utils";
import {SimulationParametersBox} from "@/components/sidebar/components/history/SimulationParametersBox";
import {useSelectedSimulationParameters} from "@/components/sidebar/hooks/useSimulationParameters";

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
    currentRunId?: string | null;
    onRunIdChange?: (runId: string) => void;
};

type Step = "setup" | "parameters" | "advanced";

// Default values when no simulation is selected
const DEFAULT_VALUES = {
    stress: 50,
    walkCost: 30,
    delta: 60,
    stressType: "0" as StressTypeValue,
};

// Memoize the step section to prevent re-renders
const StepSection = memo(({
                              step,
                              label,
                              icon: Icon,
                              isExpanded,
                              isComplete,
                              onToggle,
                              children
                          }: {
    step: Step;
    label: string;
    icon: any;
    isExpanded: boolean;
    isComplete: boolean;
    onToggle: (step: Step) => void;
    children: React.ReactNode;
}) => {
    const handleToggle = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle(step);
    }, [step, onToggle]);

    return (
        <div className="border border-surface-3 rounded-lg overflow-hidden bg-surface-1">
            {/* Step Header - Always visible */}
            <button
                type="button"
                onClick={handleToggle}
                className={cn(
                    "flex items-center gap-2 p-3 w-full transition-all text-left",
                    isExpanded
                        ? "bg-accent-soft border-b border-accent/20"
                        : "hover:bg-surface-2"
                )}
            >
                <div className={cn(
                    "p-1.5 rounded-full shrink-0 transition-colors",
                    isComplete
                        ? "bg-success-soft text-success"
                        : isExpanded
                            ? "bg-accent-soft text-accent"
                            : "bg-surface-3 text-text-tertiary"
                )}>
                    {isComplete ? (
                        <CheckCircle className="h-3.5 w-3.5"/>
                    ) : (
                        <Icon className="h-3.5 w-3.5"/>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-text-primary truncate">{label}</div>
                    <div className="text-[10px] text-text-secondary">
                        {isComplete ? "Complete" : "Incomplete"}
                    </div>
                </div>

                <ChevronRight className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200",
                    isExpanded ? "rotate-90" : "text-text-tertiary"
                )}/>
            </button>

            {/* Step Content - Collapsible */}
            {isExpanded && (
                <div className="p-4 bg-surface-1/50">
                    {children}
                </div>
            )}
        </div>
    );
});

StepSection.displayName = 'StepSection';

export default function SimulationForm(props: SimulationFormProps) {
    const {t} = useLanguage();
    const [expandedStep, setExpandedStep] = useState<Step>("setup");
    const [prevRunId, setPrevRunId] = useState<string | null | undefined>(props.currentRunId);

    // This hook will now re-fetch when currentRunId changes
    const {parameters, loading: parametersLoading, error: parametersError} =
        useSelectedSimulationParameters(props.currentRunId ?? undefined);

    // Auto-reset when a new simulation is selected
    useEffect(() => {
        // Only reset if the run ID changed and it's not the initial load
        if (prevRunId !== props.currentRunId && props.currentRunId && parameters) {
            console.log("Run ID changed, resetting parameters:", props.currentRunId);
            handleReset();
        }
        setPrevRunId(props.currentRunId);
    }, [props.currentRunId, parameters]);

    // Reset to selected simulation parameters or defaults
    const handleReset = useCallback(() => {
        if (parameters) {
            // Reset to the selected simulation's parameters
            props.setStress(parameters.stress ?? DEFAULT_VALUES.stress);
            props.setWalkCost(parameters.walk_cost ?? DEFAULT_VALUES.walkCost);
            props.setDelta(parameters.delta ?? DEFAULT_VALUES.delta);

            // Fix: Properly handle stressType reset
            const paramStressType = parameters.stress_type as StressTypeValue;


            if (paramStressType && (paramStressType === "0" || paramStressType === "1"  || paramStressType === "2" || paramStressType === "3" )) {
                props.setStressType(paramStressType);
            } else {
                props.setStressType(DEFAULT_VALUES.stressType);
            }
        } else {
            // Reset to default values
            props.setStress(DEFAULT_VALUES.stress);
            props.setWalkCost(DEFAULT_VALUES.walkCost);
            props.setDelta(DEFAULT_VALUES.delta);
            props.setStressType(DEFAULT_VALUES.stressType);
        }
    }, [parameters, props]);

    const steps = [
        {id: "setup", label: "Setup", icon: Upload},
        {id: "parameters", label: "Parameters", icon: Zap},
        {id: "advanced", label: "Advanced", icon: Sliders},
    ];

    const isStepComplete = useCallback((step: Step) => {
        switch (step) {
            case "setup":
                return !!props.simName.trim() && !!props.folderPath;
            case "parameters":
                return true;
            case "advanced":
                return true;
            default:
                return false;
        }
    }, [props.simName, props.folderPath]);

    const toggleStep = useCallback((step: Step) => {
        setExpandedStep(prev => prev === step ? null : step);
    }, []);

    // Memoize handlers
    const handleContinueToParameters = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setExpandedStep("parameters");
    }, []);

    const handleContinueToAdvanced = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setExpandedStep("advanced");
    }, []);

    const handleBackToSetup = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setExpandedStep("setup");
    }, []);

    const handleBackToParameters = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setExpandedStep("parameters");
    }, []);

    return (
        <div className="space-y-3 p-3">
            {/* Header - Better layout with reset button not overlapping */}
            <div className="flex flex-col gap-2 pb-3 border-b border-surface-3">
                {/* Top row with title and reset */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div
                            className="p-1.5 rounded-md bg-gradient-to-br from-accent to-accent-hover shadow-xs shrink-0">
                            <Play className="h-3.5 w-3.5 text-white"/>
                        </div>
                        <h2 className="text-sm font-semibold text-text-primary">
                            {t("newSimulation")}
                        </h2>
                    </div>

                    {/* Reset Button - Properly positioned */}
                    <button
                        type="button"
                        onClick={handleReset}
                        className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all shrink-0",
                            "border border-surface-3 bg-surface-2 hover:bg-surface-3 text-text-secondary",
                            "focus:outline-none focus:ring-1 focus:ring-accent/30",
                            parameters ? "border-accent/20 bg-accent-soft/30" : ""
                        )}
                        title={parameters ? "Reset to selected simulation parameters" : "Reset to default values"}
                    >
                        <RotateCcw className="h-3.5 w-3.5"/>
                    </button>
                </div>

                {/* Show current selected run - Only when a run is selected */}
                {props.currentRunId && (
                    <div className="flex items-center gap-1.5 px-1">
                        <span className="text-[9px] text-text-tertiary">Current:</span>
                        <span className="text-[9px] font-medium text-accent truncate max-w-[180px]">
                            {props.currentRunId}
                        </span>
                        {parameters && (
                            <span className="text-[8px] text-text-tertiary ml-auto">
                                Parameters loaded
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Collapsible Steps */}
            <div className="space-y-2">
                {/* Setup Step */}
                <StepSection
                    step="setup"
                    label="Setup"
                    icon={Upload}
                    isExpanded={expandedStep === "setup"}
                    isComplete={isStepComplete("setup")}
                    onToggle={toggleStep}
                >
                    <div className="space-y-3">
                        <h3 className="text-xs font-semibold text-text-primary mb-2 tracking-wide uppercase">
                            Simulation Setup
                        </h3>
                        <div className="space-y-2">
                            <SimulationNameField
                                simName={props.simName}
                                setSimName={props.setSimName}
                                compact
                            />
                            <FileUpload
                                setFolderPath={props.setFolderPath}
                                folderPath={props.folderPath}
                                onFileUpload={props.onFileUpload}
                                uploadedFiles={props.uploadedFiles}
                                compact
                            />
                        </div>
                        {expandedStep === "setup" && (
                            <div className="flex justify-end pt-3 border-t border-surface-3/50 mt-3">
                                <button
                                    type="button"
                                    onClick={handleContinueToParameters}
                                    disabled={!props.simName.trim() || !props.folderPath}
                                    className={cn(
                                        "px-4 py-1.5 rounded-md text-xs font-medium transition-all",
                                        "flex items-center gap-1.5",
                                        props.simName.trim() && props.folderPath
                                            ? "bg-accent text-white hover:bg-accent-hover shadow-xs"
                                            : "bg-surface-3 text-text-tertiary cursor-not-allowed"
                                    )}
                                >
                                    Continue to Parameters
                                    <ChevronRight className="h-3.5 w-3.5"/>
                                </button>
                            </div>
                        )}
                    </div>
                </StepSection>

                {/* Parameters Step */}
                <StepSection
                    step="parameters"
                    label="Parameters"
                    icon={Zap}
                    isExpanded={expandedStep === "parameters"}
                    isComplete={isStepComplete("parameters")}
                    onToggle={toggleStep}
                >
                    <div className="space-y-3">
                        <h3 className="text-xs font-semibold text-text-primary mb-2 tracking-wide uppercase">
                            Stress Parameters
                        </h3>
                        <div className="space-y-3">
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
                        {expandedStep === "parameters" && (
                            <div className="flex gap-2 pt-3 border-t border-surface-3/50 mt-3">
                                <button
                                    type="button"
                                    onClick={handleBackToSetup}
                                    className="flex-1 py-1.5 px-3 rounded-md border border-surface-3 bg-surface-2 text-xs font-medium text-text-primary hover:bg-surface-3 transition-all flex items-center justify-center gap-1"
                                >
                                    <ChevronRight className="h-3.5 w-3.5 rotate-180"/>
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={handleContinueToAdvanced}
                                    className="flex-1 py-1.5 px-3 rounded-md bg-accent text-white text-xs font-medium hover:bg-accent-hover shadow-xs transition-all flex items-center justify-center gap-1"
                                >
                                    Continue
                                    <ChevronRight className="h-3.5 w-3.5"/>
                                </button>
                            </div>
                        )}
                    </div>
                </StepSection>

                {/* Advanced Step */}
                <StepSection
                    step="advanced"
                    label="Advanced"
                    icon={Sliders}
                    isExpanded={expandedStep === "advanced"}
                    isComplete={isStepComplete("advanced")}
                    onToggle={toggleStep}
                >
                    <div className="space-y-3">
                        <h3 className="text-xs font-semibold text-text-primary mb-2 tracking-wide uppercase">
                            Advanced Settings
                        </h3>
                        <div className="space-y-3">
                            <DeltaField delta={props.delta} setDelta={props.setDelta} compact/>
                            <StressType
                                stressType={props.stressType}
                                setStressType={props.setStressType}
                                compact
                            />
                        </div>
                        {expandedStep === "advanced" && (
                            <div className="flex gap-2 pt-3 border-t border-surface-3/50 mt-3">
                                <button
                                    type="button"
                                    onClick={handleBackToParameters}
                                    className="flex-1 py-1.5 px-3 rounded-md border border-surface-3 bg-surface-2 text-xs font-medium text-text-primary hover:bg-surface-3 transition-all flex items-center justify-center gap-1"
                                >
                                    <ChevronRight className="h-3.5 w-3.5 rotate-180"/>
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
                        )}
                    </div>
                </StepSection>
            </div>

            {/* Parameters Box */}
            <div className="mt-4 pt-3 border-t border-surface-3">
                <SimulationParametersBox
                    parameters={parameters}
                    loading={parametersLoading}
                    error={parametersError}
                    simulationName={props.currentRunId}
                />
            </div>

            {/* Status Indicator - Moved to bottom right */}
            <div className="flex justify-end">
                <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-2 border border-surface-3">
                    <div className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        expandedStep === "setup" && !isStepComplete("setup") ? "bg-warning" :
                            expandedStep === "parameters" ? "bg-accent" :
                                expandedStep === "advanced" ? "bg-success" : "bg-surface-3"
                    )}/>
                    <span className="text-[10px] font-medium text-text-secondary">
                        Step {["setup", "parameters", "advanced"].indexOf(expandedStep) + 1} of 3
                    </span>
                </div>
            </div>
        </div>
    );
}