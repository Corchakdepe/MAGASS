// src/components/visualizations/maps/components/MapConfiguration.tsx

import React from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {ScrollArea} from "@/components/ui/scroll-area";
import {
    Map,
    Clock,
    MapPin,
    Layers,
    Database,
    Target,
    Eye,
    AlertCircle,
    FileJson,
    BarChart3,
    Globe,
    Navigation,
    Circle,
    Grid3x3,
    FileText,
    Calendar
} from "lucide-react";
import {MapConfigurationProps, MapContext} from "../types";
import {
    getMatrixLabel,
    formatStations,
    formatInstants,
    getMapKindDisplay,
    getMapType
} from "../utils/mapUtils";
import {useLanguage} from "@/contexts/LanguageContext";

// Get icon for map kind
const getMapKindIcon = (kind: string) => {
    const iconMap: Record<string, React.ElementType> = {
        density: Globe,
        voronoi: Grid3x3,
        circle: Circle,
        displacement: Navigation,
        capacity: BarChart3,
        density_video: Layers
    };

    return iconMap[kind] || Map;
};

// Configuration item component
const ConfigItem = ({
                        icon: Icon,
                        label,
                        value,
                        badge = false
                    }: {
    icon: React.ElementType;
    label: string;
    value: React.ReactNode;
    badge?: boolean;
}) => (
    <div className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
        <div className="mt-0.5">
            <Icon className="h-4 w-4 text-muted-foreground"/>
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            {badge ? (
                <Badge variant="secondary" className="mt-1 font-mono text-xs">
                    {value}
                </Badge>
            ) : (
                <p className="text-sm font-medium truncate">{value}</p>
            )}
        </div>
    </div>
);

// Status badge component
const StatusBadge = ({status}: { status?: string }) => {
    if (!status || status === "success") return null;

    const statusColors: Record<string, string> = {
        error: "bg-destructive/10 text-destructive border-destructive/20",
        warning: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
        placeholder: "bg-muted text-muted-foreground border-border"
    };

    return (
        <Badge variant="outline" className={statusColors[status] || ""}>
            <AlertCircle className="h-3 w-3 mr-1"/>
            {status}
        </Badge>
    );
};

// Error display component
const ErrorDisplay = ({error}: { error?: string }) => {
    if (!error) return null;
    const {t} = useLanguage();
    return (
        <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded">
            <p className="text-xs font-medium text-destructive mb-1">{t("errorGenerating")}</p>
            <p className="text-sm text-destructive/90">{error}</p>
        </div>
    );
};

// Helper function to safely format delta media
const formatDeltaMedia = (delta: any): string => {
    if (delta === null || delta === undefined) return "Not specified";
    if (delta === "None" || delta === "null") return "None";

    // Try to convert to number
    const num = Number(delta);
    if (isNaN(num)) return String(delta);

    return num.toFixed(2);
};

export function MapConfiguration({map, mapJson, className = ""}: MapConfigurationProps) {
    // Use mapJson if provided, otherwise fall back to map metadata
    const config: MapContext = (mapJson || map?.context || {}) as MapContext;

    if (!map) {
        return (
            <Card className={`w-full ${className}`}>
                <CardContent className="p-4">
                    <p className="text-muted-foreground text-sm">No configuration data available</p>
                </CardContent>
            </Card>
        );
    }
    const {t} = useLanguage();
    const matrixType = getMatrixLabel(config.matrix_type);
    const mapKind = getMapType(map.kind || "", map.name || "");
    const MapKindIcon = getMapKindIcon(mapKind);

    // Safely format delta media
    const deltaDisplay = formatDeltaMedia(config.delta_media);

    return (
        <Card className={`w-full shadow-sm ${className}`}>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MapKindIcon className="h-4 w-4"/>
                        <span>Map Configuration</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge status={config.status}/>
                        <Badge variant="outline" className="font-mono text-xs">
                            {getMapKindDisplay(mapKind)}
                        </Badge>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="max-h-[400px]">
                    <div className="px-4 pb-4">
                        {/* Map Name */}
                        {config.map_name && (
                            <ConfigItem
                                icon={Map}
                                label={t("mapName")}
                                value={config.map_name}
                            />
                        )}

                        {/* Matrix Type */}
                        <ConfigItem
                            icon={Database}
                            label={t("matrixType")}
                            value={matrixType}
                            badge
                        />

                        {/* Delta Media - FIXED: Now handles null/undefined/None safely */}
                        <ConfigItem
                            icon={Target}
                            label={t("meanDelta")}
                            value={deltaDisplay}
                            badge
                        />

                        {/* Time/Instant Information */}
                        <ConfigItem
                            icon={Clock}
                            label={t("instant")}
                            value={formatInstants(
                                config.instant,
                                config.start_instant,
                                config.end_instant
                            )}
                        />

                        {/* Stations */}
                        <ConfigItem
                            icon={MapPin}
                            label={t("stations")}
                            value={formatStations(config.stations)}
                        />

                        {/* Additional map-specific metadata */}
                        {config.show_labels !== undefined && (
                            <ConfigItem
                                icon={Eye}
                                label={t("showLabels")}
                                value={config.show_labels ? "Yes" : "No"}
                                badge
                            />
                        )}

                        {config.total_frames !== undefined && (
                            <ConfigItem
                                icon={Layers}
                                label={t("totalFrames")}
                                value={String(config.total_frames)}
                                badge
                            />
                        )}

                        {/* Station count if available */}
                        {config.stations_count && (
                            <ConfigItem
                                icon={MapPin}
                                label={t("stationCount")}
                                value={String(config.stations_count)}
                                badge
                            />
                        )}

                        {/* Generation timestamp */}
                        {config.generated_at && (
                            <ConfigItem
                                icon={Calendar}
                                label={t("generated")}
                                value={new Date(config.generated_at).toLocaleString()}
                            />
                        )}
                        {/* Data Summary */}


                        {/* Error Display */}
                        <ErrorDisplay error={config.error || map.error}/>
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}