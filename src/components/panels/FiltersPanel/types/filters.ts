import type {GraphItem} from "@/components/types/artifacts";

export type FilterItem = GraphItem;

export interface FiltersPanelProps {
  runId: string;
  filters?: FilterItem[];
  onRefresh?: () => void;
  onDelete?: (id: string) => void;
}
