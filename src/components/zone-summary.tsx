'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Bike, Clock, AlertTriangle } from 'lucide-react';
import type { ZoneSummaryData } from '@/components/app-layout';

const StatCard = ({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

export default function ZoneSummary({ data }: { data?: ZoneSummaryData }): JSX.Element {
  // fallback values if data is missing
  const safeData: ZoneSummaryData = data ?? {
    totalZones: 0,
    activeBikes: 0,
    avgTripDuration: 0,
    issuesDetected: 0,
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 font-headline">Zone Summary</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Zones" value={safeData.totalZones} icon={MapPin} />
        <StatCard title="Active Bikes" value={safeData.activeBikes} icon={Bike} />
        <StatCard title="Avg. Trip Duration" value={`${safeData.avgTripDuration} min`} icon={Clock} />
        <StatCard title="Issues Detected" value={safeData.issuesDetected} icon={AlertTriangle} />
      </div>
    </div>
  );
}
