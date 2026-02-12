// components/SimulationParametersBox.tsx

'use client';

import React from 'react';
import {useLanguage} from '@/contexts/LanguageContext';
import {Brain, Footprints, Clock, Calendar, Zap} from 'lucide-react';
import type {SimulationParameters} from '../../types/sidebar';

interface Props {
    parameters: SimulationParameters | null;
    loading?: boolean;
    error?: string | null;
    simulationName?: string;
}

export function SimulationParametersBox({
                                            parameters,
                                            loading,
                                            error,
                                            simulationName
                                        }: Props) {
    const {t} = useLanguage();

    if (loading) {
        return (
            <div className="mt-4 p-4 bg-surface-2/50 rounded-lg border border-surface-3">
                <p className="text-sm text-text-secondary">{t("loadingParameters")}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-4 p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                <p className="text-sm text-red-500">{t("error")}: {error}</p>
            </div>
        );
    }

    if (!parameters) {
        return (
            <div className="mt-4 p-4 bg-surface-2/30 rounded-lg border border-surface-3 border-dashed">
                <p className="text-sm text-text-secondary text-center">
                    {t("noSimulationSelected")}
                </p>
            </div>
        );
    }


    const stressValue = parameters.stress ?? 0;
    const walkCostValue = parameters.walk_cost ?? 0;
    const deltaValue = parameters.delta ?? 0;
    const stressTypeValue = parameters.stress_type ?? 0;
    const diasValue = parameters.dias ?? [];

    const getStressTypeName = (type: number) => {
        const types = ['No Stress', 'Light', 'Moderate', 'High'];
        return types[type] || `Type ${type}`;
    };

    return (
        <div className="mt-4 p-4 bg-surface-2/30 rounded-lg border border-surface-3">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-surface-3">
                <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary"/>
                    <h4 className="text-sm font-semibold">{t("simulationParameters")}</h4>
                </div>

            </div>

            <div className="grid grid-cols-2 gap-3">
                {/* Stress Type */}


                <div>
                    <Zap className="h-4 w-4 text-amber-500 mt-0.5"/>
                    <p className="text-xs text-text-secondary">{t("stressType")}</p>
                    <p className="text-sm font-medium">{getStressTypeName(stressTypeValue)}</p>
                </div>


                {/* Stress Level */}


                <div>
                    <Brain className="h-4 w-4 text-purple-500 mt-0.5"/>
                    <p className="text-xs text-text-secondary">{t("systemStress")}</p>
                    <p className="text-sm font-medium">{stressValue.toFixed(1)}%</p>
                </div>


                {/* Walk Cost */}


                <div>
                    <Footprints className="h-4 w-4 text-green-500 mt-0.5"/>
                    <p className="text-xs text-text-secondary">{t("walkCost")}</p>
                    <p className="text-sm font-medium">{walkCostValue.toFixed(1)}%</p>
                </div>

                {/* Delta Time */}

                <div>
                    <Clock className="h-4 w-4 text-blue-500 mt-0.5"/>
                    <p className="text-xs text-text-secondary">{t("delta")}</p>
                    <p className="text-sm font-medium">{deltaValue} {t("min")}</p>
                </div>

                {/* Days */}

                <div>
                     <Calendar className="h-4 w-4 text-indigo-500 mt-0.5"/>
                    <p className="text-xs text-text-secondary">{t("days")}</p>
                    <p className="text-sm">
                        {diasValue.length > 0
                            ? diasValue.map(d => `Day ${d + 1}`).join(', ')
                            : 'All days'
                        }
                    </p>
                </div>
            </div>
        </div>
    );
}