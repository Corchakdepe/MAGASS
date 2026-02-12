'use client';

import React, {useState, useEffect} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {FileText, MapPin, Bike, Building2, AlertCircle, CheckCircle, Loader2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useLanguage} from '@/contexts/LanguageContext';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog';

interface StationData {
    id: string;
    name: string;
    lat: number;
    lng: number;
    capacity: number;
    availableBikes: number;
}

interface UploadPreviewProps {
    uploadedFiles: File[];
    folderPath: string;
    isLoading: boolean;
    onAnalyzeUpload?: () => Promise<{
        city: string;
        totalStations: number;
        totalBikes: number;
        stations: StationData[];
        mapData?: any;
    } | null>;
}

export default function UploadPreviewPanel({
                                               uploadedFiles,
                                               folderPath,
                                               isLoading,
                                               onAnalyzeUpload
                                           }: UploadPreviewProps) {
    const {t} = useLanguage();
    const [analysisData, setAnalysisData] = useState<{
        city: string;
        totalStations: number;
        totalBikes: number;
        stations: StationData[];
        isAnalyzing: boolean;
        error?: string;
    } | null>(null);


    // Analyze uploaded files when they change
    useEffect(() => {
        if (uploadedFiles.length > 0 && onAnalyzeUpload && !analysisData) {
            // Only analyze if we haven't already analyzed these files
            analyzeUploadedFiles();
        }
    }, [uploadedFiles]);

    const analyzeUploadedFiles = async () => {
        if (!onAnalyzeUpload) return;

        setAnalysisData(prev => prev ? {...prev, isAnalyzing: true} : null);

        try {
            const result = await onAnalyzeUpload();
            if (result) {
                setAnalysisData({
                    city: result.city,
                    totalStations: result.totalStations,
                    totalBikes: result.totalBikes,
                    stations: result.stations,
                    isAnalyzing: false
                });
            }
        } catch (error) {
            console.error('Error analyzing upload:', error);
            setAnalysisData({
                city: 'Unknown',
                totalStations: 0,
                totalBikes: 0,
                stations: [],
                isAnalyzing: false,
                error: error instanceof Error ? error.message : 'Failed to analyze files'
            });
        }
    };

    if (uploadedFiles.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5"/>
                    {t('uploadPreview') || 'Upload Preview'}
                </h3>
                <Badge variant={analysisData ? "default" : "secondary"}>
                    {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''}
                </Badge>
            </div>

            {/* File List */}
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-2">
                        {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded bg-gray-50">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-gray-500"/>
                                    <span className="text-sm font-medium">{file.name}</span>
                                </div>
                                <span className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Analysis Results */}
            {analysisData && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* City Card */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Building2 className="h-4 w-4"/>
                                    {t('city') || 'City'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{analysisData.city}</div>
                                <p className="text-xs text-gray-500 mt-1">Data source location</p>
                            </CardContent>
                        </Card>

                        {/* Stations Card */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <MapPin className="h-4 w-4"/>
                                    {t('stations') || 'Stations'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{analysisData.totalStations}</div>
                                <p className="text-xs text-gray-500 mt-1">Bike sharing stations</p>
                            </CardContent>
                        </Card>

                        {/* Bikes Card */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Bike className="h-4 w-4"/>
                                    {t('bikes') || 'Bikes'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{analysisData.totalBikes}</div>
                                <p className="text-xs text-gray-500 mt-1">Available bicycles</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Station Map Preview */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <MapPin className="h-4 w-4"/>
                                {t('stationMapPreview') || 'Station Map Preview'}
                            </CardTitle>
                            <CardDescription>
                                Visual distribution of bike stations with capacity indicators
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {analysisData.isAnalyzing ? (
                                <div className="flex items-center justify-center h-48">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                                    <span className="ml-2">Generating map preview...</span>
                                </div>
                            ) : analysisData.stations.length > 0 ? (
                                <StationMapPreview stations={analysisData.stations}/>
                            ) : (
                                <div className="flex items-center justify-center h-48 text-gray-500">
                                    <AlertCircle className="h-8 w-8 mr-2"/>
                                    No station data available
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Station Capacity Table */}
                    {analysisData.stations.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">
                                    {t('stationCapacity') || 'Station Capacity'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2">Station ID</th>
                                            <th className="text-left py-2">Name</th>
                                            <th className="text-left py-2">Capacity</th>
                                            <th className="text-left py-2">Available Bikes</th>
                                            <th className="text-left py-2">Utilization</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {analysisData.stations.slice(0, 5).map((station) => {
                                            const utilization = (station.availableBikes / station.capacity) * 100;
                                            return (
                                                <tr key={station.id} className="border-b hover:bg-gray-50">
                                                    <td className="py-2">{station.id}</td>
                                                    <td className="py-2">{station.name}</td>
                                                    <td className="py-2">{station.capacity}</td>
                                                    <td className="py-2">{station.availableBikes}</td>
                                                    <td className="py-2">
                                                        <div className="flex items-center">
                                                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                                                <div
                                                                    className={`h-2 rounded-full ${
                                                                        utilization > 80 ? 'bg-red-500' :
                                                                            utilization > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                                                    }`}
                                                                    style={{width: `${Math.min(utilization, 100)}%`}}
                                                                />
                                                            </div>
                                                            <span>{utilization.toFixed(1)}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        </tbody>
                                    </table>
                                    {analysisData.stations.length > 5 && (
                                        <p className="text-xs text-gray-500 mt-2 text-center">
                                            Showing 5 of {analysisData.stations.length} stations
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}

// Simple SVG-based station map preview
function StationMapPreview({stations}: { stations: StationData[] }) {
    // Simple coordinate normalization for visualization
    const minLat = Math.min(...stations.map(s => s.lat));
    const maxLat = Math.max(...stations.map(s => s.lat));
    const minLng = Math.min(...stations.map(s => s.lng));
    const maxLng = Math.max(...stations.map(s => s.lng));

    const width = 400;
    const height = 200;

    const normalizeX = (lng: number) => ((lng - minLng) / (maxLng - minLng)) * width;
    const normalizeY = (lat: number) => ((lat - minLat) / (maxLat - minLat)) * height;

    const maxCapacity = Math.max(...stations.map(s => s.capacity));

    return (
        <div className="relative h-48 bg-gradient-to-br from-blue-50 to-gray-50 rounded-lg border">
            <svg width="100%" height="100%" className="rounded-lg">
                {/* Background grid */}
                {Array.from({length: 5}).map((_, i) => (
                    <g key={`grid-${i}`}>
                        <line
                            x1={(i * width) / 4}
                            y1="0"
                            x2={(i * width) / 4}
                            y2={height}
                            stroke="#e5e7eb"
                            strokeWidth="0.5"
                        />
                        <line
                            x1="0"
                            y1={(i * height) / 4}
                            x2={width}
                            y2={(i * height) / 4}
                            stroke="#e5e7eb"
                            strokeWidth="0.5"
                        />
                    </g>
                ))}

                {/* Stations as circles */}
                {stations.map((station) => {
                    const x = normalizeX(station.lng);
                    const y = normalizeY(station.lat);
                    const radius = Math.max(3, (station.capacity / maxCapacity) * 15);
                    const fillColor = station.availableBikes / station.capacity > 0.5 ? '#10b981' :
                        station.availableBikes / station.capacity > 0.2 ? '#f59e0b' : '#ef4444';

                    return (
                        <g key={station.id}>
                            <circle
                                cx={x}
                                cy={y}
                                r={radius}
                                fill={fillColor}
                                stroke="white"
                                strokeWidth="1.5"
                                opacity="0.8"
                            />
                            <text
                                x={x}
                                y={y}
                                textAnchor="middle"
                                dy=".3em"
                                fontSize="8"
                                fill="white"
                                fontWeight="bold"
                            >
                                {station.id}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>High availability</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span>Medium availability</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>Low availability</span>
                    </div>
                </div>
            </div>
        </div>
    );
}