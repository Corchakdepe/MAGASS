import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import type { SimulationData } from './app-layout';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import dynamic from "next/dynamic";

type VisualizationsProps = {
  simulationData: SimulationData | null;
};



const HeatmapIframe = dynamic(() => import("@/components/HeatmapIframe"), { ssr: false });


export default function Visualizations({ simulationData }: VisualizationsProps) {
  const chartConfig = {
    bikes: {
      label: 'Bikes',
      color: 'hsl(var(--primary))',
    },
  };

  const renderPlaceholder = (title: string) => (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-muted/50 rounded-lg border-2 border-dashed">
        <p className="text-muted-foreground">{simulationData === null ? 'Run a simulation to see the ' : 'Generating '}{title}...</p>
    </div>
  );


  return (
    <Card>
      <CardContent className="p-0">
        <Tabs defaultValue="map" className="w-full">
          <div className="p-4 border-b">
            <TabsList>
              <TabsTrigger value="map">Map View</TabsTrigger>
              <TabsTrigger value="heatmap">Heat Map</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
            </TabsList>
          </div>
          <div className="p-4">
            <TabsContent value="map">
              {simulationData?.mapUrl ? (
                <Image
                  src={simulationData.mapUrl}
                  alt="Map View"
                  width={1200}
                  height={800}
                  className="rounded-lg object-cover w-full h-full"
                  data-ai-hint="city map"
                />
              ) : (
                renderPlaceholder('Map View')
              )}
            </TabsContent>
            <TabsContent value="heatmap">
              {simulationData?.heatmapUrl ? (
                <HeatmapIframe
                src={simulationData.heatmapHtmlPath /* p.ej. "/reports/MapaDensidad_instante0D15.0S0.0C0.0.html" */}
                title="Heatmap Report"
                className="w-full rounded-lg border"
                minHeight={800}
                />
              ) : simulationData?.heatmapUrl ? (
           <Image
            src={simulationData.heatmapUrl}
            alt="Heat Map"
             width={1200}
            height={800}
           className="rounded-lg object-cover w-full h-full"
           data-ai-hint="city heatmap"
          />) : (
                renderPlaceholder('Heatmap')
              )}
            </TabsContent>
            <TabsContent value="charts">
              {simulationData?.chartData ? (
                 <Card>
                  <CardHeader>
                    <CardTitle>Bikes per Zone</CardTitle>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <ChartContainer config={chartConfig} className="min-h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={simulationData.chartData} accessibilityLayer>
                          <CartesianGrid vertical={false} />
                          <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                          <YAxis />
                          <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                          <Bar dataKey="bikes" fill="hsl(var(--primary))" radius={4} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              ) : (
                renderPlaceholder('Charts')
              )}
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
