"use client";

import React from "react";
import { BarChart } from "@mui/x-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type VolatilityMetrics = {
  stationId: string;
  max_increase: number;
  max_increase_hour: number;
  max_decrease: number;
  max_decrease_hour: number;
  avg_volatility: number;
};

type VolatilityChartSeries = { id: string; label: string; data: number[] };

interface VolatilityTabProps {
  volatility: VolatilityMetrics[];
  volatilityChartData: VolatilityChartSeries[];
}

export function VolatilityTab({ volatility, volatilityChartData }: VolatilityTabProps) {
  const { t } = useLanguage();

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {volatility.map((vol) => (
          <Card
            key={vol.stationId}
            className="bg-surface-1 border border-surface-3 shadow-mac-panel rounded-lg overflow-hidden"
          >
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-sm font-semibold text-text-primary font-headline">
                {vol.stationId}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-4 pb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">{t("maxIncrease")}</span>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 text-success" />
                  <span className="font-semibold text-success">
                    +{vol.max_increase.toFixed(2)} {t("at")} {vol.max_increase_hour}:00
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">{t("maxDecrease")}</span>
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-3 w-3 text-danger" />
                  <span className="font-semibold text-danger">
                    {vol.max_decrease.toFixed(2)} {t("at")} {vol.max_decrease_hour}:00
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">{t("avgVolatility")}</span>
                <span className="font-semibold text-text-primary">
                  {vol.avg_volatility.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-surface-1 border border-surface-3 shadow-mac-panel rounded-lg overflow-hidden">
        <CardHeader className="px-4 pt-4 pb-3">
          <CardTitle className="text-base font-semibold text-text-primary font-headline">
            {t("hourOverHourChanges")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <BarChart
            height={300}
            xAxis={[
              {
                data: Array.from({ length: 23 }, (_, i) => i + 1),
                scaleType: "band",
                label: t("hourTransition"),
              },
            ]}
            series={volatilityChartData}
          />
        </CardContent>
      </Card>
    </>
  );
}
