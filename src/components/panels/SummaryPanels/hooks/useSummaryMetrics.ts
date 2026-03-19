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

export type SummaryMetrics = {
  // Totals
  totalPickups: number;
  totalDropoffs: number;
  totalRealOperations: number;
  totalFictionalOperations: number;
  totalDistance: number;

  // Success rates
  realPickupSuccessRate: number;
  realDropoffSuccessRate: number;
  fictionalPickupSuccessRate: number;
  fictionalDropoffSuccessRate: number;
  overallSuccessRate: number;

  // Distance metrics
  realDistance: number;
  fictionalDistance: number;
  avgDistancePerOperation: number;
  realDistancePercentage: number;
  fictionalDistancePercentage: number;

  // Efficiency insights
  efficiencyScore: number; // 0-100 based on success rate and distance ratio
  rebalancingIntensity: number; // fictional vs real ratio
  operationalBalance: number; // pickup vs dropoff balance

  // Chart data
  operationsBreakdown: Array<{label: string; value: number; color: string}>;
  successRateComparison: Array<{category: string; resolved: number; unresolved: number}>;
  distanceDistribution: Array<{category: string; distance: number}>;
  heatmapData: Array<{operation: string; status: string; value: number}>;
};

export function useSummaryMetrics(summary?: SummaryData | null): SummaryMetrics | null {
  return useMemo(() => {
    if (!summary) return null;

    // Calculate totals
    const totalPickups = summary.resolvedRealPickups + summary.unresolvedRealPickups +
                        summary.resolvedFictionalPickups + summary.unresolvedFictionalPickups;
    const totalDropoffs = summary.resolvedRealDropoffs + summary.unresolvedRealDropoffs +
                         summary.resolvedFictionalDropoffs + summary.unresolvedFictionalDropoffs;
    const totalRealOperations = summary.resolvedRealPickups + summary.unresolvedRealPickups +
                               summary.resolvedRealDropoffs + summary.unresolvedRealDropoffs;
    const totalFictionalOperations = summary.resolvedFictionalPickups + summary.unresolvedFictionalPickups +
                                    summary.resolvedFictionalDropoffs + summary.unresolvedFictionalDropoffs;

    // Calculate success rates
    const totalRealPickups = summary.resolvedRealPickups + summary.unresolvedRealPickups;
    const totalRealDropoffs = summary.resolvedRealDropoffs + summary.unresolvedRealDropoffs;
    const totalFictionalPickups = summary.resolvedFictionalPickups + summary.unresolvedFictionalPickups;
    const totalFictionalDropoffs = summary.resolvedFictionalDropoffs + summary.unresolvedFictionalDropoffs;

    const realPickupSuccessRate = totalRealPickups > 0
      ? (summary.resolvedRealPickups / totalRealPickups) * 100 : 0;
    const realDropoffSuccessRate = totalRealDropoffs > 0
      ? (summary.resolvedRealDropoffs / totalRealDropoffs) * 100 : 0;
    const fictionalPickupSuccessRate = totalFictionalPickups > 0
      ? (summary.resolvedFictionalPickups / totalFictionalPickups) * 100 : 0;
    const fictionalDropoffSuccessRate = totalFictionalDropoffs > 0
      ? (summary.resolvedFictionalDropoffs / totalFictionalDropoffs) * 100 : 0;

    const totalResolved = summary.resolvedRealPickups + summary.resolvedRealDropoffs +
                         summary.resolvedFictionalPickups + summary.resolvedFictionalDropoffs;
    const totalOperations = totalPickups + totalDropoffs;
    const overallSuccessRate = totalOperations > 0 ? (totalResolved / totalOperations) * 100 : 0;

    // Distance calculations
    const totalDistance = summary.realPickupKms + summary.realDropoffKms +
                         summary.fictionalPickupKms + summary.fictionalDropoffKms;
    const realDistance = summary.realPickupKms + summary.realDropoffKms;
    const fictionalDistance = summary.fictionalPickupKms + summary.fictionalDropoffKms;
    const avgDistancePerOperation = totalOperations > 0 ? totalDistance / totalOperations : 0;
    const realDistancePercentage = totalDistance > 0 ? (realDistance / totalDistance) * 100 : 0;
    const fictionalDistancePercentage = totalDistance > 0 ? (fictionalDistance / totalDistance) * 100 : 0;

    // Efficiency insights
    const rebalancingIntensity = totalRealOperations > 0
      ? (totalFictionalOperations / totalRealOperations) * 100 : 0;
    const operationalBalance = totalPickups > 0
      ? Math.abs((totalPickups - totalDropoffs) / totalPickups) * 100 : 0;

    // Efficiency score: weighted average of success rate (70%) and distance efficiency (30%)
    const distanceEfficiency = fictionalDistance > 0 ? (realDistance / fictionalDistance) * 100 : 100;
    const efficiencyScore = (overallSuccessRate * 0.7) + (Math.min(distanceEfficiency, 100) * 0.3);

    // Chart data: Operations breakdown
    const operationsBreakdown = [
      {label: 'Resolved Real', value: summary.resolvedRealPickups + summary.resolvedRealDropoffs, color: '#10b981'},
      {label: 'Unresolved Real', value: summary.unresolvedRealPickups + summary.unresolvedRealDropoffs, color: '#ef4444'},
      {label: 'Resolved Fictional', value: summary.resolvedFictionalPickups + summary.resolvedFictionalDropoffs, color: '#8b5cf6'},
      {label: 'Unresolved Fictional', value: summary.unresolvedFictionalPickups + summary.unresolvedFictionalDropoffs, color: '#f59e0b'},
    ];

    // Success rate comparison
    const successRateComparison = [
      {
        category: 'Real Pickups',
        resolved: summary.resolvedRealPickups,
        unresolved: summary.unresolvedRealPickups,
      },
      {
        category: 'Real Dropoffs',
        resolved: summary.resolvedRealDropoffs,
        unresolved: summary.unresolvedRealDropoffs,
      },
      {
        category: 'Fictional Pickups',
        resolved: summary.resolvedFictionalPickups,
        unresolved: summary.unresolvedFictionalPickups,
      },
      {
        category: 'Fictional Dropoffs',
        resolved: summary.resolvedFictionalDropoffs,
        unresolved: summary.unresolvedFictionalDropoffs,
      },
    ];

    // Distance distribution
    const distanceDistribution = [
      {category: 'Real Pickups', distance: summary.realPickupKms},
      {category: 'Real Dropoffs', distance: summary.realDropoffKms},
      {category: 'Fictional Pickups', distance: summary.fictionalPickupKms},
      {category: 'Fictional Dropoffs', distance: summary.fictionalDropoffKms},
    ];

    // Heatmap data for operations matrix
    const heatmapData = [
      {operation: 'Real Pickups', status: 'Resolved', value: summary.resolvedRealPickups},
      {operation: 'Real Pickups', status: 'Unresolved', value: summary.unresolvedRealPickups},
      {operation: 'Real Dropoffs', status: 'Resolved', value: summary.resolvedRealDropoffs},
      {operation: 'Real Dropoffs', status: 'Unresolved', value: summary.unresolvedRealDropoffs},
      {operation: 'Fictional Pickups', status: 'Resolved', value: summary.resolvedFictionalPickups},
      {operation: 'Fictional Pickups', status: 'Unresolved', value: summary.unresolvedFictionalPickups},
      {operation: 'Fictional Dropoffs', status: 'Resolved', value: summary.resolvedFictionalDropoffs},
      {operation: 'Fictional Dropoffs', status: 'Unresolved', value: summary.unresolvedFictionalDropoffs},
    ];

    return {
      totalPickups,
      totalDropoffs,
      totalRealOperations,
      totalFictionalOperations,
      totalDistance,
      realPickupSuccessRate,
      realDropoffSuccessRate,
      fictionalPickupSuccessRate,
      fictionalDropoffSuccessRate,
      overallSuccessRate,
      realDistance,
      fictionalDistance,
      avgDistancePerOperation,
      realDistancePercentage,
      fictionalDistancePercentage,
      efficiencyScore,
      rebalancingIntensity,
      operationalBalance,
      operationsBreakdown,
      successRateComparison,
      distanceDistribution,
      heatmapData,
    };
  }, [summary]);
}
