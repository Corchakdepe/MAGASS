"use client";

import * as React from "react";
import {Switch} from "@/components/ui/switch";
import {Label} from "@/components/ui/label";
import {useLanguage} from "@/contexts/LanguageContext";
import {Filter} from "lucide-react";

interface FilterToggleProps {
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
}

export function FilterToggle({enabled, onToggle}: FilterToggleProps) {
    const {t} = useLanguage();

    return (
        <div className="flex flex-col w-full gap-2">
            {/* Label and icon row */}
            <div className="flex items-center gap-2">
                <Filter className={cn(
                    "h-4 w-4 transition-colors shrink-0",
                    enabled ? "text-accent" : "text-text-tertiary"
                )}/>
                <Label
                    htmlFor="filter-toggle"
                    className="text-xs font-medium text-text-primary cursor-pointer select-none"
                >
                    {t('enableFiltering')}
                </Label>
            </div>

            {/* Switch below */}
            <div className="flex items-center justify-between w-full px-1">
                <span className="text-[10px] text-text-tertiary">
                    {enabled ? t('filterActive') : t('filterInactive')}
                </span>
                <Switch
                    id="filter-toggle"
                    checked={enabled}
                    onCheckedChange={onToggle}
                    className={cn(
                        "data-[state=checked]:bg-accent",
                        "data-[state=unchecked]:bg-surface-3"
                    )}
                />
            </div>
        </div>
    );
}

function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}