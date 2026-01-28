import {useMemo} from "react";

export type SummaryData = {
  deltaMinutes: number;
  stressPercentage: number;
  realPickupKms: number;
  realDropoffKms: number;
  fictionalPickupKms: number;
  fictionalDropoffKms: number;
  resolvedRealPickups: number;
  resolvedRealDropoffs: number;
  unresolvedRealPickups: number;
  unresolvedRealDropoffs: number;
  resolvedFictionalPickups: number;
  resolvedFictionalDropoffs: number;
  unresolvedFictionalPickups: number;
  unresolvedFictionalDropoffs: number;
};

export type DashboardMetrics = {
  totalPickups: number;
  totalDropoffs: number;
  totalOperations: number;
  realPickupSuccessRate: number;
  realDropoffSuccessRate: number;
  totalDistance: number;
  realDistance: number;
  fictionalDistance: number;
  realVsFictionalRatio: string;
  avgDistancePerPickup: number;
  realDistancePercentage: number;
  fictionalDistancePercentage: number;
};

export function useDashboardMetrics(summaryData?: SummaryData | null): DashboardMetrics | null {
  return useMemo(() => {
    if (!summaryData) return null;

    const totalPickups =
      summaryData.resolvedRealPickups +
      summaryData.unresolvedRealPickups +
      summaryData.resolvedFictionalPickups +
      summaryData.unresolvedFictionalPickups;

    const totalDropoffs =
      summaryData.resolvedRealDropoffs +
      summaryData.unresolvedRealDropoffs +
      summaryData.resolvedFictionalDropoffs +
      summaryData.unresolvedFictionalDropoffs;

    const totalRealPickups = summaryData.resolvedRealPickups + summaryData.unresolvedRealPickups;
    const totalRealDropoffs = summaryData.resolvedRealDropoffs + summaryData.unresolvedRealDropoffs;

    const realPickupSuccessRate =
      totalRealPickups > 0
        ? (summaryData.resolvedRealPickups / totalRealPickups) * 100
        : 0;

    const realDropoffSuccessRate =
      totalRealDropoffs > 0
        ? (summaryData.resolvedRealDropoffs / totalRealDropoffs) * 100
        : 0;

    const totalDistance =
      summaryData.realPickupKms +
      summaryData.realDropoffKms +
      summaryData.fictionalPickupKms +
      summaryData.fictionalDropoffKms;

    const realDistance = summaryData.realPickupKms + summaryData.realDropoffKms;
    const fictionalDistance = summaryData.fictionalPickupKms + summaryData.fictionalDropoffKms;

    const realVsFictionalRatio =
      fictionalDistance > 0
        ? (realDistance / fictionalDistance).toFixed(2)
        : "∞";

    const avgDistancePerPickup =
      totalPickups > 0
        ? (summaryData.realPickupKms + summaryData.fictionalPickupKms) / totalPickups
        : 0;

    const realDistancePercentage = totalDistance > 0 ? (realDistance / totalDistance) * 100 : 0;
    const fictionalDistancePercentage = totalDistance > 0 ? (fictionalDistance / totalDistance) * 100 : 0;

    return {
      totalPickups,
      totalDropoffs,
      totalOperations: totalPickups + totalDropoffs,
      realPickupSuccessRate,
      realDropoffSuccessRate,
      totalDistance,
      realDistance,
      fictionalDistance,
      realVsFictionalRatio,
      avgDistancePerPickup,
      realDistancePercentage,
      fictionalDistancePercentage,
    };
  }, [summaryData]);
}
