// src/components/visualizations/GraphConfiguration.tsx

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CalendarDays,
  MapPin,
  Sigma,
  BarChart3,
  LineChart,
  Layers,
  GitFork,
  Hash,
  Filter,
  Database
} from "lucide-react";
import { MATRICES } from "@/lib/analysis/constants";
import type { BackendChart } from "../types";

interface GraphConfigurationProps {
  chart: BackendChart;
}

// Helper function to get matrix label from ID
const getMatrixLabel = (matrixType: string | number): string => {
  if (!matrixType || matrixType === "Unknown") return "Unknown";

  // Try to parse as number if it's a string number
  const matrixId = typeof matrixType === 'string' ? parseInt(matrixType, 10) : matrixType;

  // Find matching matrix in MATRICES constant
  const matrix = MATRICES.find(m => m.id === matrixId);

  if (matrix) {
    return matrix.label;
  }

  // If it's a custom matrix name, return as is
  return String(matrixType);
};

export function GraphConfiguration({ chart }: GraphConfigurationProps) {
  if (!chart || !chart.context) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <p className="text-muted-foreground text-sm">No configuration data available</p>
        </CardContent>
      </Card>
    );
  }

  const { context, kind } = chart;
  const rawMatrixType = context.matrix_type || "Unknown";
  const matrixType = getMatrixLabel(rawMatrixType);

  // Format days for display
  const formatDays = (days: number[] | string | undefined): string => {
    if (!days) return "Not specified";
    if (typeof days === 'string') return days;
    if (Array.isArray(days)) {
      if (days.length === 0) return "No days";
      if (days.length > 5) return `${days.length} days (${days[0]}-${days[days.length-1]})`;
      return days.join(", ");
    }
    return String(days);
  };

  // Format stations for display
  const formatStations = (stations: number[] | undefined): string => {
    if (!stations) return "Not specified";
    if (stations.length === 0) return "No stations";
    if (stations.length > 5) return `${stations.length} stations (${stations.slice(0, 3).join(", ")}...)`;
    return stations.join(", ");
  };

  // Configuration item component
  const ConfigItem = ({
    icon: Icon,
    label,
    value,
    badge = false
  }: {
    icon: React.ElementType;
    label: string;
    value: React.ReactNode;
    badge?: boolean;
  }) => (
    <div className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
      <div className="mt-0.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {badge ? (
          <Badge variant="secondary" className="mt-1 font-mono text-xs">
            {value}
          </Badge>
        ) : (
          <p className="text-sm font-medium truncate">{value}</p>
        )}
      </div>
    </div>
  );

  // Render configuration based on chart kind
  const renderConfiguration = () => {
    switch (kind) {
      case "timeseries":
      case "accumulation":
        return (
          <>
            <ConfigItem
              icon={Database}
              label="Matrix Type"
              value={matrixType}
              badge
            />
            <ConfigItem
              icon={MapPin}
              label="Stations"
              value={formatStations(context.stations)}
            />
            <ConfigItem
              icon={CalendarDays}
              label="Days"
              value={formatDays(context.days)}
            />
            <ConfigItem
              icon={Sigma}
              label="Aggregation"
              value={context.aggregation || "mean"}
              badge
            />
          </>
        );

      case "distribution":
        return (
          <>
            <ConfigItem
              icon={Database}
              label="Matrix Type"
              value={matrixType}
              badge
            />
            <ConfigItem
              icon={CalendarDays}
              label="Days"
              value={formatDays(context.days)}
            />
            <ConfigItem
              icon={BarChart3}
              label="Value Type"
              value={context.value_type || "mean"}
              badge
            />
            <ConfigItem
              icon={Hash}
              label="Distribution Type"
              value="Frequency Histogram"
              badge
            />
          </>
        );

      case "station_series":
        return (
          <>
            <ConfigItem
              icon={Database}
              label="Matrix Type"
              value={matrixType}
              badge
            />
            <ConfigItem
              icon={CalendarDays}
              label="Days"
              value={formatDays(context.days)}
            />
            <ConfigItem
              icon={Sigma}
              label="Value Type"
              value={context.value_type || "mean"}
              badge
            />
            <ConfigItem
              icon={MapPin}
              label="All Stations"
              value="All stations (aggregated)"
            />
          </>
        );

      case "comparison":
        // Check if it's a matrix comparison or station comparison
        if (context.delta !== undefined) {
          // Matrix comparison
          return (
            <>
              <ConfigItem
                icon={Database}
                label="Matrix Type"
                value={matrixType}
                badge
              />
              <ConfigItem
                icon={GitFork}
                label="Comparison Type"
                value="Matrix Comparison"
                badge
              />
              <ConfigItem
                icon={Layers}
                label="Delta"
                value={String(context.delta)}
                badge
              />
              <ConfigItem
                icon={MapPin}
                label="Stations Group 1"
                value={formatStations(context.stations1)}
              />
              <ConfigItem
                icon={MapPin}
                label="Stations Group 2"
                value={formatStations(context.stations2)}
              />
              <ConfigItem
                icon={Sigma}
                label="Aggregation"
                value={context.is_mean ? "mean" : "sum"}
                badge
              />
            </>
          );
        } else {
          // Station comparison
          const stations = chart.data?.series?.map((s: any) =>
            s.metadata?.station_id
          ).filter(Boolean) || [];

          return (
            <>
              <ConfigItem
                icon={Database}
                label="Matrix Type"
                value={matrixType}
                badge
              />
              <ConfigItem
                icon={GitFork}
                label="Comparison Type"
                value="Station Comparison"
                badge
              />
              <ConfigItem
                icon={MapPin}
                label="Compared Stations"
                value={stations.length > 0 ? stations.join(", ") : "Multiple stations"}
              />
              <ConfigItem
                icon={Sigma}
                label="Aggregation"
                value="mean (per station)"
                badge
              />
            </>
          );
        }

      default:
        // Generic display for unknown chart types
        return (
          <>
            <ConfigItem
              icon={Database}
              label="Matrix Type"
              value={matrixType}
              badge
            />
            {context.stations && (
              <ConfigItem
                icon={MapPin}
                label="Stations"
                value={formatStations(context.stations)}
              />
            )}
            {context.days && (
              <ConfigItem
                icon={CalendarDays}
                label="Days"
                value={formatDays(context.days)}
              />
            )}
            {context.aggregation && (
              <ConfigItem
                icon={Sigma}
                label="Aggregation"
                value={context.aggregation}
                badge
              />
            )}
          </>
        );
    }
  };

  // Get chart type display name
  const getChartTypeDisplay = () => {
    switch (kind) {
      case "timeseries":
        return "Bar Chart (Station Mean)";
      case "accumulation":
        return "Bar Chart (Station Cumulative)";
      case "distribution":
        return "Histogram (Day Distribution)";
      case "station_series":
        return "Station Series Chart";
      case "comparison":
        return context.delta !== undefined ? "Matrix Comparison" : "Station Comparison";
      default:
        return kind || "Unknown Chart Type";
    }
  };

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>Configuration Steps</span>
          <Badge variant="outline" className="font-mono text-xs">
            {getChartTypeDisplay()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[300px]">
          <div className="px-4 pb-4">
            {renderConfiguration()}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}