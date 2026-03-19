import {SummaryMetrics} from "@/components/panels/SummaryPanels/hooks/useSummaryMetrics";
import {LucideIcon} from "lucide-react";

export interface SummaryMetrics {
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
}

export interface SummaryPanelProps {
    summary: SummaryMetrics,
    loading?: boolean,
    runId?: string
}

export interface SimulationInfoPanelProps {
  cityName: string;
  stationCount: number;
  totalCapacity: number;
  bikeCount?: number;
  className?: string;
  // Optional additional data from the new API
  averageCapacity?: number;
  capacityRange?: string;
  country?: string;
}

export interface InfoCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle?: string;
  className?: string;
}
