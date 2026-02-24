// src/components/visualizations/VisualizationGraphs.tsx

"use client";

import React, {useState, useEffect, useMemo} from "react";
import {API_BASE} from "@/lib/analysis/constants";
import {
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    FolderOpen,
    Calendar,
    MapPin,
    Database,
    ArrowRight,
    PlusCircle,
    FileText,
    XCircle,
    ChevronRight,
    Clock,
    HardDrive,
    Gauge,
    Footprints,
    Timer,
    BarChart3
} from "lucide-react";

interface Simulation {
    name: string;
    path: string;
    timestamp: string;
    city: string;
    display_name: string;
}

interface SimulationParams {
    stressType: string;
    stress: string;
    walkCost: string;
    delta: string;
}

interface SubtractionRequest {
    folder1: string;
    folder2: string;
    simname?: string;
}

interface SubtractionResponse {
    ok: boolean;
    output_folder: string;
    output_path: string;
    files_created: number;
    message: string;
}

export default function VisualizationsDirComparison() {
    const [simulations, setSimulations] = useState<Simulation[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedSim1, setSelectedSim1] = useState<Simulation | null>(null);
    const [selectedSim2, setSelectedSim2] = useState<Simulation | null>(null);
    const [customName, setCustomName] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState<string>("");

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [subtractionResult, setSubtractionResult] = useState<SubtractionResponse | null>(null);
    const [subtractionError, setSubtractionError] = useState<string | null>(null);

    useEffect(() => {
        fetchSimulations();
    }, []);

    const fetchSimulations = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/exe/list-available-simulations`);

            if (!response.ok) {
                throw new Error(`Failed to fetch simulations: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            setSimulations(data.simulations || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch simulations');
            console.error('Error fetching simulations:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubtract = async () => {
        if (!selectedSim1 || !selectedSim2) {
            alert('Please select both simulations');
            return;
        }

        if (selectedSim1.name === selectedSim2.name) {
            alert('Please select two different simulations');
            return;
        }

        setIsSubmitting(true);
        setSubtractionError(null);
        setSubtractionResult(null);

        try {
            const requestBody: SubtractionRequest = {
                folder1: selectedSim1.name,
                folder2: selectedSim2.name,
            };

            if (customName.trim()) {
                requestBody.simname = customName.trim();
            }

            const response = await fetch(`${API_BASE}/exe/restar-directorios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Subtraction failed: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            setSubtractionResult(data);

            setTimeout(() => {
                fetchSimulations();
            }, 1000);

        } catch (err) {
            setSubtractionError(err instanceof Error ? err.message : 'Failed to perform subtraction');
            console.error('Error during subtraction:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Extract parameters from simulation name
    const extractParams = (simName: string): SimulationParams => {
        const defaultParams = {
            stressType: '0',
            stress: '0%',
            walkCost: '0%',
            delta: '15'
        };

        try {
            // Pattern: YYYYMMDD_HHMMSS_sim_ST{stress_type}_S{stress}_WC{walk_cost}_D{delta}
            const match = simName.match(/_sim_ST(\d+)_S([\d.]+)_WC([\d.]+)_D(\d+)/);

            if (match) {
                const [, stressType, stress, walkCost, delta] = match;

                // Format percentages nicely
                const formatPercent = (value: string) => {
                    const num = parseFloat(value);
                    return num === 0 ? '0%' : num % 1 === 0 ? `${num}%` : `${num}%`;
                };

                return {
                    stressType: stressType,
                    stress: formatPercent(stress),
                    walkCost: formatPercent(walkCost),
                    delta: delta
                };
            }
        } catch (e) {
            console.error('Error parsing simulation name:', e);
        }

        return defaultParams;
    };

    const simulationsByCity = useMemo(() => {
        const grouped: Record<string, Simulation[]> = {};

        simulations.forEach(sim => {
            const city = sim.city || 'Unknown City';
            if (!grouped[city]) {
                grouped[city] = [];
            }
            grouped[city].push(sim);
        });

        Object.keys(grouped).forEach(city => {
            grouped[city].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        });

        return grouped;
    }, [simulations]);

    // Filter simulations based on search term
    const filteredSimulations = useMemo(() => {
        if (!searchTerm.trim()) return simulations;

        return simulations.filter(sim =>
            sim.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sim.city.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [simulations, searchTerm]);

    const areCompatible = useMemo(() => {
        if (!selectedSim1 || !selectedSim2) return true;
        return selectedSim1.city === selectedSim2.city;
    }, [selectedSim1, selectedSim2]);

    const handleSelectSim1 = (sim: Simulation) => {
        setSelectedSim1(sim);
    };

    const handleSelectSim2 = (sim: Simulation) => {
        setSelectedSim2(sim);
    };

    const clearSelections = () => {
        setSelectedSim1(null);
        setSelectedSim2(null);
        setCustomName("");
        setSubtractionResult(null);
    };

    const formatDate = (timestamp: string) => {
        if (timestamp === 'unknown') return 'Unknown date';
        try {
            const year = timestamp.substring(0, 4);
            const month = timestamp.substring(4, 6);
            const day = timestamp.substring(6, 8);
            const time = timestamp.substring(9, 15);
            const hours = time.substring(0, 2);
            const minutes = time.substring(2, 4);
            const seconds = time.substring(4, 6);
            return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
        } catch {
            return timestamp;
        }
    };

    // Simulation Card Component
    const SimulationCard = ({ sim, isSelected, onSelect, disabled }: {
        sim: Simulation;
        isSelected: boolean;
        onSelect: () => void;
        disabled?: boolean;
    }) => {
        const params = extractParams(sim.name);
        const date = formatDate(sim.timestamp);

        return (
            <button
                onClick={onSelect}
                disabled={disabled}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected
                        ? 'border-accent bg-accent-soft shadow-sm'
                        : 'border-surface-3 hover:border-accent/30 hover:bg-surface-0'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-3.5 h-3.5 text-text-secondary" />
                            <span className="text-sm font-medium text-text-primary">{sim.city}</span>
                        </div>
                        <p className="text-xs text-text-secondary truncate">
                            {sim.display_name.split('(')[0].trim()}
                        </p>
                    </div>
                    {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                    )}
                </div>

                {/* Parameters Grid */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="flex items-center gap-1.5 text-xs">
                        <Gauge className="w-3.5 h-3.5 text-text-tertiary" />
                        <div>
                            <span className="text-text-secondary">Stress: </span>
                            <span className="text-text-primary font-medium">{params.stress}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                        <Footprints className="w-3.5 h-3.5 text-text-tertiary" />
                        <div>
                            <span className="text-text-secondary">Walk Cost: </span>
                            <span className="text-text-primary font-medium">{params.walkCost}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                        <Timer className="w-3.5 h-3.5 text-text-tertiary" />
                        <div>
                            <span className="text-text-secondary">Delta: </span>
                            <span className="text-text-primary font-medium">{params.delta} min</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                        <BarChart3 className="w-3.5 h-3.5 text-text-tertiary" />
                        <div>
                            <span className="text-text-secondary">Type: </span>
                            <span className="text-text-primary font-medium">ST{params.stressType}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-text-secondary border-t border-surface-3 pt-2">
                    <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="font-mono text-[10px]">{sim.name.substring(0, 15)}</span>
                    </div>
                </div>
            </button>
        );
    };

    // Parameter Comparison Component
    const ParameterComparison = ({ sim1, sim2 }: { sim1: Simulation; sim2: Simulation }) => {
        const params1 = extractParams(sim1.name);
        const params2 = extractParams(sim2.name);

        const differences = {
            stress: params1.stress !== params2.stress,
            walkCost: params1.walkCost !== params2.walkCost,
            delta: params1.delta !== params2.delta,
            stressType: params1.stressType !== params2.stressType
        };

        return (
            <div className="bg-surface-0 rounded-lg p-4">
                <h4 className="text-xs font-medium text-text-secondary mb-3">Parameter Comparison</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[10px] uppercase tracking-wide text-text-tertiary mb-2">First Simulation</p>
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                                <span className="text-text-secondary">Stress:</span>
                                <span className="text-text-primary font-medium">{params1.stress}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-text-secondary">Walk Cost:</span>
                                <span className="text-text-primary font-medium">{params1.walkCost}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-text-secondary">Delta:</span>
                                <span className="text-text-primary font-medium">{params1.delta} min</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-wide text-text-tertiary mb-2">Second Simulation</p>
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                                <span className="text-text-secondary">Stress:</span>
                                <span className={`font-medium ${differences.stress ? 'text-warning' : 'text-text-primary'}`}>
                                    {params2.stress}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-text-secondary">Walk Cost:</span>
                                <span className={`font-medium ${differences.walkCost ? 'text-warning' : 'text-text-primary'}`}>
                                    {params2.walkCost}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-text-secondary">Delta:</span>
                                <span className={`font-medium ${differences.delta ? 'text-warning' : 'text-text-primary'}`}>
                                    {params2.delta} min
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                {(differences.stress || differences.walkCost || differences.delta) && (
                    <div className="mt-3 text-[10px] text-warning flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Different parameters will be highlighted in the result</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-surface-0 font-body">
            {/* Header */}
            <div className="border-b border-surface-3 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-medium text-text-primary">Directory Subtraction</h1>
                        <p className="text-sm text-text-secondary mt-0.5">Compare and subtract simulation results</p>
                    </div>
                    <button
                        onClick={fetchSimulations}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-accent hover:text-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Selection Panel */}
                    <div className="bg-white rounded-xl shadow-mac-panel overflow-hidden">
                        <div className="px-6 py-4 border-b border-surface-3">
                            <h2 className="font-medium text-text-primary">Select Simulations</h2>
                            <p className="text-xs text-text-secondary mt-1">Choose two simulations to subtract</p>
                        </div>

                        <div className="p-6">
                            {loading && (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <RefreshCw className="w-8 h-8 text-accent/30 animate-spin" />
                                    <p className="text-sm text-text-secondary mt-4">Loading simulations...</p>
                                </div>
                            )}

                            {error && (
                                <div className="bg-danger-soft rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-danger mb-1">Error loading simulations</p>
                                            <p className="text-xs text-text-secondary mb-3">{error}</p>
                                            <button
                                                onClick={fetchSimulations}
                                                className="text-sm text-accent hover:text-accent-hover font-medium flex items-center gap-1"
                                            >
                                                Try again <ArrowRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!loading && !error && simulations.length === 0 && (
                                <div className="text-center py-12">
                                    <FolderOpen className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                                    <p className="text-text-secondary">No simulations found</p>
                                    <p className="text-xs text-text-tertiary mt-2">Run a simulation first to see results here</p>
                                </div>
                            )}

                            {!loading && !error && simulations.length > 0 && (
                                <div className="space-y-6">
                                    {/* Selected Simulations Summary */}
                                    {(selectedSim1 || selectedSim2) && (
                                        <div className="bg-surface-0 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">Selected</span>
                                                <button
                                                    onClick={clearSelections}
                                                    className="text-xs text-accent hover:text-accent-hover flex items-center gap-1"
                                                >
                                                    <XCircle className="w-3 h-3" />
                                                    Clear all
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {selectedSim1 ? (
                                                    <div className="flex-1 bg-white rounded-lg p-2 border border-accent/30">
                                                        <p className="text-xs font-medium truncate">{selectedSim1.city}</p>
                                                        <p className="text-[10px] text-text-secondary mt-0.5">
                                                            {extractParams(selectedSim1.name).stress} · {extractParams(selectedSim1.name).walkCost} · Δ{extractParams(selectedSim1.name).delta}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="flex-1 bg-white/50 rounded-lg p-2 border border-dashed border-surface-3">
                                                        <p className="text-xs text-text-tertiary">Select first...</p>
                                                    </div>
                                                )}
                                                <ArrowRight className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                                                {selectedSim2 ? (
                                                    <div className="flex-1 bg-white rounded-lg p-2 border border-accent/30">
                                                        <p className="text-xs font-medium truncate">{selectedSim2.city}</p>
                                                        <p className="text-[10px] text-text-secondary mt-0.5">
                                                            {extractParams(selectedSim2.name).stress} · {extractParams(selectedSim2.name).walkCost} · Δ{extractParams(selectedSim2.name).delta}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="flex-1 bg-white/50 rounded-lg p-2 border border-dashed border-surface-3">
                                                        <p className="text-xs text-text-tertiary">Select second...</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Parameter Comparison */}
                                            {selectedSim1 && selectedSim2 && (
                                                <div className="mt-3">
                                                    <ParameterComparison sim1={selectedSim1} sim2={selectedSim2} />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Search */}
                                    <div>
                                        <label className="block text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">
                                            Search Simulations
                                        </label>
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Search by city or parameters..."
                                            className="w-full px-3 py-2 bg-surface-0 border border-surface-3 rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                                        />
                                    </div>

                                    {/* Simulation Selection Area */}
                                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                        {Object.entries(simulationsByCity).map(([city, citySims]) => {
                                            const filteredCitySims = citySims.filter(sim =>
                                                filteredSimulations.includes(sim)
                                            );

                                            if (filteredCitySims.length === 0) return null;

                                            return (
                                                <div key={city}>
                                                    <h3 className="text-xs font-medium text-text-secondary mb-2 flex items-center gap-1 sticky top-0 bg-white py-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {city} ({filteredCitySims.length})
                                                    </h3>
                                                    <div className="space-y-2">
                                                        {filteredCitySims.map(sim => (
                                                            <SimulationCard
                                                                key={sim.name}
                                                                sim={sim}
                                                                isSelected={selectedSim1?.name === sim.name || selectedSim2?.name === sim.name}
                                                                disabled={selectedSim1?.name === sim.name || selectedSim2?.name === sim.name}
                                                                onSelect={() => {
                                                                    if (!selectedSim1) {
                                                                        handleSelectSim1(sim);
                                                                    } else if (!selectedSim2 && selectedSim1.name !== sim.name) {
                                                                        handleSelectSim2(sim);
                                                                    }
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Compatibility Indicator */}
                                    {selectedSim1 && selectedSim2 && (
                                        <div className={`rounded-lg p-4 ${
                                            areCompatible 
                                                ? 'bg-success-soft border border-success/20' 
                                                : 'bg-warning-soft border border-warning/20'
                                        }`}>
                                            <div className="flex items-start gap-3">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                                    areCompatible ? 'bg-success/10' : 'bg-warning/10'
                                                }`}>
                                                    {areCompatible ? (
                                                        <CheckCircle2 className="w-4 h-4 text-success" />
                                                    ) : (
                                                        <AlertCircle className="w-4 h-4 text-warning" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-medium ${
                                                        areCompatible ? 'text-success' : 'text-warning'
                                                    }`}>
                                                        {areCompatible ? 'Compatible Simulations' : 'Different Cities'}
                                                    </p>
                                                    <p className="text-xs text-text-secondary mt-0.5">
                                                        {areCompatible
                                                            ? `Both simulations are from ${selectedSim1.city}`
                                                            : `${selectedSim1.city} vs ${selectedSim2.city} — subtraction may not be valid`
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Custom Name */}
                                    <div>
                                        <label className="block text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">
                                            Custom Name (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={customName}
                                            onChange={(e) => setCustomName(e.target.value)}
                                            placeholder="e.g., Weekend vs Weekday Comparison"
                                            className="w-full px-3 py-2 bg-surface-0 border border-surface-3 rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                                        />
                                    </div>

                                    {/* Subtract Button */}
                                    <button
                                        onClick={handleSubtract}
                                        disabled={!selectedSim1 || !selectedSim2 || isSubmitting}
                                        className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                                            !selectedSim1 || !selectedSim2 || isSubmitting
                                                ? 'bg-surface-2 text-text-tertiary cursor-not-allowed'
                                                : areCompatible
                                                    ? 'bg-accent text-white hover:bg-accent-hover shadow-sm'
                                                    : 'bg-warning text-white hover:bg-warning/90 shadow-sm'
                                        }`}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <PlusCircle className="w-4 h-4" />
                                                Subtract Simulations
                                            </>
                                        )}
                                    </button>

                                    {subtractionError && (
                                        <div className="bg-danger-soft rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium text-danger mb-1">Subtraction Failed</p>
                                                    <p className="text-xs text-text-secondary">{subtractionError}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Results Panel */}
                    <div className="bg-white rounded-xl shadow-mac-panel overflow-hidden">
                        <div className="px-6 py-4 border-b border-surface-3">
                            <h2 className="font-medium text-text-primary">Results</h2>
                            <p className="text-xs text-text-secondary mt-1">Output of the subtraction operation</p>
                        </div>

                        <div className="p-6">
                            {subtractionResult ? (
                                <div className="space-y-6">
                                    <div className="bg-success-soft rounded-lg p-4 border border-success/20">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                                                <CheckCircle2 className="w-5 h-5 text-success" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-text-primary">Success!</p>
                                                <p className="text-sm text-text-secondary">{subtractionResult.message}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-surface-0 rounded-lg p-4">
                                        <dl className="space-y-4">
                                            <div>
                                                <dt className="text-xs text-text-secondary mb-1 flex items-center gap-1">
                                                    <FolderOpen className="w-3 h-3" />
                                                    Output Folder
                                                </dt>
                                                <dd className="font-mono text-sm bg-white p-3 rounded-lg border border-surface-3 break-all">
                                                    {subtractionResult.output_folder}
                                                </dd>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <dt className="text-xs text-text-secondary mb-1 flex items-center gap-1">
                                                        <FileText className="w-3 h-3" />
                                                        Files Created
                                                    </dt>
                                                    <dd className="text-lg font-medium text-text-primary">{subtractionResult.files_created}</dd>
                                                </div>
                                                <div>
                                                    <dt className="text-xs text-text-secondary mb-1 flex items-center gap-1">
                                                        <HardDrive className="w-3 h-3" />
                                                        Output Path
                                                    </dt>
                                                    <dd className="text-sm text-text-secondary truncate">
                                                        {subtractionResult.output_path}
                                                    </dd>
                                                </div>
                                            </div>
                                        </dl>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={clearSelections}
                                            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1"
                                        >
                                            <PlusCircle className="w-4 h-4" />
                                            New Subtraction
                                        </button>
                                        <button
                                            onClick={fetchSimulations}
                                            className="px-4 py-2 text-sm font-medium text-accent hover:text-accent-hover transition-colors flex items-center gap-1"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            Refresh List
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-surface-2 rounded-full mx-auto mb-4 flex items-center justify-center">
                                        <Database className="w-8 h-8 text-text-tertiary" />
                                    </div>
                                    <p className="text-text-secondary">No results yet</p>
                                    <p className="text-xs text-text-tertiary mt-2 max-w-[250px] mx-auto">
                                        Select two simulations and click subtract to see the results here
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}