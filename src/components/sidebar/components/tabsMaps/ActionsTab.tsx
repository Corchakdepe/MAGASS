import * as React from "react";
import {CardContent} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {useLanguage} from "@/contexts/LanguageContext";
import {parseStationsSimple} from "@/lib/analysis/parsers";
import type {MapsAnalysisState, MapsAnalysisActions, QuickGraphKey, ALLOWED_GRAPH_MATRIX_IDS} from "../../types/mapsAnalysis";

interface ActionsTabProps {
  state: MapsAnalysisState;
  actions: MapsAnalysisActions;
  apiBusy: boolean;
  apiError: string | null;
  onAnalyze: () => void;
  onCreateQuickGraph: (key: QuickGraphKey) => void;
  deltaLoading: boolean;
  deltaAutoSource: "runId" | "api" | "manual";
  quickGraphBusy: boolean;
  quickGraphError: string | null;
}

export function ActionsTab({
  state,
  actions,
  apiBusy,
  apiError,
  onAnalyze,
  onCreateQuickGraph,
  deltaLoading,
  deltaAutoSource,
  quickGraphBusy,
  quickGraphError,
}: ActionsTabProps) {
  const {t} = useLanguage();

  const QUICK_GRAPHS: {label: string; key: QuickGraphKey}[] = [
    {label: t('barsPerStationAverage'), key: "graf_barras_est_med"},
    {label: t('barsPerStationCumulative'), key: "graf_barras_est_acum"},
    {label: t('linesCompareStations'), key: "graf_linea_comp_est"},
  ];

  const selectedMatrixId = Number(state.seleccionAgreg || "-1");
  const ALLOWED_IDS = [-1, 0, 1, 9, 10, 11, 12, 13];
  const matrixAllowedForGraph = ALLOWED_IDS.includes(selectedMatrixId);

  return (
    <CardContent className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-text-primary">{t('actions')}</div>
          <div className="text-[11px] text-text-secondary">
            {t('runAnalysisAndCreateQuickGraphs')}
          </div>
        </div>

        {deltaLoading ? (
          <div className="text-[11px] text-text-tertiary">{t('deltaLoading')}</div>
        ) : (
          <div className="text-[11px] text-text-tertiary">
            {t('deltaSource')}: <span className="text-text-primary">{deltaAutoSource}</span>
          </div>
        )}
      </div>

      <Button
        onClick={onAnalyze}
        disabled={apiBusy || state.selectedMaps.length === 0}
        className="w-full bg-accent text-text-inverted hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0"
      >
        {apiBusy ? t('analyzing') : t('analyzeMaps')}
      </Button>

      {apiError && <span className="text-xs text-danger">{apiError}</span>}

      {/* Quick Graphs Section */}
      <div className="rounded-lg border border-surface-3 bg-surface-0/60 p-3 space-y-3">
        <Label className="text-[11px] text-text-secondary">{t('createQuickGraph')}</Label>

        <div className="space-y-1">
          <Label className="text-[11px] text-text-secondary">{t('graphType')}</Label>

          <select
            className={[
              "h-9 w-full rounded-md px-2 text-xs",
              "bg-surface-1 border border-surface-3",
              "text-text-primary",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30",
            ].join(" ")}
            value={state.quickGraph ?? ""}
            onChange={(e) => actions.setQuickGraph((e.target.value as QuickGraphKey) || null)}
            disabled={quickGraphBusy || state.selectedMaps[0] !== "mapa_circulo" || !matrixAllowedForGraph}
          >
            <option value="" disabled>
              {t('graphTypePlaceholder')}
            </option>
            {QUICK_GRAPHS.map((g) => (
              <option key={g.key} value={g.key}>
                {g.label}
              </option>
            ))}
          </select>

          <div className="text-[10px] text-text-tertiary">
            {t('requiresCircleMapAndAllowedMatrix')}
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-[11px] text-text-secondary">
            {t('stationsForGraphs')}
          </Label>
          <Input
            className="h-9 text-xs w-full bg-surface-1 border border-surface-3 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
            placeholder={t('stationsForGraphsPlaceholder')}
            value={state.circleStationsForGraphs}
            onChange={(e) => actions.setCircleStationsForGraphs(e.target.value)}
            disabled={quickGraphBusy || state.selectedMaps[0] !== "mapa_circulo"}
          />
        </div>

        <Button
          onClick={() => {
            if (!state.quickGraph) return;
            onCreateQuickGraph(state.quickGraph);
          }}
          disabled={
            quickGraphBusy ||
            state.selectedMaps[0] !== "mapa_circulo" ||
            !matrixAllowedForGraph ||
            !state.quickGraph ||
            parseStationsSimple(state.circleStationsForGraphs).length === 0
          }
          className="w-full"
          variant="outline"
        >
          {quickGraphBusy ? t('creating') : t('create')}
        </Button>

        {quickGraphError && <span className="text-xs text-danger">{quickGraphError}</span>}
      </div>
    </CardContent>
  );
}
