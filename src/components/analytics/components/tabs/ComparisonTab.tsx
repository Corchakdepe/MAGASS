"use client";

import React from "react";
import { LineChart } from "@mui/x-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type ComparisonMetrics = {
  station1: string;
  station2: string;
  correlation: number;
  mean_difference: number;
  max_divergence: number;
  max_divergence_hour: number;
};

type SeriesDatum = { id: string; label: string; values: number[] };

interface ComparisonTabProps {
  comparisons: ComparisonMetrics[];
  seriesData: SeriesDatum[];
}

export function ComparisonTab({ comparisons, seriesData }: ComparisonTabProps) {
  const { t } = useLanguage();

  if (comparisons.length === 0) {
    return (
      <Card className="bg-surface-1 border border-surface-3 shadow-mac-panel rounded-lg overflow-hidden">
        <CardContent className="py-8 text-center text-text-secondary">
          {t("needTwoStations")}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-surface-1 border border-surface-3 shadow-mac-panel rounded-lg overflow-hidden">
        <CardHeader className="px-4 pt-4 pb-3">
          <CardTitle className="text-base font-semibold text-text-primary font-headline">
            {t("pairwiseCorrelations")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-3">
            {comparisons.map((comp, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-surface-0 border border-surface-3"
              >
                <div>
                  <div className="text-sm font-medium text-text-primary">
                    {comp.station1} ↔ {comp.station2}
                  </div>
                  <div className="text-xs text-text-secondary mt-1">
                    {t("meanDiff")}: {comp.mean_difference.toFixed(2)} · {t("maxDivergence")}{" "}
                    {comp.max_divergence_hour}:00
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={Math.abs(comp.correlation) > 0.7 ? "default" : "outline"}
                    className={
                      Math.abs(comp.correlation) > 0.7
                        ? "bg-accent text-white border-accent"
                        : "border-surface-3 text-text-secondary"
                    }
                  >
                    r = {comp.correlation.toFixed(3)}
                  </Badge>

                  {comp.correlation > 0.7 ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : comp.correlation < -0.7 ? (
                    <TrendingDown className="h-4 w-4 text-danger" />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-surface-1 border border-surface-3 shadow-mac-panel rounded-lg overflow-hidden">
        <CardHeader className="px-4 pt-4 pb-3">
          <CardTitle className="text-base font-semibold text-text-primary font-headline">
            {t("hourByHourDifferences")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {seriesData.length >= 2 && (
            <LineChart
              height={300}
              xAxis={[
                {
                  data: Array.from({ length: 24 }, (_, i) => i),
                  scaleType: "band",
                  label: t("hour"),
                },
              ]}
              series={[
                {
                  id: "difference",
                  label: `${comparisons[0].station1} - ${comparisons[0].station2}`,
                  data: seriesData[0].values.map((v, i) => v - seriesData[1].values[i]),
                  area: true,
                  color: "rgba(0,122,255,0.6)",
                },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}
