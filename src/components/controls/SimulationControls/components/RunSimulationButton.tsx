"use client";

import React from "react";
import {Button} from "@/components/ui/button";
import {Play, Loader2} from "lucide-react";
import {useLanguage} from "@/contexts/LanguageContext";

// RunSimulationButton.tsx - Updated with compact version
import {cn} from "@/lib/utils";

type Props = {
    disabled: boolean;
    isLoading: boolean;
    onRunSimulation: () => void;
};


interface RunSimulationButtonProps {
    onRunSimulation: () => void;
    isLoading: boolean;
    disabled: boolean;
    className?: string;
    compact?: boolean;
}

export function RunSimulationButton({
                                        onRunSimulation,
                                        isLoading,
                                        disabled,
                                        className,
                                        compact = false
                                    }: RunSimulationButtonProps) {
    return (
        <button
            onClick={onRunSimulation}
            disabled={disabled || isLoading}
            className={cn(
                "flex items-center justify-center gap-1.5 rounded-md font-medium",
                "transition-all focus:outline-none focus:ring-2 focus:ring-accent/20",
                disabled
                    ? "bg-surface-3 text-text-tertiary cursor-not-allowed"
                    : "bg-accent text-white hover:bg-accent-hover shadow-xs",
                compact ? "py-1.5 px-3 text-xs" : "py-2 px-4 text-sm",
                className
            )}
        >
            {isLoading ? (
                <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"/>
                    <span>Running...</span>
                </>
            ) : (
                <>
                    <Play className={compact ? "h-3 w-3" : "h-3.5 w-3.5"}/>
                    <span>Run Simulation</span>
                </>
            )}
        </button>
    );
}