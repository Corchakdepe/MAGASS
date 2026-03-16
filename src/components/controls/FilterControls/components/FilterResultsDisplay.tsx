// components/filters/FilterResultsDisplay.tsx
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Copy, Check, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { FilterResponse } from '@/components/controls/FilterControls/types/filterControls.ts';

interface FilterResultsDisplayProps {
  response: FilterResponse | null;
  onDownload?: (filename: string) => void;
  onCopy?: (data: number[]) => void;
}

export function FilterResultsDisplay({
  response,
  onDownload,
  onCopy
}: FilterResultsDisplayProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = React.useState(false);

  if (!response || !response.success) {
    return null;
  }

  const handleCopy = () => {
    const text = response.data.join(', ');
    navigator.clipboard.writeText(text);
    setCopied(true);
    onCopy?.(response.data);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (response.result_file) {
      onDownload?.(response.result_file);
    }
  };

  const filename = response.result_file.split('/').pop() || 'filter_result.csv';
  const filterTypeMap: Record<string, string> = {
    'estaciones_dia': 'Daily Stations',
    'estaciones_mes': 'Monthly Stations',
    'horas': 'Hours',
    'porcentaje_tiempo': 'Time Percentage'
  };

  return (
    <Card className="bg-surface-2/30 border-surface-3">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-accent" />
            {t('filterResults')}

          </span>
          <span className="text-xs text-text-secondary bg-surface-2 px-2 py-1 rounded-full">
            {filterTypeMap[response.filter_type] || response.filter_type}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-3 space-y-3">
        <div className="bg-surface-1/50 rounded-lg p-3 border border-surface-3/50">
          <div className="text-xs font-mono break-all max-h-32 overflow-y-auto">
            {response.data.length > 0 ? (
              <div className="space-y-1">
                <div className="text-text-tertiary text-[9px] uppercase tracking-wider">
                  {response.data.length} {t('stationsFound')}
                </div>
                <div className="text-text-primary">
                  {response.data.join(', ')}
                </div>
              </div>
            ) : (
              <span className="text-text-secondary italic">
                {t('noStationsFound')}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs border-surface-3 hover:bg-surface-2"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 mr-1 text-success" />
                {t('copied')}
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                {t('copy')}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs border-surface-3 hover:bg-surface-2"
            onClick={handleDownload}
          >
            <Download className="h-3 w-3 mr-1" />
            {t('download')}
          </Button>
        </div>

        <div className="text-[9px] text-text-tertiary truncate" title={response.result_file}>
           {filename}
        </div>

        <p className="text-[10px] text-text-secondary italic border-l-2 border-accent/30 pl-2">
          {response.message}
        </p>
      </CardContent>
    </Card>
  );
}