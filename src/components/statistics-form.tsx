'use client';

import * as React from 'react';
import {useState} from 'react';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from '@/components/ui/popover';
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
    CommandInput,
    CommandEmpty,
} from '@/components/ui/command';
import {Checkbox} from '@/components/ui/checkbox';
import {ChevronsUpDown} from 'lucide-react';


const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000';

const MATRICES = [
    {label: 'Matriz externa (usuario)', id: -1},
    {label: 'Ocupación', id: 0},
    {label: 'Ocupación relativa', id: 1},
    {label: 'Km coger', id: 2},
    {label: 'Km dejar', id: 3},
    {label: 'Peticiones resueltas coger', id: 4},
    {label: 'Peticiones resueltas dejar', id: 5},
    {label: 'Peticiones no resueltas coger', id: 6},
    {label: 'Peticiones no resueltas dejar', id: 7},
    {label: 'Km ficticios coger', id: 8},
    {label: 'Km ficticios dejar', id: 9},
    {label: 'Ficticias resueltas coger', id: 10},
    {label: 'Ficticias resueltas dejar', id: 11},
    {label: 'Ficticias no resueltas coger', id: 12},
    {label: 'Ficticias no resueltas dejar', id: 13},
];

const MAPAS = [
    {label: 'Mapa Densidad', arg: 'mapa_densidad'},
    {label: 'Video Densidad', arg: 'video_densidad'},
    {label: 'Mapa Voronoi', arg: 'mapa_voronoi'},
    {label: 'Mapa Círculo', arg: 'mapa_circulo'},
    {label: 'Mapa Desplazamientos', arg: 'mapa_desplazamientos'},
];

