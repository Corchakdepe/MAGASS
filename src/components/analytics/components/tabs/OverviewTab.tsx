"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

type SeriesStats = {
  stationId: string;
  min: number;
  max: number;
  mean: number;
  stdDev: number;
  coefficient_of_variation: number;
  peak_hour: number;
};

type RankedSeriesStats = SeriesStats & { total: number; rank: number };

interface OverviewTabProps {
  statistics: SeriesStats[];
  rankings: RankedSeriesStats[];
}

export function OverviewTab({ statistics, rankings }: OverviewTabProps) {
  const { t } = useLanguage();

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statistics.map((stat) => (
          <Card
            key={stat.stationId}
            className="bg-surface-1 border border-surface-3 shadow-mac-panel rounded-lg overflow-hidden"
          >
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-sm font-semibold text-text-primary font-headline">
                {stat.stationId}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-4 pb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">{t("mean")}</span>
                <span className="font-semibold text-text-primary">{stat.mean.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">{t("range")}</span>
                <span className="font-semibold text-text-primary">
                  {stat.min.toFixed(1)} - {stat.max.toFixed(1)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">{t("stdDev")}</span>
                <span className="font-semibold text-text-primary">{stat.stdDev.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">{t("peakHour")}</span>
                <Badge
                  variant="outline"
                  className="bg-accent-soft text-accent border-accent/20 font-medium"
                >
                  {String(stat.peak_hour).padStart(2, "0")}:00
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">{t("cv")}</span>
                <span
                  className={
                    stat.coefficient_of_variation > 30
                      ? "text-warning font-semibold"
                      : "font-semibold text-text-primary"
                  }
                >
                  {stat.coefficient_of_variation.toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-surface-1 border border-surface-3 shadow-mac-panel rounded-lg overflow-hidden">
        <CardHeader className="px-4 pt-4 pb-3">
          <CardTitle className="text-base font-semibold text-text-primary font-headline">
            {t("stationRankings")}
          </CardTitle>
        </CardHeader>

        <CardContent className="px-4 pb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-3">
                  <th className="text-left py-2 text-xs font-medium text-text-secondary">{t("rank")}</th>
                  <th className="text-left py-2 text-xs font-medium text-text-secondary">{t("station")}</th>
                  <th className="text-right py-2 text-xs font-medium text-text-secondary">{t("mean")}</th>
                  <th className="text-right py-2 text-xs font-medium text-text-secondary">{t("max")}</th>
                  <th className="text-right py-2 text-xs font-medium text-text-secondary">{t("total")}</th>
                  <th className="text-right py-2 text-xs font-medium text-text-secondary">{t("stability")}</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((rank) => (
                  <tr key={rank.stationId} className="border-b border-surface-3">
                    <td className="py-2">
                      <Badge
                        variant={rank.rank === 1 ? "default" : "outline"}
                        className={
                          rank.rank === 1
                            ? "bg-accent text-white border-accent"
                            : "border-surface-3 text-text-secondary"
                        }
                      >
                        #{rank.rank}
                      </Badge>
                    </td>
                    <td className="py-2 font-medium text-text-primary">{rank.stationId}</td>
                    <td className="py-2 text-right text-text-primary">{rank.mean.toFixed(2)}</td>
                    <td className="py-2 text-right text-text-primary">{rank.max.toFixed(2)}</td>
                    <td className="py-2 text-right text-text-primary">{rank.total.toFixed(0)}</td>
                    <td className="py-2 text-right">
                      <span
                        className={
                          rank.coefficient_of_variation < 20
                            ? "text-success font-medium"
                            : rank.coefficient_of_variation > 40
                              ? "text-warning font-medium"
                              : "text-text-primary"
                        }
                      >
                        {(100 - rank.coefficient_of_variation).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
