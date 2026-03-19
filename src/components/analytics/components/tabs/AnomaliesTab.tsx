"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type AnomalyDetection = {
  stationId: string;
  anomalies: Array<{ hour: number; value: number; z_score: number; type: "high" | "low" }>;
};

interface AnomaliesTabProps {
  anomalies: AnomalyDetection[];
}

export function AnomaliesTab({ anomalies }: AnomaliesTabProps) {
  const { t } = useLanguage();

  return (
    <>
      {anomalies.map((anom) => (
        <Card
          key={anom.stationId}
          className="bg-surface-1 border border-surface-3 shadow-mac-panel rounded-lg overflow-hidden"
        >
          <CardHeader className="px-4 pt-4 pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold font-headline">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-text-primary">
                {anom.stationId} - {anom.anomalies.length} {t("anomaliesDetected")}
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent className="px-4 pb-4">
            {anom.anomalies.length > 0 ? (
              <div className="space-y-2">
                {anom.anomalies.map((a, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      a.type === "high"
                        ? "bg-warning-soft border-warning/20"
                        : "bg-accent-soft border-accent/20"
                    }`}
                  >
                    <div className="text-sm">
                      <span className="font-medium text-text-primary">
                        {t("hour")} {String(a.hour).padStart(2, "0")}:00
                      </span>
                      <span className="text-text-secondary ml-2">
                        {t("value")}: {a.value.toFixed(2)}
                      </span>
                    </div>

                    <Badge
                      variant={a.type === "high" ? "destructive" : "secondary"}
                      className={
                        a.type === "high"
                          ? "bg-danger text-white border-danger"
                          : "bg-accent text-white border-accent"
                      }
                    >
                      Z-score: {a.z_score.toFixed(2)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-text-secondary">{t("noAnomalies")}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </>
  );
}
