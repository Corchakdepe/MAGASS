"use client";

import React from "react";
import { LineChart } from "@mui/x-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

type SeriesDatum = { id: string; label: string; values: number[] };

type PerformanceMetric = { station: string; capacity: number };

interface PerformanceTabProps {
  seriesData: SeriesDatum[];
  performanceMetrics: PerformanceMetric[];
}

export function PerformanceTab({ seriesData, performanceMetrics }: PerformanceTabProps) {
  const { t } = useLanguage();

  return (
    <>
      <Card className="bg-surface-1 border border-surface-3 shadow-mac-panel rounded-lg overflow-hidden">
        <CardHeader className="px-4 pt-4 pb-3">
          <CardTitle className="text-base font-semibold text-text-primary font-headline">
            {t("performanceTrends")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <LineChart
            height={300}
            xAxis={[
              {
                data: Array.from({ length: 24 }, (_, i) => i),
                scaleType: "band",
                label: t("hour"),
              },
            ]}
            series={seriesData.map((s) => ({
              id: s.id,
              label: s.label,
              data: s.values,
              area: true,
              stack: "total",
            }))}
          />
        </CardContent>
      </Card>

      <Card className="bg-surface-1 border border-surface-3 shadow-mac-panel rounded-lg overflow-hidden">
        <CardHeader className="px-4 pt-4 pb-3">
          <CardTitle className="text-base font-semibold text-text-primary font-headline">
            {t("capacityUtilization")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-3">
            {performanceMetrics.map((perf) => (
              <div key={perf.station}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-text-primary">{perf.station}</span>
                  <span className="text-xs text-text-secondary">{perf.capacity.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-surface-2 rounded-full h-2">
                  <div
                    className="bg-accent h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, perf.capacity)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
