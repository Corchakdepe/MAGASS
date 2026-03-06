// src/components/visualizations/VisualizationStatisticsAnalyzerPanel.tsx

"use client";

import React, { useState } from "react";
import { API_BASE } from "@/lib/analysis/constants";
import {
  BarChart3,
  Folder,
  X,
  ChevronDown,
  ChevronRight,
  Play,
  Download,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  Circle,
  ArrowRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type GeneratorType = 1 | 2;

interface FormState {
  ruta_entrada: string;
  delta_time: number;
  dias_a_simular: number;
  tipo_generador: GeneratorType;
  simname: string;
}

interface ApiResult {
  ok: boolean;
  output_folder: string;
  output_path: string;
  generator_type: string;
  delta_time: number;
  days_generated: number;
  output_shape: [number, number];
  replaced_file: string | null;
  files_copied: number;
  all_files: string[];
  message: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const downloadFolderAsZip = async (outputPath: string, folderName: string) => {
  const res = await fetch(`${API_BASE}/exe/download-folder-zip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder_path: outputPath }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }

  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${folderName}.zip`;
  a.click();
  URL.revokeObjectURL(url);
};

// ─── SegmentedControl ─────────────────────────────────────────────────────────

function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T; description?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 p-1 bg-surface-2 rounded-lg">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`
            flex-1 flex flex-col items-center gap-0.5 px-3 py-2 rounded-md text-sm font-medium
            transition-all duration-150 select-none
            ${
              value === opt.value
                ? "bg-white shadow-mac-panel text-text-primary"
                : "text-text-secondary hover:text-text-primary hover:bg-white/50"
            }
          `}
        >
          <span className="font-semibold">{opt.label}</span>
          {opt.description && (
            <span className="text-[11px] font-normal text-text-secondary leading-tight text-center">
              {opt.description}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────────

function Stepper({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        {hint && (
          <span className="text-xs text-text-secondary mt-0.5">{hint}</span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex rounded-md overflow-hidden border border-surface-3 shadow-sm">
          <button
            type="button"
            onClick={() => onChange(clamp(value - step))}
            disabled={value <= min}
            className="w-8 h-8 flex items-center justify-center bg-surface-1 hover:bg-surface-2
                       text-text-primary disabled:text-text-tertiary disabled:cursor-not-allowed
                       border-r border-surface-3 transition-colors text-base leading-none select-none"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => onChange(clamp(value + step))}
            disabled={value >= max}
            className="w-8 h-8 flex items-center justify-center bg-surface-1 hover:bg-surface-2
                       text-text-primary disabled:text-text-tertiary disabled:cursor-not-allowed
                       transition-colors text-base leading-none select-none"
          >
            +
          </button>
        </div>
        <div className="w-16 text-right">
          <span className="text-sm font-semibold text-text-primary tabular-nums">{value}</span>
          {unit && (
            <span className="text-xs text-text-secondary ml-1">{unit}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── FolderPicker ─────────────────────────────────────────────────────────────

function FolderPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-text-primary">Input Folder</label>
      <p className="text-xs text-text-secondary">
        Directory containing your{" "}
        <code className="font-code bg-surface-2 px-1 rounded text-[11px]">*_deltas.csv</code>{" "}
        file and companion data
      </p>
      <div
        className="mt-1.5 flex items-center gap-2 px-3 py-2.5 rounded-lg border border-surface-3
                   bg-surface-1 shadow-sm focus-within:border-accent
                   focus-within:ring-2 focus-within:ring-accent/20 transition-all"
      >
        <Folder className="w-4 h-4 text-text-secondary shrink-0" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="./uploads/my-dataset"
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary
                     outline-none font-code"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-text-tertiary hover:text-text-secondary transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── InlineTextField ──────────────────────────────────────────────────────────

function InlineTextField({
  label,
  hint,
  optional,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium text-text-primary">
          {label}
          {optional && (
            <span className="ml-1.5 text-xs font-normal text-text-tertiary">optional</span>
          )}
        </span>
        {hint && <span className="text-xs text-text-secondary mt-0.5">{hint}</span>}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={40}
        className="w-36 px-2.5 py-1.5 rounded-md border border-surface-3 bg-surface-1
                   text-sm text-text-primary placeholder:text-text-tertiary shadow-sm
                   outline-none focus:border-accent focus:ring-2 focus:ring-accent/20
                   transition-all font-code"
      />
    </div>
  );
}

// ─── ResultCard ───────────────────────────────────────────────────────────────

function ResultCard({
  result,
  onDownload,
  downloading,
}: {
  result: ApiResult;
  onDownload: () => void;
  downloading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-success/30 bg-success-soft p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="mt-0.5 w-5 h-5 rounded-full bg-success flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-3 h-3 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary">Generation complete</p>
          <p className="text-xs text-text-secondary mt-0.5">{result.message}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Type",   value: result.generator_type.toUpperCase() },
          { label: "Days",   value: result.days_generated },
          { label: "Δ Time", value: `${result.delta_time} min` },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg bg-white/70 px-3 py-2 text-center">
            <div className="text-[11px] text-text-secondary">{stat.label}</div>
            <div className="text-sm font-semibold text-text-primary mt-0.5">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Output folder */}
      <div className="rounded-lg bg-white/50 px-3 py-2">
        <p className="text-[11px] text-text-secondary mb-0.5">Output folder</p>
        <p className="text-xs font-code text-text-primary break-all">{result.output_folder}</p>
      </div>

      {/* File list toggle */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-xs text-text-secondary
                   hover:text-text-primary transition-colors py-0.5"
      >
        <span>{result.files_copied} files in output</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <ul className="space-y-0.5 max-h-40 overflow-y-auto">
          {result.all_files.map((f) => (
            <li
              key={f}
              className="text-[11px] font-code text-text-secondary px-2 py-0.5
                         rounded hover:bg-white/50 transition-colors"
            >
              {f}
            </li>
          ))}
        </ul>
      )}

      {/* Download button */}
      <button
        type="button"
        onClick={onDownload}
        disabled={downloading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                   bg-success hover:bg-success/90 disabled:bg-success/50
                   text-white text-sm font-semibold transition-all active:scale-[0.98]"
      >
        {downloading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Preparing ZIP…
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Download as ZIP
          </>
        )}
      </button>
    </div>
  );
}

// ─── ErrorCard ────────────────────────────────────────────────────────────────

function ErrorCard({ label, message }: { label?: string; message: string }) {
  return (
    <div className="rounded-xl border border-danger/30 bg-danger-soft p-4 flex gap-3">
      <div className="mt-0.5 w-5 h-5 rounded-full bg-danger flex items-center justify-center shrink-0">
        <XCircle className="w-3 h-3 text-white" />
      </div>
      <div>
        <p className="text-sm font-semibold text-text-primary">{label ?? "Failed"}</p>
        <p className="text-xs text-text-secondary mt-0.5 break-all">{message}</p>
      </div>
    </div>
  );
}

// ─── StepIndicator ────────────────────────────────────────────────────────────

function StepIndicator({
  index,
  loading,
  success,
  error,
  labels,
}: {
  index: number;
  loading: boolean;
  success: boolean;
  error: boolean;
  labels: { loading: string; success: string; error: string; idle: string };
}) {
  const Icon = () => {
    if (loading) return <Loader2 className="w-3 h-3 animate-spin" />;
    if (success) return <CheckCircle2 className="w-3 h-3" />;
    if (error)   return <XCircle className="w-3 h-3" />;
    return <span className="text-[11px] font-bold">{index}</span>;
  };

  const bg = error
    ? "bg-danger text-white"
    : success
    ? "bg-success text-white"
    : loading
    ? "bg-accent text-white"
    : "bg-surface-3 text-text-tertiary";

  const textColor = loading
    ? "text-accent"
    : success
    ? "text-success"
    : error
    ? "text-danger"
    : "text-text-tertiary";

  const label = loading
    ? labels.loading
    : success
    ? labels.success
    : error
    ? labels.error
    : labels.idle;

  return (
    <div className="flex items-center gap-2 px-1">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
        <Icon />
      </div>
      <span className={`text-xs font-medium ${textColor}`}>{label}</span>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function VisualizationStatisticsAnalyzerPanel() {
  const [form, setForm] = useState<FormState>({
    ruta_entrada:   "",
    delta_time:     15,
    dias_a_simular: 30,
    tipo_generador: 1,
    simname:        "",
  });

  const [loadingGen,   setLoadingGen]   = useState(false);
  const [loadingZip,   setLoadingZip]   = useState(false);
  const [genResult,    setGenResult]    = useState<ApiResult | null>(null);
  const [genError,     setGenError]     = useState<string | null>(null);
  const [zipError,     setZipError]     = useState<string | null>(null);

  const setF = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const isLoading = loadingGen || loadingZip;
  const canSubmit = form.ruta_entrada.trim().length > 0 && !isLoading;

  // ── Step 1: Generate ──────────────────────────────────────────────────────

  const runGenerate = async () => {
    if (!canSubmit) return;
    setLoadingGen(true);
    setGenResult(null);
    setGenError(null);
    setZipError(null);

    try {
      const res = await fetch(`${API_BASE}/exe/generar-estadistico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ruta_entrada:   form.ruta_entrada.trim(),
          delta_time:     form.delta_time,
          dias_a_simular: form.dias_a_simular,
          tipo_generador: form.tipo_generador,
          simname:        form.simname.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? `HTTP ${res.status}`);
      const result = data as ApiResult;
      setGenResult(result);

      // ── Auto-download ZIP immediately after generation ──
      await triggerDownload(result);
    } catch (e: unknown) {
      setGenError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoadingGen(false);
    }
  };

  // ── Step 2: Download ZIP ──────────────────────────────────────────────────

  const triggerDownload = async (result: ApiResult) => {
    setLoadingZip(true);
    setZipError(null);
    try {
      await downloadFolderAsZip(result.output_path, result.output_folder);
    } catch (e: unknown) {
      setZipError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoadingZip(false);
    }
  };

  // ── Button label ──────────────────────────────────────────────────────────

  const buttonLabel = () => {
    if (loadingGen) return "Generating…";
    if (loadingZip) return "Downloading ZIP…";
    return "Generate & Download";
  };

  const showSteps = loadingGen || loadingZip || genResult || genError || zipError;

  return (
    <div className="h-screen flex flex-col bg-surface-0 font-body">

      {/* ── Toolbar ── */}
      <header className="px-5 py-3.5 flex items-center gap-3 bg-surface-1
                         border-b border-surface-3 shadow-mac-toolbar shrink-0">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-text-primary leading-tight">
            Statistical Generator
          </h1>
          <p className="text-[11px] text-text-secondary">
            Synthesize delta files from historical patterns
          </p>
        </div>
      </header>

      {/* ── Body ── */}
      <main className="flex-1 overflow-y-auto px-5 py-5 space-y-4 max-w-xl mx-auto w-full">

        {/* Input folder */}
        <section className="bg-surface-1 rounded-xl shadow-mac-panel p-4">
          <FolderPicker
            value={form.ruta_entrada}
            onChange={(v) => setF("ruta_entrada", v)}
          />
        </section>

        {/* Generator mode */}
        <section className="bg-surface-1 rounded-xl shadow-mac-panel p-4 space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Generator Mode</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Choose how historical data is resampled
            </p>
          </div>
          <SegmentedControl
            options={[
              { label: "Agregado", value: 1 as GeneratorType, description: "Collapses all days into one pattern" },
              { label: "Natural",  value: 2 as GeneratorType, description: "Preserves day-by-day variation" },
            ]}
            value={form.tipo_generador}
            onChange={(v) => setF("tipo_generador", v)}
          />
        </section>

        {/* Parameters */}
        <section className="bg-surface-1 rounded-xl shadow-mac-panel p-4 space-y-4">
          <h2 className="text-sm font-semibold text-text-primary">Parameters</h2>
          <div className="space-y-3 divide-y divide-surface-2">
            <Stepper
              label="Delta Time"
              hint="Resolution of each time slot"
              value={form.delta_time}
              onChange={(v) => setF("delta_time", v)}
              min={1} max={60} step={5} unit="min"
            />
            <div className="pt-3">
              <Stepper
                label="Days to Generate"
                hint="Length of the synthetic output period"
                value={form.dias_a_simular}
                onChange={(v) => setF("dias_a_simular", v)}
                min={1} max={365} step={1} unit="days"
              />
            </div>
            <div className="pt-3">
              <InlineTextField
                label="Generation Name"
                optional
                hint="Appended to the output folder name"
                value={form.simname}
                onChange={(v) => setF("simname", v)}
                placeholder="e.g. spring-run"
              />
            </div>
          </div>
        </section>

        {/* Pipeline hint */}
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-surface-2/60">
          <div className="flex items-center gap-1.5 text-xs text-text-secondary flex-wrap">
            <Folder className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
            <span className="font-medium text-text-primary">Generate</span>
            <ArrowRight className="w-3.5 h-3.5 text-accent shrink-0" />
            <Download className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
            <span className="font-medium text-text-primary">Auto-download ZIP</span>
            <span className="text-text-tertiary">— no extra steps</span>
          </div>
        </div>

        {/* Output hint */}
        <div className="flex items-center gap-3 bg-surface-2/60 rounded-xl px-4 py-3">
          <Download className="w-4 h-4 text-text-secondary shrink-0" />
          <p className="text-xs text-text-secondary">
            ZIP contains all generated files from{" "}
            <span className="font-code text-text-primary">
              ./uploads/&lt;timestamp&gt;_NewUpLoadThing…{form.simname ? `_${form.simname}` : ""}
            </span>
          </p>
        </div>

        {/* Step indicators */}
        {showSteps && (
          <div className="space-y-2">
            <StepIndicator
              index={1}
              loading={loadingGen}
              success={!!genResult}
              error={!!genError}
              labels={{
                loading: "Generating deltas…",
                success: "Deltas generated",
                error:   "Generation failed",
                idle:    "Generate",
              }}
            />
            <StepIndicator
              index={2}
              loading={loadingZip}
              success={!loadingZip && !!genResult && !zipError}
              error={!!zipError}
              labels={{
                loading: "Preparing ZIP download…",
                success: "ZIP downloaded ✓",
                error:   "Download failed",
                idle:    "Download ZIP",
              }}
            />
          </div>
        )}

        {/* Cards */}
        {genResult && (
          <ResultCard
            result={genResult}
            onDownload={() => triggerDownload(genResult)}
            downloading={loadingZip}
          />
        )}
        {genError  && <ErrorCard label="Generation failed" message={genError} />}
        {zipError  && <ErrorCard label="Download failed"   message={zipError} />}
      </main>

      {/* ── Footer ── */}
      <footer className="px-5 py-4 bg-surface-1 border-t border-surface-3 shadow-mac-toolbar shrink-0">
        <button
          type="button"
          onClick={runGenerate}
          disabled={!canSubmit}
          className={`
            w-full h-11 rounded-lg text-sm font-semibold transition-all duration-150
            flex items-center justify-center gap-2 select-none
            ${canSubmit
              ? "bg-accent hover:bg-accent-hover text-white shadow-sm active:scale-[0.98]"
              : "bg-surface-2 text-text-tertiary cursor-not-allowed"
            }
          `}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {buttonLabel()}
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              {buttonLabel()}
            </>
          )}
        </button>
      </footer>
    </div>
  );
}
