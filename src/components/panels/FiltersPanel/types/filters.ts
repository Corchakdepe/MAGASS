import type {GraphItem} from "@/components/types/artifacts";

export interface FiltersPanelProps {
  runId: string;
  filters?: GraphItem[];
  onRefresh?: () => void;
}
