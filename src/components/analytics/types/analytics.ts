export interface ChartDataPoint {
  x: number | string;
  y: number;
  label?: string;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
}

export interface ChartConfig {
  type: "line" | "bar" | "scatter" | "area";
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  legend?: boolean;
  grid?: boolean;
}

export interface ChartAnalyticsProps {
  series: ChartSeries[];
  config: ChartConfig;
  height?: number;
  width?: number | string;
  onExport?: () => void;
}
