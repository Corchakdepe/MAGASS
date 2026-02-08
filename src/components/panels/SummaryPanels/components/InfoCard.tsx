"use client";

import * as React from "react";
import { MapPin, Building2, Bike, Battery, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SimulationInfoPanelProps, InfoCardProps } from "../types/summary"


function InfoCard({ icon: Icon, title, value, subtitle, className }: InfoCardProps) {
  return (
    <div className={cn(
      "flex flex-col p-5 rounded-lg border border-surface-3 bg-surface-1",
      "transition-all duration-200 hover:shadow-mac-panel hover:border-accent/20",
      "min-w-[200px] flex-1",
      className
    )}>
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2.5 rounded-full bg-accent-soft">
          <Icon className="h-5 w-5 text-accent" />
        </div>
        <span className="text-sm font-medium text-text-secondary tracking-wide uppercase">
          {title}
        </span>
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-bold text-text-primary leading-tight">
          {value}
        </div>
        {subtitle && (
          <div className="text-xs text-text-tertiary">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}



export function SimulationInfoPanel({
  cityName,
  stationCount,
  totalCapacity,
  bikeCount,
  className,
  averageCapacity,
  capacityRange,
  country
}: SimulationInfoPanelProps) {
  // Calculate average capacity per station if not provided
  const avgCapacity = averageCapacity || (stationCount > 0 ? Math.round(totalCapacity / stationCount) : 0);

  // Calculate utilization percentage
  const utilizationPercentage = bikeCount && totalCapacity > 0
    ? Math.round((bikeCount / totalCapacity) * 100)
    : 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with description */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-6 rounded-full bg-accent" />
          <h3 className="text-lg font-semibold text-text-primary tracking-tight">
            Simulation Overview
          </h3>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">
          Key infrastructure metrics for your urban mobility simulation
        </p>
      </div>

      {/* Main cards grid */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* City Card - Most prominent */}
        <div className={cn(
          "flex flex-col p-6 rounded-xl border-2 border-accent/20 bg-gradient-to-br from-surface-1 to-surface-0",
          "shadow-mac-panel transition-all duration-300 hover:shadow-lg",
          "sm:flex-2 min-w-[250px] order-first"
        )}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-accent shadow-sm">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xs font-medium text-text-secondary tracking-wider uppercase">
                City
              </span>
              <div className="text-2xl font-bold text-text-primary mt-1">
                {cityName}
              </div>
              {country && (
                <div className="text-sm text-text-secondary mt-1">
                  {country}
                </div>
              )}
            </div>
          </div>
          <div className="mt-auto pt-4 border-t border-surface-3">
            <div className="text-xs text-text-tertiary">
              Simulation environment • {stationCount} locations
            </div>
          </div>
        </div>

        {/* Secondary cards in a row */}
        <div className="flex flex-1 flex-col sm:flex-row gap-4">
          <InfoCard
            icon={Building2}
            title="Stations"
            value={stationCount.toLocaleString()}
            subtitle={`${avgCapacity.toFixed(0)} avg. capacity`}
            className="hover:border-success/20 hover:bg-success/5"
          />

          <InfoCard
            icon={Bike}
            title="Total Capacity"
            value={totalCapacity.toLocaleString()}
            subtitle={capacityRange ? `Range: ${capacityRange}` : "Maximum bikes across all stations"}
            className="hover:border-accent/20 hover:bg-accent/5"
          />

          {bikeCount !== undefined && (
            <InfoCard
              icon={Battery}
              title="Active Bikes"
              value={bikeCount.toLocaleString()}
              subtitle={`${utilizationPercentage}% utilization`}
              className="hover:border-warning/20 hover:bg-warning/5"
            />
          )}

          {/* Optional: Show average capacity if we have more data */}
          {averageCapacity !== undefined && (
            <InfoCard
              icon={BarChart3}
              title="Avg. per Station"
              value={averageCapacity.toFixed(1)}
              subtitle="Average capacity"
              className="hover:border-surface-3"
            />
          )}
        </div>
      </div>

      {/* Stats bar - subtle but informative */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 rounded-lg bg-surface-2/50 border border-surface-3">
        <div className="text-xs text-text-secondary">
          <span className="font-medium text-text-primary">Infrastructure summary: </span>
          {stationCount > 0 && totalCapacity > 0 ?
            `${totalCapacity.toLocaleString()} total capacity across ${stationCount} stations` :
            'No data available'}
        </div>
      </div>
    </div>
  );
}