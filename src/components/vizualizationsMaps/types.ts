// src/components/visualizations/maps/types.ts

export interface RawResultItem {
  id: string | number;
  name?: string;
  kind?: string;
  format?: string;
  url?: string;
  api_full_url?: string;
  created?: string;
}

export interface PersistedState {
  selectedMapId?: string;
  favoritesIds: string[];
  historyOpen: boolean;
  searchText: string;
  onlyFavorites: boolean;
  kindFilter: string;
  formatFilter: string;
}

export interface StationPickEvent {
  mapName: string;
  station: number;
  data: any;
}

export interface VisualizationMapsProps {
  runId: string;
  apiBase: string;
  maps?: RawResultItem[];
  onStationPick?: (event: StationPickEvent) => void;
}

export interface MapMessage {
  type: string;
  command?: string;
  mapName?: string;
  station?: number;
  data?: any;
}
