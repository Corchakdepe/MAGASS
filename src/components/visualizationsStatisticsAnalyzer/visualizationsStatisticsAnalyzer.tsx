// src/components/visualizations/VisualizationStatisticsAnalyzerPanel.tsx

"use client";

import React, {useState} from "react";
import {API_BASE} from "@/lib/analysis/constants";
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
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({folder_path: outputPath}),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw === "" || raw === "-") return; // allow clearing while typing
        const parsed = Number(raw);
        if (!isNaN(parsed)) onChange(clamp(parsed));
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const parsed = Number(e.target.value);
        if (isNaN(parsed) || e.target.value === "") {
            onChange(min); // reset to min if left empty/invalid
        } else {
            onChange(clamp(parsed));
        }
    };

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
                    <input
                        type="number"
                        value={value}
                        min={min}
                        max={max}
                        step={step}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className="w-16 h-8 text-center bg-surface-1 text-sm font-semibold text-text-primary
                       tabular-nums outline-none border-r border-surface-3
                       focus:bg-surface-2 transition-colors
                       [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                       [&::-webkit-inner-spin-button]:appearance-none"
                    />
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
                {unit && (
                    <span className="text-xs text-text-secondary w-6">{unit}</span>
                )}
            </div>
        </div>
    );
}


// ─── FolderPicker ─────────────────────────────────────────────────────────────

interface FolderEntry {
    path: string;       // ./uploads/20260305_153847_…
    name: string;       // 20260305_153847_…
    date: string;       // "2026-03-05"
    tag: string | null; // "test" | "FullMonth" | null …
    isGenerated: boolean;
}

function parseFolderName(raw: string): FolderEntry {
    const name = raw.replace("./uploads/", "");

    // Generated: 20260305_153847_NewUpLoadThingGeneratedByStatiscalGenerator[_tag]
    const genMatch = name.match(
        /^(\d{4})(\d{2})(\d{2})_\d{6}_NewUpLoadThingGeneratedByStatiscalGenerator(?:_(.+))?$/
    );
    if (genMatch) {
        return {
            path: raw,
            name,
            date: `${genMatch[1]}-${genMatch[2]}-${genMatch[3]}`,
            tag: genMatch[4] ?? null,
            isGenerated: true,
        };
    }

    // Raw upload: upload_20260305_152810
    const upMatch = name.match(/^upload_(\d{4})(\d{2})(\d{2})_\d{6}$/);
    if (upMatch) {
        return {
            path: raw,
            name,
            date: `${upMatch[1]}-${upMatch[2]}-${upMatch[3]}`,
            tag: null,
            isGenerated: false,
        };
    }

    return {path: raw, name, date: "", tag: null, isGenerated: false};
}

