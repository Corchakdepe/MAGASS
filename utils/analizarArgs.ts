// utils/analizarArgs.ts
export type AnalizarForm = {
  entrada: string;
  salida: string;
  seleccionAgregacion: string;          // e.g. "-1" or "1;2;3" or "(-)4;5"
  deltaMedia?: string | null;            // e.g. "4"
  deltaAcumulada?: string | null;        // e.g. "4"
  grafBarrasEstMed?: string | null;      // "123-all" or "123-1;2;3"
  grafBarrasEstAcum?: string | null;     // as above, requires 60-min delta
  grafBarrasDia?: string | null;         // "1;2;3-A" or "all-M-Frec"
  grafLineaCompEst?: string | null;      // "10;11-1;2#all"
  grafLineaCompMats?: string | null;     // "60-10;11-100;101-M"
  mapaDensidad?: string | null;          // "0;1;2+10;11"
  videoDensidad?: string | null;         // "0:96+10;11"
  mapaVoronoi?: string | null;           // "0;1;2"
  mapaCirculo?: string | null;           // "0;1;2+10;11-L"
  mapaDesplazamientos?: string | null;   // "t,deltaActual,deltaDeseado,1|-1,1|0"
  filtradoEstValor?: string | null;      // ">=;5;3;12"
  filtradoEstValorDias?: string | null;  // ">=;5;3;1;2#3#4;1"
  filtradoHoras?: string | null;         // ">=;5;80"
  filtradoPorcentajeEstaciones?: string | null; // ">=-5-10;11;12"
  // Optional helpers that feed above strings:
  stationId?: number | null;             // used to compose some commands
  days?: string | null;                  // "all" or "1"/"2"... (string)
  delta?: number;                        // current delta if needed
};

export function buildAnalizarQuery(f: AnalizarForm, nullChar = "_") {
  // Ensure strings; default to nullChar when absent
  const nz = (v?: string | null) => (v && v.length ? v : nullChar);

  // Already composed strings must be passed verbatim. If you want to assist users,
  // build them here from simpler fields. Example for barras estación medio:
  const barrasMed = f.grafBarrasEstMed
    ?? (f.stationId != null && f.days ? `${String(f.stationId)}-${f.days}` : null);

  return {
    inputFolder: f.entrada,
    outputFolder: f.salida,
    seleccion_agregacion: f.seleccionAgregacion ?? "-1",
    deltaMedia: f.deltaMedia ?? nullChar,
    deltaAcumulada: f.deltaAcumulada ?? nullChar,
    graf_barras_est_med: nz(barrasMed),
    graf_barras_est_acum: nz(f.grafBarrasEstAcum),
    graf_barras_dia: nz(f.grafBarrasDia),
    graf_linea_comp_est: nz(f.grafLineaCompEst),
    graf_linea_comp_mats: nz(f.grafLineaCompMats),
    mapa_densidad: nz(f.mapaDensidad),
    video_densidad: nz(f.videoDensidad),
    mapa_voronoi: nz(f.mapaVoronoi),
    mapa_circulo: nz(f.mapaCirculo),
    mapa_desplazamientos: nz(f.mapaDesplazamientos),
    filtrado_EstValor: nz(f.filtradoEstValor),
    filtrado_EstValorDias: nz(f.filtradoEstValorDias),
    filtrado_Horas: nz(f.filtradoHoras),
    filtrado_PorcentajeEstaciones: nz(f.filtradoPorcentajeEstaciones),
  };
}
