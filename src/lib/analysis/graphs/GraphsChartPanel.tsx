// components/graphs/GraphsChartPanel.tsx
"use client";

import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BarChart, LineChart, axisClasses } from "@mui/x-charts";
import {
  makeHistogramYScale,
  makeTimeSeriesYScale,
  prettyGraphLabel,
  roundNumber,
  usePalette,
  YScaleCfg,
} from "@/lib/analysis/graphs/hooks";

type BackendChartMeta = {
  type?: "bar" | "line" | string;
  title?: string;
  xLabel?: string;
  yLabel?: string;
  freq?: boolean;
  created_at?: string;
  instante?: number;
  matrixId?: number | string;
  matrix?: number | string;
  [k: string]: any;
};

type GraphsChartPanelProps = {
  active: any | null;
  contentObj: any | null;
  meta: BackendChartMeta;
  selectedIndex: number;
  filteredCount: number;
  totalCount: number;
  titlesById: Record<string, string>;
  favoritesSet: Set<string>;
  onToggleFavorite: (id: string) => void;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  downloadHref?: string | null;
  chartTypeOverride: "auto" | "line" | "bar" | "histogram";
};

export const GraphsChartPanel: React.FC<GraphsChartPanelProps> = ({
  active,
  contentObj,
  meta,
  selectedIndex,
  filteredCount,
  totalCount,
  titlesById,
  favoritesSet,
  onToggleFavorite,
  onPrev,
  onNext,
  canPrev,
  canNext,
  downloadHref,
  chartTypeOverride,
}) => {
  const palette = usePalette();
  const activeId = active ? String(active.id) : "";
  const isFav = favoritesSet.has(activeId);

  // infer from meta
  const inferred: "bar" | "line" =
    meta?.type === "line" ? "line" : "bar";

  let chartKind: "bar" | "line" | "histogram" = inferred;
  if (chartTypeOverride !== "auto") {
    chartKind =
      chartTypeOverride === "histogram"
        ? "histogram"
        : chartTypeOverride;
  }

  const isHistogram =
    chartKind === "histogram" || meta?.freq === true;

  const titleLabel = (meta?.title as string | undefined) ?? "";
  const xLabel = meta?.xLabel || "X";
  const yLabel = meta?.yLabel || "Y";
  const chartTitle = titleLabel;

  const createdAt =
    (active as any)?.created ?? (meta?.created_at as string | undefined);
  const kindStr = String((active as any)?.kind ?? "");
  const formatStr = String((active as any)?.format ?? "json");
  const matrixId =
    meta?.matrixId ?? meta?.matrix ?? (contentObj as any)?.matrix;
  const instante = meta?.instante;

  const displayName =
    titlesById[activeId] ??
    (active as any)?.meta?.title ??
    (active ? prettyGraphLabel(active) : "");

  const muiData = useMemo(() => {
    if (!contentObj || !contentObj.x || !contentObj.series) return null;
    const xRaw: (number | string)[] = contentObj.x;
    const labels = xRaw.map((x) =>
      typeof x === "number" ? roundNumber(x) : x,
    );
    const keys = Object.keys(contentObj.series as Record<string, number[]>);
    if (keys.length === 0) return null;

    const rows = labels.map((x, idx) => {
      const row: any = { x, index: idx };
      keys.forEach((k) => {
        const arr = (contentObj.series as Record<string, number[]>)[k] ?? [];
        row[k] = arr[idx] ?? null;
      });
      return row;
    });

    return { keys, rows };
  }, [contentObj]);

  const yValues = useMemo(() => {
    if (!muiData) return [] as number[];
    const vals: number[] = [];
    muiData.rows.forEach((row) => {
      muiData.keys.forEach((k) => {
        const v = row[k];
        if (typeof v === "number" && !Number.isNaN(v)) vals.push(v);
      });
    });
    return vals;
  }, [muiData]);

  const yScaleCfg: YScaleCfg = useMemo(
    () =>
      isHistogram
        ? makeHistogramYScale(yValues)
        : makeTimeSeriesYScale(yValues),
    [isHistogram, yValues],
  );

  const axisLabelColor = "hsl(var(--foreground))";
  const gridColor = "hsl(var(--border))";
  const tickColor = "hsl(var(--muted-foreground))";

  return (
    <div className="flex min-h-[380px] flex-col rounded-md border bg-background p-3">
      {!active && (
        <div className="flex h-[340px] items-center justify-center text-sm text-muted-foreground">
          Select a graph in history (H) or use â€œChoose graphâ€.
        </div>
      )}

      {active && (
        <>
          <div className="flex items-center justify-between gap-2 text-xs border-b pb-2">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {displayName || "Sin tÃ­tulo"}
                </span>
                {isFav && (
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                    Favorite
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                <span>ID {activeId || "â€”"}</span>
                <span>Â·</span>
                <span>Format: {formatStr}</span>
                <span>Â·</span>
                <span>Kind: {kindStr}</span>
                {matrixId != null && (
                  <>
                    <span>Â·</span>
                    <span>Matrix: {String(matrixId)}</span>
                  </>
                )}
                {instante != null && (
                  <>
                    <span>Â·</span>
                    <span>Instante: {String(instante)}</span>
                  </>
                )}
                {createdAt && (
                  <>
                    <span>Â·</span>
                    <span>Date: {String(createdAt)}</span>
                  </>
                )}
                <span>Â·</span>
                <span>
                  {selectedIndex + 1} / {filteredCount} (filtered) Â·{" "}
                  {totalCount} total
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onToggleFavorite(activeId)}
                className="inline-flex h-7 w-20 items-center justify-center rounded border text-[10px]"
                title="Toggle favorite (F)"
              >
                {isFav ? "â˜… Starred" : "â˜† Star"}
              </button>
              <button
                type="button"
                onClick={onPrev}
                disabled={!canPrev}
                className="inline-flex h-7 w-20 items-center justify-center rounded border text-[10px] disabled:opacity-50"
                title="Previous (â†)"
              >
                <ChevronLeft className="h-3 w-3 mr-1" />
                Prev
              </button>
              <button
                type="button"
                onClick={onNext}
                disabled={!canNext}
                className="inline-flex h-7 w-20 items-center justify-center rounded border text-[10px] disabled:opacity-50"
                title="Next (â†’)"
              >
                Next
                <ChevronRight className="h-3 w-3 ml-1" />
              </button>
              {downloadHref && (
                <a
                  href={downloadHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-7 items-center justify-center rounded border px-2 text-[10px]"
                >
                  Download
                </a>
              )}
            </div>
          </div>

          <div className="mt-3">
            {!muiData && (
              <div className="flex h-[340px] items-center justify-center text-xs text-muted-foreground">
                No valid data (x / series) found in this graph.
              </div>
            )}

            {muiData && (
              <div className="h-[340px] w-full overflow-x-auto">
                {chartKind === "histogram" ? (
                  <BarChart
                    height={340}
                    width={undefined}
                    dataset={muiData.rows}
                    xAxis={[
                      {
                        dataKey: "x",
                        scaleType: "band",
                        label: xLabel,
                      },
                    ]}
                    series={[
                      {
                        dataKey: muiData.keys[0],
                        label: muiData.keys[0],
                        color: palette[0],
                      },
                    ]}
                    yAxis={[
                      {
                        label: yLabel,
                        min: yScaleCfg.min,
                        max: yScaleCfg.max,
                        tickInterval: (value) =>
                          typeof value === "number"
                            ? value % yScaleCfg.step === 0
                            : false,
                      },
                    ]}
                    slotProps={{
                      legend: {
                        direction: "row",
                        position: {
                          vertical: "top",
                          horizontal: "end",
                        },
                      },
                    }}
                    sx={{
                      [`& .${axisClasses.left} .${axisClasses.label}`]: {
                        fill: axisLabelColor,
                      },
                      [`& .${axisClasses.bottom} .${axisClasses.label}`]: {
                        fill: axisLabelColor,
                      },
                      [`& .${axisClasses.bottom} .${axisClasses.tick}`]: {
                        stroke: tickColor,
                        fill: tickColor,
                      },
                      [`& .${axisClasses.left} .${axisClasses.tick}`]: {
                        stroke: tickColor,
                        fill: tickColor,
                      },
                      "& .MuiChartsGrid-line": {
                        stroke: gridColor,
                      },
                    }}
                    margin={{
                      left: 60,
                      right: 20,
                      top: chartTitle ? 30 : 20,
                      bottom: 50,
                    }}
                  />
                ) : chartKind === "bar" ? (
                  <BarChart
                    height={340}
                    width={undefined}
                    dataset={muiData.rows}
                    xAxis={[
                      {
                        dataKey: "x",
                        scaleType: "band",
                        label: xLabel,
                      },
                    ]}
                    series={muiData.keys.map((k, idx) => ({
                      dataKey: k,
                      label: k,
                      color: palette[idx % palette.length],
                    }))}
                    yAxis={[
                      {
                        label: yLabel,
                        min: yScaleCfg.min,
                        max: yScaleCfg.max,
                        tickInterval: (value) =>
                          typeof value === "number"
                            ? value % yScaleCfg.step === 0
                            : false,
                      },
                    ]}
                    slotProps={{
                      legend: {
                        direction: "row",
                        position: {
                          vertical: "top",
                          horizontal: "end",
                        },
                      },
                    }}
                    sx={{
                      [`& .${axisClasses.left} .${axisClasses.label}`]: {
                        fill: axisLabelColor,
                      },
                      [`& .${axisClasses.bottom} .${axisClasses.label}`]: {
                        fill: axisLabelColor,
                      },
                      [`& .${axisClasses.bottom} .${axisClasses.tick}`]: {
                        stroke: tickColor,
                        fill: tickColor,
                      },
                      [`& .${axisClasses.left} .${axisClasses.tick}`]: {
                        stroke: tickColor,
                        fill: tickColor,
                      },
                      "& .MuiChartsGrid-line": {
                        stroke: gridColor,
                      },
                    }}
                    margin={{
                      left: 60,
                      right: 20,
                      top: chartTitle ? 30 : 20,
                      bottom: 50,
                    }}
                  />
                ) : (
                  <LineChart
                    height={340}
                    width={undefined}
                    dataset={muiData.rows}
                    xAxis={[
                      {
                        dataKey: "x",
                        scaleType:
                          typeof muiData.rows[0]?.x === "number"
                            ? "linear"
                            : "band",
                        label: xLabel,
                      },
                    ]}
                    series={muiData.keys.map((k, idx) => ({
                      dataKey: k,
                      label: k,
                      color: palette[idx % palette.length],
                    }))}
                    yAxis={[
                      {
                        label: yLabel,
                        min: yScaleCfg.min,
                        max: yScaleCfg.max,
                        tickInterval: (value) =>
                          typeof value === "number"
                            ? value % yScaleCfg.step === 0
                            : false,
                      },
                    ]}
                    slotProps={{
                      legend: {
                        direction: "row",
                        position: {
                          vertical: "top",
                          horizontal: "end",
                        },
                      },
                    }}
                    sx={{
                      [`& .${axisClasses.left} .${axisClasses.label}`]: {
                        fill: axisLabelColor,
                      },
                      [`& .${axisClasses.bottom} .${axisClasses.label}`]: {
                        fill: axisLabelColor,
                      },
                      [`& .${axisClasses.bottom} .${axisClasses.tick}`]: {
                        stroke: tickColor,
                        fill: tickColor,
                      },
                      [`& .${axisClasses.left} .${axisClasses.tick}`]: {
                        stroke: tickColor,
                        fill: tickColor,
                      },
                      "& .MuiChartsGrid-line": {
                        stroke: gridColor,
                      },
                    }}
                    margin={{
                      left: 60,
                      right: 20,
                      top: chartTitle ? 30 : 20,
                      bottom: 50,
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};