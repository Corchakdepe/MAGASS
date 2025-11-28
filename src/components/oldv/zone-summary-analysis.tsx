'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bike, MapPin, Clock, AlertCircle } from 'lucide-react';
import type { SimulationSummaryData } from '@/types/simulation';

type ZoneSummaryProps = {
  data: SimulationSummaryData;
};

export default function ZoneSummary({ data }: ZoneSummaryProps) {
  // Safe helper function to format numbers
  const formatNumber = (value: number | undefined): string => {
    if (value === undefined || value === null || isNaN(value)) return '0.00';
    return value.toFixed(2);
  };

  const formatInt = (value: number | undefined): string => {
    if (value === undefined || value === null || isNaN(value)) return '0';
    return Math.round(value).toString();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold font-headline">Summary from Matrix Simulation Run</h2>

      {/* Simulation Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Delta Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatInt(data.deltaMinutes)} min</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Stress Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.stressPercentage)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Distance Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Distance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Real Pickup Distance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatNumber(data.realPickupKms)} km</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Real Dropoff Distance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatNumber(data.realDropoffKms)} km</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Fictional Pickup Distance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatNumber(data.fictionalPickupKms)} km</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Fictional Dropoff Distance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatNumber(data.fictionalDropoffKms)} km</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Resolution Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Resolution Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Resolved Real Pickups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatInt(data.resolvedRealPickups)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Resolved Real Dropoffs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatInt(data.resolvedRealDropoffs)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Unresolved Real Pickups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-orange-600">{formatInt(data.unresolvedRealPickups)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Unresolved Real Dropoffs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-orange-600">{formatInt(data.unresolvedRealDropoffs)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Resolved Fictional Pickups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatInt(data.resolvedFictionalPickups)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Resolved Fictional Dropoffs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatInt(data.resolvedFictionalDropoffs)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Unresolved Fictional Pickups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-orange-600">{formatInt(data.unresolvedFictionalPickups)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Unresolved Fictional Dropoffs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-orange-600">{formatInt(data.unresolvedFictionalDropoffs)}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
