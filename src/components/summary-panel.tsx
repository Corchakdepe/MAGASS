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
import {useLanguage} from "@/contexts/LanguageContext";

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
  const {t} = useLanguage();

  if (props.kind === "initial" && props.initialData) {
    const data = props.initialData;

    return (
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel p-4">
          <div className="space-y-1 mb-4">
            <h2 className="text-base font-semibold font-headline text-text-primary">
              {t('summaryFromInitialLoadedData')}
            </h2>
            <p className="text-[11px] text-text-secondary">
              {t('basicDatasetInformation')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-surface-3 bg-surface-0/60">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-text-primary">
                  {t('numberOfBikes')}
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
                  {t('numberOfStations')}
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
                  {t('city')}
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
              {t('summaryFromSimulationRun')}
            </h2>
            <p className="text-[11px] text-text-secondary">
              {t('keyMetricsComputedFromRun')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-surface-3 bg-surface-0/60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-text-primary">
                  {t('deltaTime')}
                </CardTitle>
                <Timer className="h-4 w-4 text-text-tertiary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">
                  {formatInt(data.deltaMinutes)} {t('min')}
                </div>
              </CardContent>
            </Card>

            <Card className="border-surface-3 bg-surface-0/60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-text-primary">
                  {t('stressLevel')}
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
              {t('distanceMetrics')}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-surface-3 bg-surface-0/60">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-text-primary">
                    {t('realPickupDistance')}
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
                    {t('realDropoffDistance')}
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
                    {t('fictionalPickupDistance')}
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
                    {t('fictionalDropoffDistance')}
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
              {t('resolutionMetrics')}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-surface-3 bg-surface-0/60">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-text-primary">
                    {t('resolvedRealPickups')}
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
                    {t('resolvedRealDropoffs')}
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
                    {t('unresolvedRealPickups')}
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
                    {t('unresolvedRealDropoffs')}
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
                    {t('resolvedFictionalPickups')}
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
                    {t('resolvedFictionalDropoffs')}
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
                    {t('unresolvedFictionalPickups')}
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
                    {t('unresolvedFictionalDropoffs')}
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
              {t('simulationSummary')}
            </h2>
            <p className="text-[11px] text-text-secondary">
              {t('executionLevelSummaryValues')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-surface-3 bg-surface-0/60">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-text-primary">
                  {t('deltaTime')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">
                  {formatInt(d.deltaMinutes)} {t('min')}
                </div>
              </CardContent>
            </Card>

            <Card className="border-surface-3 bg-surface-0/60">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-text-primary">
                  {t('stressLevel')}
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
