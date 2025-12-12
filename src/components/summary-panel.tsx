// components/summary-panel.tsx
'use client';

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import type {
    SimulationSummaryData,
    loadData,
    SimulationResumeData,
} from '@/types/simulation';
import React, {useState} from "react";
import {
    MonitorCheck,
    PackageCheck,
    PackageMinus,
    PackageOpen,
    PackageX, Ruler,
    Timer,
    Route,
    Zap, Waypoints,
} from "lucide-react";


type SummaryPanelProps =
    | {
    kind: 'initial';
    initialData: loadData;
    summaryData?: undefined;
    resumeData?: undefined;
}
    | {
    kind: 'simulation';
    initialData?: undefined;
    summaryData: SimulationSummaryData;
    resumeData?: undefined;
}
    | {
    kind: 'execution';
    initialData?: undefined;
    summaryData?: undefined;
    resumeData: SimulationResumeData;
};

const formatNumber = (value: number | undefined): string => {
    if (value === undefined || value === null || Number.isNaN(value)) return '0.00';
    return value.toFixed(2);
};

const formatInt = (value: number | undefined): string => {
    if (value === undefined || value === null || Number.isNaN(value)) return '0';
    return Math.round(value).toString();
};


export default function SummaryPanel(props: SummaryPanelProps) {
    if (props.kind === 'initial' && props.initialData) {
        const data = props.initialData;

        return (
            <div className="space-y-4">
                <h2 className="text-2xl font-bold font-headline">
                    Summary from initial loaded Data
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Number of Bikes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.numBikes}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Number of Stations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.numStations}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">City</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.city}</div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (props.kind === 'simulation' && props.summaryData) {
        const data = props.summaryData;

        return (
            <div className="space-y-4">
                <h2 className="text-2xl font-bold font-headline">
                    Summary from Simulation Run
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader>

                            <CardTitle className="text-sm font-medium"> Delta Time
                            </CardTitle>
                            <Timer className="h-4 w-4 text-muted-foreground"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatInt(data.deltaMinutes)} min
                            </div>

                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Stress Level</CardTitle>
                            <Zap className="h-4 w-4 text-muted-foreground"></Zap>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatNumber(data.stressPercentage)}%
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-3">Distance Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">
                                    Real Pick up Distance
                                </CardTitle>
                                <Ruler className="h-4 w-4 text-muted-foreground"/>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold">
                                    {formatNumber(data.realPickupKms)} km
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">
                                    Real Drop off Distance
                                </CardTitle>
                                <PackageMinus className="h-4 w-4 text-muted-foreground"/>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold">
                                    {formatNumber(data.realDropoffKms)} km
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">
                                    Fictional Pick up Distance
                                </CardTitle>
                                <Route className="h-4 w-4 text-muted-foreground"></Route>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold">
                                    {formatNumber(data.fictionalPickupKms)} km
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">
                                    Fictional Drop off Distance
                                </CardTitle>
                                <Waypoints className="h-4 w-4 text-muted-foreground"/>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold">
                                    {formatNumber(data.fictionalDropoffKms)} km
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-3">Resolution Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">
                                    Resolved Real Pick ups
                                </CardTitle>
                                <PackageCheck className="h-4 w-4 text-muted-foreground"/>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold">
                                    {formatInt(data.resolvedRealPickups)}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">
                                    Resolved Real Drop offs
                                </CardTitle>
                                <PackageOpen className="h-4 w-4 text-muted-foreground"/>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold">
                                    {formatInt(data.resolvedRealDropoffs)}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">
                                    Unresolved Real Pick ups
                                </CardTitle>
                                <PackageCheck className="h-4 w-4 text-orange-600 text-muted-foreground "/>

                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-orange-600">
                                    {formatInt(data.unresolvedRealPickups)}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">
                                    Unresolved Real Drop offs
                                </CardTitle>
                                <PackageOpen className="h-4 w-4 text-orange-600 text-muted-foreground"/>

                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-orange-600">
                                    {formatInt(data.unresolvedRealDropoffs)}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">
                                    Resolved Fictional Pick ups
                                </CardTitle>
                                <MonitorCheck className="h-4 w-4 text-muted-foreground"/>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold">
                                    {formatInt(data.resolvedFictionalPickups)}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">
                                    Resolved Fictional Drop offs
                                </CardTitle>
                                <PackageX className="h-4 w-4  text-muted-foreground"/>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold">
                                    {formatInt(data.resolvedFictionalDropoffs)}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">
                                    Unresolved Fictional Pick ups
                                </CardTitle>
                                <MonitorCheck className="h-4 w-4 text-orange-600 text-muted-foreground"/>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-orange-600">
                                    {formatInt(data.unresolvedFictionalPickups)}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">
                                    Unresolved Fictional Drop offs
                                </CardTitle>
                                <PackageX className="h-4 w-4 text-orange-600 text-muted-foreground"/>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-orange-600">
                                    {formatInt(data.unresolvedFictionalDropoffs)}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    if (props.kind === 'execution' && props.resumeData) {
        const d = props.resumeData;
        return (
            <div className="space-y-4">
                <h2 className="text-2xl font-bold font-headline">Simulation Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Delta Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatInt(d.deltaMinutes)} min
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Stress Level</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatNumber(d.stressPercentage)}%
                            </div>
                        </CardContent>
                    </Card>
                </div>
                {/* Puedes extender aquí más métricas específicas de SimulationResumeData */}
            </div>
        );
    }

    return null;
}
