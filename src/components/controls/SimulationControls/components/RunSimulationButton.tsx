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
                "flex items-center justify-center gap-1 rounded-md font-medium whitespace-nowrap",
                "transition-all focus:outline-none focus:ring-2 focus:ring-accent/20",
                disabled
                    ? "bg-surface-3 text-text-tertiary cursor-not-allowed"
                    : "bg-accent text-white hover:bg-accent-hover shadow-xs",
                compact ? "py-1 px-2 text-xs" : "py-2 px-4 text-sm",
                className
            )}
        >
            {isLoading ? (
                <>
                    <div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-white border-t-transparent"/>
                    <span className="text-xs">Run</span>
                </>
            ) : (
                <>
                    <Play className="h-2.5 w-2.5"/>
                    <span className="text-xs">Run</span>
                </>
            )}
        </button>
    );
}