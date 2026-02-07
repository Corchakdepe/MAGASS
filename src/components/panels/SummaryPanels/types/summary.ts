import {SummaryMetrics} from "@/components/panels/SummaryPanels/hooks/useSummaryMetrics";

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
