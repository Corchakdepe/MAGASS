// components/summary-panel.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  SimulationSummaryData,
  loadData,
  SimulationResumeData,
} from "@/types/simulation";
import React from "react";
import {
  MonitorCheck,
  PackageCheck,
  PackageMinus,
  PackageOpen,
  PackageX,
  Ruler,
  Timer,
  Route,
  Zap,
  Waypoints,
} from "lucide-react";

type SummaryPanelProps =
  | {
      kind: "initial";
      initialData: loadData;
      summaryData?: undefined;
      resumeData?: undefined;
    }
  | {
      kind: "simulation";
      initialData?: undefined;
      summaryData: SimulationSummaryData;
      resumeData?: undefined;
    }
  | {
      kind: "execution";
      initialData?: undefined;
      summaryData?: undefined;
      resumeData: SimulationResumeData;
    };

const formatNumber = (value: number | undefined): string => {
  if (value === undefined || value === null || Number.isNaN(value)) return "0.00";
  return value.toFixed(2);
};

const formatInt = (value: number | undefined): string => {
  if (value === undefined || value === null || Number.isNaN(value)) return "0";
  return Math.round(value).toString();
};

export default function SummaryPanel(props: SummaryPanelProps) {
  if (props.kind === "initial" && props.initialData) {
    const data = props.initialData;

    return (
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel p-4">
          <div className="space-y-1 mb-4">
            <h2 className="text-base font-semibold font-headline text-text-primary">
              Summary from initial loaded Data
            </h2>
            <p className="text-[11px] text-text-secondary">
              Basic dataset information.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-surface-3 bg-surface-0/60">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-text-primary">
                  Number of Bikes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">
                  {data.numBikes}
                </div>
              </CardContent>
            </Card>

            <Card className="border-surface-3 bg-surface-0/60">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-text-primary">
                  Number of Stations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">
                  {data.numStations}
                </div>
              </CardContent>
            </Card>

            <Card className="border-surface-3 bg-surface-0/60">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-text-primary">
                  City
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary truncate">
                  {data.city}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (props.kind === "simulation" && props.summaryData) {
    const data = props.summaryData;

    return (
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel p-4">
          <div className="space-y-1 mb-4">
            <h2 className="text-base font-semibold font-headline text-text-primary">
              Summary from Simulation Run
            </h2>
            <p className="text-[11px] text-text-secondary">
              Key metrics computed from the run.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-surface-3 bg-surface-0/60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-text-primary">
                  Delta Time
                </CardTitle>
                <Timer className="h-4 w-4 text-text-tertiary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">
                  {formatInt(data.deltaMinutes)} min
                </div>
              </CardContent>
            </Card>

            <Card className="border-surface-3 bg-surface-0/60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-text-primary">
                  Stress Level
                </CardTitle>
                <Zap className="h-4 w-4 text-text-tertiary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">
                  {formatNumber(data.stressPercentage)}%
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-5">
            <div className="mb-2 text-xs font-semibold text-text-primary">
              Distance Metrics
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-surface-3 bg-surface-0/60">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-text-primary">
                    Real Pick up Distance
                  </CardTitle>
                  <Ruler className="h-4 w-4 text-text-tertiary" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-text-primary">
                    {formatNumber(data.realPickupKms)} km
                  </div>
                </CardContent>
              </Card>

              <Card className="border-surface-3 bg-surface-0/60">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-text-primary">
                    Real Drop off Distance
                  </CardTitle>
                  <PackageMinus className="h-4 w-4 text-text-tertiary" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-text-primary">
                    {formatNumber(data.realDropoffKms)} km
                  </div>
                </CardContent>
              </Card>

              <Card className="border-surface-3 bg-surface-0/60">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-text-primary">
                    Fictional Pick up Distance
                  </CardTitle>
                  <Route className="h-4 w-4 text-text-tertiary" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-text-primary">
                    {formatNumber(data.fictionalPickupKms)} km
                  </div>
                </CardContent>
              </Card>

              <Card className="border-surface-3 bg-surface-0/60">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-text-primary">
                    Fictional Drop off Distance
                  </CardTitle>
                  <Waypoints className="h-4 w-4 text-text-tertiary" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-text-primary">
                    {formatNumber(data.fictionalDropoffKms)} km
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 text-xs font-semibold text-text-primary">
              Resolution Metrics
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-surface-3 bg-surface-0/60">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-text-primary">
                    Resolved Real Pick ups
                  </CardTitle>
                  <PackageCheck className="h-4 w-4 text-text-tertiary" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-text-primary">
                    {formatInt(data.resolvedRealPickups)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-surface-3 bg-surface-0/60">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-text-primary">
                    Resolved Real Drop offs
                  </CardTitle>
                  <PackageOpen className="h-4 w-4 text-text-tertiary" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-text-primary">
                    {formatInt(data.resolvedRealDropoffs)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-warning/25 bg-warning-soft">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-warning">
                    Unresolved Real Pick ups
                  </CardTitle>
                  <PackageCheck className="h-4 w-4 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-warning">
                    {formatInt(data.unresolvedRealPickups)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-warning/25 bg-warning-soft">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-warning">
                    Unresolved Real Drop offs
                  </CardTitle>
                  <PackageOpen className="h-4 w-4 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-warning">
                    {formatInt(data.unresolvedRealDropoffs)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-surface-3 bg-surface-0/60">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-text-primary">
                    Resolved Fictional Pick ups
                  </CardTitle>
                  <MonitorCheck className="h-4 w-4 text-text-tertiary" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-text-primary">
                    {formatInt(data.resolvedFictionalPickups)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-surface-3 bg-surface-0/60">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-text-primary">
                    Resolved Fictional Drop offs
                  </CardTitle>
                  <PackageX className="h-4 w-4 text-text-tertiary" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-text-primary">
                    {formatInt(data.resolvedFictionalDropoffs)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-warning/25 bg-warning-soft">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-warning">
                    Unresolved Fictional Pick ups
                  </CardTitle>
                  <MonitorCheck className="h-4 w-4 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-warning">
                    {formatInt(data.unresolvedFictionalPickups)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-warning/25 bg-warning-soft">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-warning">
                    Unresolved Fictional Drop offs
                  </CardTitle>
                  <PackageX className="h-4 w-4 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-warning">
                    {formatInt(data.unresolvedFictionalDropoffs)}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (props.kind === "execution" && props.resumeData) {
    const d = props.resumeData;

    return (
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel p-4">
          <div className="space-y-1 mb-4">
            <h2 className="text-base font-semibold font-headline text-text-primary">
              Simulation Summary
            </h2>
            <p className="text-[11px] text-text-secondary">
              Execution-level summary values.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-surface-3 bg-surface-0/60">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-text-primary">
                  Delta Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">
                  {formatInt(d.deltaMinutes)} min
                </div>
              </CardContent>
            </Card>

            <Card className="border-surface-3 bg-surface-0/60">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-text-primary">
                  Stress Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">
                  {formatNumber(d.stressPercentage)}%
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  return null;
}
