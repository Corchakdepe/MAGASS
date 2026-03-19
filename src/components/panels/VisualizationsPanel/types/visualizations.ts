import type {MainContentMode} from "@/types/view-mode";
import type {GraphItem, MapItem} from "@/components/types/artifacts";

export interface VisualizationsPanelProps {
  mode: MainContentMode;
  apiBase: string;
  runId: string;
  simulationData: any;
  graphs: GraphItem[];
  maps: MapItem[];
  chartsFromApi?: any[];
  onStationPick?: (p: {
    mapName?: string;
    station: number;
    data?: number | null;
  }) => void;
}