export default function StatisticsForm() {
    const [entrada, setEntrada] = useState('');
    const [salida, setSalida] = useState('');
    const [seleccionAgreg, setSeleccionAgreg] = useState('');
    const [deltaMediaTxt, setDeltaMediaTxt] = useState('');
    const [deltaAcumTxt, setDeltaAcumTxt] = useState('');
    const [apiBusy, setApiBusy] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const selectedIds = seleccionAgreg
        .split(';')
        .map(s => s.trim())
        .filter(s => s !== '');

    const toggleMatrix = (id: number) => {
        const idStr = String(id);
        let next = [...selectedIds];
        if (next.includes(idStr)) next = next.filter(x => x !== idStr);
        else next.push(idStr);
        setSeleccionAgreg(next.join(';'));
    };

    const [selectedMaps, setSelectedMaps] = useState<string[]>([]);
    const [instantesMaps, setInstantesMaps] = useState<Record<string, string>>({});

    const toggleMap = (apiKey: string) => {
        let next = [...selectedMaps];
        if (next.includes(apiKey)) next = next.filter(x => x !== apiKey);
        else next.push(apiKey);
        setSelectedMaps(next);
    };

    const handleAnalyze = async () => {
        if (apiBusy) return;
        setApiBusy(true);
        setApiError(null);

        // conv: empty -> undefined (so backend uses default), else trimmed string
        const nzStr = (s?: string) =>
            s && s.trim().length ? s.trim() : undefined;

        // conv: empty -> undefined (so backend uses default), else number
        const nzInt = (s?: string) =>
            s && s.trim().length ? Number(s.trim()) : undefined;

        const commonPayload = {
            // names in AnalysisArgs are snake_case and required
            input_folder: entrada || '',
            output_folder: salida || '',
            seleccion_agregacion: seleccionAgreg || '-1',

            // ints or None
            delta_media: nzInt(deltaMediaTxt),    // default 60 if undefined
            delta_acumulada: nzInt(deltaAcumTxt), // None if undefined

            // optional str fields -> undefined if not used
            graf_barras_est_med: undefined,
            graf_barras_est_acum: undefined,
            graf_barras_dia: undefined,
            graf_linea_comp_est: undefined,
            graf_linea_comp_mats: undefined,

            mapa_densidad: undefined,
            video_densidad: undefined,
            mapa_voronoi: undefined,
            mapa_circulo: undefined,
            mapa_desplazamientos: undefined,

            filtrado_EstValor: undefined,
            filtrado_EstValorDias: undefined,
            filtrado_Horas: undefined,
            filtrado_PorcentajeEstaciones: undefined,
        };

        const mapRequests = selectedMaps.map(async (apiKey) => {
            // instantes (e.g. "30;31") only for that map, or undefined
            const instantes = instantesMaps[apiKey];
            const payload = {
                ...commonPayload,
                [apiKey]: nzStr(instantes),
            };

            console.log('sending payload', apiKey, payload);

            const res = await fetch(`${API_BASE}/exe/analizar-json`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload),
            });

            const json = await res.json().catch(() => null);
            if (!res.ok) {
                console.error('error response', res.status, json);
                throw new Error(
                    `Error analizando mapa ${apiKey}: ${res.status} ${
                        (json as any)?.detail ?? ''
                    }`,
                );
            }
            return json;
        });

        try {
            const results = await Promise.all(mapRequests);
            console.log('Resultados análisis mapas:', results);
        } catch (e: any) {
            setApiError(e?.message ?? 'Error inesperado');
        } finally {
            setApiBusy(false);
        }
    };


    return (
        <div className="space-y-8">
            <Card className="shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">Entradas y opciones</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                    {/* Entradas / Salidas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="entrada">Entrada ficheros</Label>
                            <Input
                                id="entrada"
                                value={entrada}
                                onChange={e => setEntrada(e.target.value)}
                                placeholder="./Resultados_Simulador"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="salida">Salida ficheros</Label>
                            <Input
                                id="salida"
                                value={salida}
                                onChange={e => setSalida(e.target.value)}
                                placeholder="./Resultados_Analisis"
                            />
                        </div>
                    </div>

                    {/* Select de matrices */}
                    <div className="space-y-2">
                        <Label>Selección/agregación matrices</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between"
                                >
                                    {selectedIds.length > 0
                                        ? `${selectedIds.length} seleccionada(s): ${selectedIds.join(';')}`
                                        : 'Selecciona matrices...'}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0">
                                <Command>
                                    <CommandInput placeholder="Buscar matriz..."/>
                                    <CommandEmpty>No encontrada</CommandEmpty>
                                    <CommandList>
                                        <CommandGroup>
                                            {MATRICES.map(m => (
                                                <CommandItem
                                                    key={m.id}
                                                    onSelect={() => toggleMatrix(m.id)}
                                                    className="flex items-center space-x-2 cursor-pointer"
                                                >
                                                    <Checkbox
                                                        checked={selectedIds.includes(String(m.id))}
                                                        onCheckedChange={() => toggleMatrix(m.id)}
                                                    />
                                                    <span className="text-sm">
                            {m.label} ({m.id})
                          </span>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <Input
                            value={seleccionAgreg}
                            onChange={e => setSeleccionAgreg(e.target.value)}
                            placeholder="Ej: 1;2;3"
                        />
                    </div>

                    {/* Deltas */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="space-y-1">
                            <Label htmlFor="deltaMedia">Delta Media</Label>
                            <Input
                                id="deltaMedia"
                                value={deltaMediaTxt}
                                onChange={e => setDeltaMediaTxt(e.target.value)}
                                placeholder="4, 60, 1440…"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="deltaAcum">Delta Acumulada</Label>
                            <Input
                                id="deltaAcum"
                                value={deltaAcumTxt}
                                onChange={e => setDeltaAcumTxt(e.target.value)}
                                placeholder="4, 60, 1440…"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="newDelta">Nuevo Delta (simulación)</Label>
                            <Input id="newDelta" type="number" value={60} disabled/>
                        </div>
                    </div>

                    {/* Mapas */}
                    <div className="space-y-2 mt-4">
                        <Label>Mapas a generar</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between"
                                >
                                    {selectedMaps.length > 0
                                        ? `${selectedMaps.length} seleccionada(s): ${selectedMaps.join(';')}`
                                        : 'Selecciona mapas...'}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0">
                                <Command>
                                    <CommandInput placeholder="Buscar mapa..."/>
                                    <CommandEmpty>No encontrado</CommandEmpty>
                                    <CommandList>
                                        <CommandGroup>
                                            {MAPAS.map(m => (
                                                <div key={m.arg} className="flex flex-col py-1">
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            checked={selectedMaps.includes(m.arg)}
                                                            onCheckedChange={() => toggleMap(m.arg)}
                                                        />
                                                        <span className="text-sm">{m.label}</span>
                                                    </div>
                                                    {selectedMaps.includes(m.arg) && (
                                                        <Input
                                                            value={instantesMaps[m.arg] || ''}
                                                            onChange={e =>
                                                                setInstantesMaps({
                                                                    ...instantesMaps,
                                                                    [m.arg]: e.target.value,
                                                                })
                                                            }
                                                            placeholder="Instantes ej: 30;31;32"
                                                            className="ml-6 mt-1 w-[250px]"
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <Input
                            value={selectedMaps
                                .map(k =>
                                    instantesMaps[k] ? `${k}(${instantesMaps[k]})` : k
                                )
                                .join(';')}
                            readOnly
                            placeholder="Ej: mapa_circulo(30;31;32)"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex gap-3 items-center">
                <Button onClick={handleAnalyze} disabled={apiBusy}>
                    {apiBusy ? 'Analizando...' : 'Analizar'}
                </Button>
                {apiError && (
                    <span className="text-sm text-destructive">{apiError}</span>
                )}
            </div>
        </div>
    );
}
