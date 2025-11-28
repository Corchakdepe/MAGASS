import Image from 'next/image';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip} from 'recharts';
import type {SimulationData} from '@/types/simulation';
import {ChartContainer, ChartTooltipContent} from '@/components/ui/chart';

type VisualizationsProps = {
    simulationData: SimulationData | null;
};

export default function Visualizations({simulationData}: VisualizationsProps) {
    const chartConfig = {
        bikes: {
            label: 'Bikes',
            color: 'hsl(var(--primary))',
        },
    };

    const renderPlaceholder = (title: string) => (
        <div
            className="flex flex-col items-center justify-center h-full min-h-[400px] bg-muted/50 rounded-lg border-2 border-dashed">
            <p className="text-muted-foreground">
                {simulationData === null ? 'Run a simulation to see the ' : 'Generating '}
                {title}...
            </p>
        </div>
    );

    return (
        <Card>
        </Card>
    );
}