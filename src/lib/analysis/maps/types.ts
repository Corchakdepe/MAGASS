import {RawResultItem} from "@/components/main-content";

export type VisualizationMapsProps = {
    runId: string;
    apiBase: string;
    maps: RawResultItem[];
    onStationPick?: (p: { mapName?: string; station: number; data?: number | null }) => void;
};

//for maps only
export type PersistedState = {
    selectedMapId?: string;
    favoritesIds: string[];
    historyOpen?: boolean;
    searchText: string;
    onlyFavorites: boolean;
    kindFilter: string; // "" = all
    formatFilter: string; // "" = all
};