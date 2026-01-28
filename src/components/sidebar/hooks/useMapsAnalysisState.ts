import {useState, useEffect} from "react";
import type {DateRange} from "react-day-picker";
import {usePersistentState} from "@/hooks/usePersistentState";
import type {MapKey, FilterKind, UnifiedFilterState, DeltaMode} from "@/types/analysis";
import type {MapsAnalysisState, MapsAnalysisActions, QuickGraphKey} from "../types/mapsAnalysis";
import {useDeltaCalculation} from "./useDeltaCalculation";

export function useMapsAnalysisState(
  runId?: string,
  externalStationsMaps?: Record<string, string>
): [MapsAnalysisState, MapsAnalysisActions, boolean] {

  const [entrada, setEntrada] = usePersistentState<string>("stats_entrada", "");
  const [salida, setSalida] = usePersistentState<string>("stats_salida", "");

  const [seleccionAgreg, setSeleccionAgreg] = usePersistentState<string>(
    "stats_seleccionAgreg",
    ""
  );

  const [selectedMaps, setSelectedMaps, selectedMapsHydrated] =
    usePersistentState<MapKey[]>("statsselectedMaps", []);

  const [instantesMaps, setInstantesMaps] = usePersistentState<Record<string, string>>(
    "stats_instantesMaps",
    {
      mapa_densidad: "",
      mapa_circulo: "",
      mapa_voronoi: "",
      mapa_desplazamientos_inst: "",
      mapa_desplazamientos_d_ori: "",
      mapa_desplazamientos_d_dst: "",
      mapa_desplazamientos_mov: "",
      mapa_desplazamientos_tipo: "",
    }
  );

  const [stationsMaps, setStationsMaps, stationsHydrated] =
    usePersistentState<Record<string, string>>("stationsMaps", {});

  const [labelsMaps, setLabelsMaps, labelsHydrated] =
    usePersistentState<Record<string, boolean>>("statslabelsMaps", {});

  const [mapUserName, setMapUserName] = usePersistentState<string>("stats_mapUserName", "");

  const [filterKind, setFilterKind] = usePersistentState<FilterKind>(
    "stats_filterKind",
    "EstValorDias"
  );

  const [filterState, setFilterState] = usePersistentState<UnifiedFilterState>(
    "stats_filterState",
    {
      operator: ">=",
      value: "65",
      dayPct: "0",
      days: "all",
      allowedFailDays: "5",
      stationsPct: "0",
      stationsList: "",
    }
  );

  const [useFilterForMaps, setUseFilterForMaps, filterHydrated] =
    usePersistentState<boolean>("statsuseFilterForMaps", false);

  const [advancedUser, setAdvancedUser] = usePersistentState<boolean>(
    "stats_advancedUser",
    false
  );

  const [deltaMode, setDeltaMode] = usePersistentState<DeltaMode>("stats_deltaMode", "media");

  const [deltaValueTxt, setDeltaValueTxt] = usePersistentState<string>("stats_deltaValueTxt", "");

  const [advancedEntrada, setAdvancedEntrada] = usePersistentState<string>(
    "stats_advancedEntrada",
    ""
  );

  const [advancedSalida, setAdvancedSalida] = usePersistentState<string>(
    "stats_advancedSalida",
    ""
  );

  const [circleStationsForGraphs, setCircleStationsForGraphs] =
    usePersistentState<string>("stats_circleStationsForGraphs", "");

  const [quickGraph, setQuickGraph] = useState<QuickGraphKey | null>(null);
  const [daysRange, setDaysRange] = useState<DateRange | undefined>();

  const {deltaInMin, deltaAutoSource, deltaLoading} = useDeltaCalculation(runId);

  // Sync circle stations with stationsMaps
  useEffect(() => {
    if (!stationsHydrated) return;
    const circleStations = stationsMaps["mapa_circulo"] ?? "";
    setCircleStationsForGraphs(circleStations);
  }, [stationsHydrated, stationsMaps, setCircleStationsForGraphs]);

  // Sync external stations
  useEffect(() => {
    if (!externalStationsMaps || !stationsHydrated) return;
    setStationsMaps((prev) => ({...prev, ...externalStationsMaps}));
  }, [externalStationsMaps, stationsHydrated, setStationsMaps]);

  const uiHydrated =
    selectedMapsHydrated &&
    stationsHydrated &&
    labelsHydrated &&
    filterHydrated;

  const state: MapsAnalysisState = {
    entrada,
    salida,
    seleccionAgreg,
    selectedMaps,
    instantesMaps,
    stationsMaps,
    labelsMaps,
    mapUserName,
    filterKind,
    filterState,
    useFilterForMaps,
    daysRange,
    advancedUser,
    deltaMode,
    deltaValueTxt,
    advancedEntrada,
    advancedSalida,
    circleStationsForGraphs,
    quickGraph,
    deltaInMin,
  };

  const actions: MapsAnalysisActions = {
    setEntrada,
    setSalida,
    setSeleccionAgreg,
    setSelectedMaps,
    setInstantesMaps,
    setStationsMaps,
    setLabelsMaps,
    setMapUserName,
    setFilterKind,
    setFilterState,
    setUseFilterForMaps,
    setDaysRange,
    setAdvancedUser,
    setDeltaMode,
    setDeltaValueTxt,
    setAdvancedEntrada,
    setAdvancedSalida,
    setCircleStationsForGraphs,
    setQuickGraph,
  };

  return [state, actions, uiHydrated];
}
