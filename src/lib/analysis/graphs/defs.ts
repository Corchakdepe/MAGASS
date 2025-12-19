import type { GraficaDef } from "./types";

export const GRAFICAS: GraficaDef[] = [
  { label: "Barras por estación (media)", key: "graf_barras_est_med" },
  { label: "Barras por estación (acumulado)", key: "graf_barras_est_acum" },
  { label: "Histograma días (M/A + Frec)", key: "graf_barras_dia" },
  { label: "Líneas comparar estaciones", key: "graf_linea_comp_est" },
  { label: "Líneas comparar matrices", key: "graf_linea_comp_mats" },
];
