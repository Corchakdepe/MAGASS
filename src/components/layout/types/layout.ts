import type {SimulationData} from "@/types/simulation";
import type {MainContentMode} from "@/types/view-mode";

export type AppLayoutProps = {
  children?: React.ReactNode
};

export type StationPickPayload = {
  mapName?: string;
  station: number;
  data?: number | null
};

export type PanelMode = "none" | "maps" | "graphs" | "statisticsAnalyzer" | "dirComparison";

