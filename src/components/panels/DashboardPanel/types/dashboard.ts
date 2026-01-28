import {SummaryData} from "@/components/panels/DashboardPanel/hooks/useDashboardMetrics";

export interface DashboardMetric {
  label: string;
  value: string | number;
  change?: number;
  changeType?: "increase" | "decrease";
  icon?: React.ReactNode;
}

export interface DashboardPanelProps {
  runId: string;
  summaryData?: SummaryData | null;
  simulationContext?: any;
}