function FolderPicker({
                          value,
                          onChange,
                      }: {
    value: string;
    onChange: (v: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [folders, setFolders] = useState<FolderEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<"all" | "generated" | "upload">("all");

    const ref = React.useRef<HTMLDivElement>(null);

    const fetchFolders = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/list-upload-folders`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail ?? `HTTP ${res.status}`);
            setFolders((data.folders as string[]).map(parseFolderName));
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to load folders");
        } finally {
            setLoading(false);
        }
    };

    // Open + fetch
    const handleOpen = () => {
        setOpen(true);
        if (folders.length === 0) fetchFolders();
    };

    // Outside click → close
    React.useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const filtered = folders.filter((f) => {
        const matchesType =
            filter === "all" ||
            (filter === "generated" && f.isGenerated) ||
            (filter === "upload" && !f.isGenerated);
        const matchesQuery = f.name.toLowerCase().includes(query.toLowerCase());
        return matchesType && matchesQuery;
    });

    const select = (path: string) => {
        onChange(path);
        setOpen(false);
        setQuery("");
    };

    const selected = folders.find((f) => f.path === value);

    return (
        <div className="space-y-1.5" ref={ref}>
            <label className="text-sm font-medium text-text-primary">Input Folder</label>
            <p className="text-xs text-text-secondary">
                Directory containing your{" "}
                <code className="font-code bg-surface-2 px-1 rounded text-[11px]">*_deltas.csv</code>{" "}
                file and companion data
            </p>

            {/* Trigger button */}
            <button
                type="button"
                onClick={handleOpen}
                className={`
          mt-1.5 w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border bg-surface-1
          shadow-sm text-left transition-all
          ${open ? "border-accent ring-2 ring-accent/20" : "border-surface-3 hover:border-surface-4"}
        `}
            >
                <Folder className="w-4 h-4 text-text-secondary shrink-0"/>
                <div className="flex-1 min-w-0">
                    {value ? (
                        <div className="flex flex-col gap-0">
              <span className="text-xs font-code text-text-primary truncate leading-tight">
                {selected?.tag
                    ? <><span className="text-text-secondary">{selected.date} · </span>{selected.tag}</>
                    : value
                }
              </span>
                            {selected && (
                                <span className="text-[10px] text-text-tertiary font-code truncate leading-tight">
                  {selected.name}
                </span>
                            )}
                        </div>
                    ) : (
                        <span className="text-sm text-text-tertiary">Select a folder…</span>
                    )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    {value && (
                        <span
                            role="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange("");
                            }}
                            className="text-text-tertiary hover:text-text-secondary transition-colors p-0.5 cursor-pointer"
                        >
              <X className="w-3.5 h-3.5"/>
            </span>
                    )}
                    <ChevronDown
                        className={`w-3.5 h-3.5 text-text-tertiary transition-transform ${open ? "rotate-180" : ""}`}/>
                </div>
            </button>

            {/* Dropdown */}
            {open && (
                <div className="rounded-xl border border-surface-3 bg-surface-1 shadow-mac-panel overflow-hidden">

                    {/* Search + refresh row */}
                    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-surface-2">
                        <input
                            autoFocus
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search folders…"
                            className="flex-1 bg-transparent text-xs font-code text-text-primary
                         placeholder:text-text-tertiary outline-none"
                        />
                        <button
                            type="button"
                            onClick={fetchFolders}
                            disabled={loading}
                            className="text-text-tertiary hover:text-text-primary transition-colors disabled:opacity-40"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}/>
                        </button>
                    </div>

                    {/* Filter tabs */}
                    <div className="flex border-b border-surface-2">
                        {(["all", "generated", "upload"] as const).map((f) => (
                            <button
                                key={f}
                                type="button"
                                onClick={() => setFilter(f)}
                                className={`
                  flex-1 py-1.5 text-[11px] font-medium transition-colors
                  ${filter === f
                                    ? "text-accent border-b-2 border-accent"
                                    : "text-text-tertiary hover:text-text-secondary"
                                }
                `}
                            >
                                {f === "all" ? "All" : f === "generated" ? "Generated" : "Uploads"}
                            </button>
                        ))}
                    </div>

                    {/* List */}
                    <div className="max-h-64 overflow-y-auto divide-y divide-surface-2/50">
                        {loading && (
                            <div className="flex items-center justify-center gap-2 py-6 text-xs text-text-tertiary">
                                <Loader2 className="w-3.5 h-3.5 animate-spin"/>
                                Loading…
                            </div>
                        )}
                        {error && (
                            <div className="px-4 py-3 text-xs text-danger">{error}</div>
                        )}
                        {!loading && !error && filtered.length === 0 && (
                            <div className="px-4 py-6 text-xs text-text-tertiary text-center">
                                No folders match
                            </div>
                        )}
                        {!loading && filtered.map((f) => (
                            <button
                                key={f.path}
                                type="button"
                                onClick={() => select(f.path)}
                                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
                  hover:bg-surface-2 group
                  ${value === f.path ? "bg-accent/5" : ""}
                `}
                            >
                                {/* Icon badge */}
                                <div className={`
                  w-7 h-7 rounded-md flex items-center justify-center shrink-0
                  ${f.isGenerated ? "bg-accent/10" : "bg-surface-3"}
                `}>
                                    <Folder
                                        className={`w-3.5 h-3.5 ${f.isGenerated ? "text-accent" : "text-text-tertiary"}`}/>
                                </div>

                                {/* Labels */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        {f.tag && (
                                            <span className="text-xs font-semibold text-text-primary truncate">
                        {f.tag}
                      </span>
                                        )}
                                        {!f.tag && (
                                            <span className="text-xs font-code text-text-secondary truncate">
                        {f.name}
                      </span>
                                        )}
                                        {f.isGenerated && (
                                            <span
                                                className="shrink-0 text-[10px] px-1 py-0.5 rounded bg-accent/10 text-accent font-medium">
                        gen
                      </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        {f.date && (
                                            <span className="text-[10px] text-text-tertiary">{f.date}</span>
                                        )}
                                        {f.tag && (
                                            <span
                                                className="text-[10px] font-code text-text-tertiary truncate">· {f.name}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Selected check */}
                                {value === f.path && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0"/>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
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
                    <CheckCircle2 className="w-3 h-3 text-white"/>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary">Generation complete</p>
                    <p className="text-xs text-text-secondary mt-0.5">{result.message}</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
                {[
                    {label: "Type", value: result.generator_type.toUpperCase()},
                    {label: "Days", value: result.days_generated},
                    {label: "Δ Time", value: `${result.delta_time} min`},
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
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}/>
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
                        <Loader2 className="w-4 h-4 animate-spin"/>
                        Preparing ZIP…
                    </>
                ) : (
                    <>
                        <Download className="w-4 h-4"/>
                        Download as ZIP
                    </>
                )}
            </button>
        </div>
    );
}

// ─── ErrorCard ────────────────────────────────────────────────────────────────

function ErrorCard({label, message}: { label?: string; message: string }) {
    return (
        <div className="rounded-xl border border-danger/30 bg-danger-soft p-4 flex gap-3">
            <div className="mt-0.5 w-5 h-5 rounded-full bg-danger flex items-center justify-center shrink-0">
                <XCircle className="w-3 h-3 text-white"/>
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
        if (loading) return <Loader2 className="w-3 h-3 animate-spin"/>;
        if (success) return <CheckCircle2 className="w-3 h-3"/>;
        if (error) return <XCircle className="w-3 h-3"/>;
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
                <Icon/>
            </div>
            <span className={`text-xs font-medium ${textColor}`}>{label}</span>
        </div>
    );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function VisualizationStatisticsAnalyzerPanel() {
    const [form, setForm] = useState<FormState>({
        ruta_entrada: "",
        delta_time: 15,
        dias_a_simular: 30,
        tipo_generador: 1,
        simname: "",
    });

    const [loadingGen, setLoadingGen] = useState(false);
    const [loadingZip, setLoadingZip] = useState(false);
    const [genResult, setGenResult] = useState<ApiResult | null>(null);
    const [genError, setGenError] = useState<string | null>(null);
    const [zipError, setZipError] = useState<string | null>(null);

    const setF = <K extends keyof FormState>(k: K, v: FormState[K]) =>
        setForm((p) => ({...p, [k]: v}));

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
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    ruta_entrada: form.ruta_entrada.trim(),
                    delta_time: form.delta_time,
                    dias_a_simular: form.dias_a_simular,
                    tipo_generador: form.tipo_generador,
                    simname: form.simname.trim() || null,
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
                    <BarChart3 className="w-4 h-4 text-white"/>
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
                            {
                                label: "Agregado",
                                value: 1 as GeneratorType,
                                description: "Collapses all days into one pattern"
                            },
                            {
                                label: "Natural",
                                value: 2 as GeneratorType,
                                description: "Preserves day-by-day variation"
                            },
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
                            min={1} max={10000} step={5} unit="min"
                        />
                        <div className="pt-3">
                            <Stepper
                                label="Days to Generate"
                                hint="Length of the synthetic output period"
                                value={form.dias_a_simular}
                                onChange={(v) => setF("dias_a_simular", v)}
                                min={1} max={10000} step={1} unit="days"
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
                        <Folder className="w-3.5 h-3.5 text-text-tertiary shrink-0"/>
                        <span className="font-medium text-text-primary">Generate</span>
                        <ArrowRight className="w-3.5 h-3.5 text-accent shrink-0"/>
                        <Download className="w-3.5 h-3.5 text-text-tertiary shrink-0"/>
                        <span className="font-medium text-text-primary">Auto-download ZIP</span>
                        <span className="text-text-tertiary">— no extra steps</span>
                    </div>
                </div>

                {/* Output hint */}
                <div className="flex items-center gap-3 bg-surface-2/60 rounded-xl px-4 py-3">
                    <Download className="w-4 h-4 text-text-secondary shrink-0"/>
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
                                error: "Generation failed",
                                idle: "Generate",
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
                                error: "Download failed",
                                idle: "Download ZIP",
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
                {genError && <ErrorCard label="Generation failed" message={genError}/>}
                {zipError && <ErrorCard label="Download failed" message={zipError}/>}
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
                            <Loader2 className="w-4 h-4 animate-spin"/>
                            {buttonLabel()}
                        </>
                    ) : (
                        <>
                            <Play className="w-4 h-4"/>
                            {buttonLabel()}
                        </>
                    )}
                </button>
            </footer>
        </div>
    );
}
