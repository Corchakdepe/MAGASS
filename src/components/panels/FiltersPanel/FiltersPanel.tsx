"use client";

import * as React from "react";
import {useLanguage} from "@/contexts/LanguageContext";
import type {FiltersPanelProps} from "./types/filters";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {FileJson, FileText, Calendar, Trash2, Download, ExternalLink} from "lucide-react";
import {Button} from "@/components/ui/button";

export function FiltersPanel({runId, filters = [], onRefresh}: FiltersPanelProps) {
  const {t} = useLanguage();

  if (!runId) {
    return (
      <div className="h-full w-full flex items-center justify-center text-text-secondary p-6">
        <p>{t("selectRunToViewFilters") || "Select a simulation run to view its filters"}</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto p-6 space-y-6 bg-surface-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-1">
            {t("filters") || "Filters"}
          </h2>
          <p className="text-sm text-text-secondary">
            {t("manageRunFilters") || "Manage and view filters generated for this simulation"}
          </p>
        </div>
        
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            {t("refresh") || "Refresh"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filters.length > 0 ? (
          filters.map((filter) => (
            <Card key={filter.id} className="border-surface-3 bg-surface-1/50 hover:bg-surface-1 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-md bg-accent/10 text-accent">
                    {filter.format === 'json' ? <FileJson size={20} /> : <FileText size={20} />}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-text-tertiary hover:text-danger">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-sm font-semibold mt-2 line-clamp-1" title={filter.name}>
                  {filter.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-xs text-text-tertiary">
                  <Calendar size={12} className="mr-1" />
                  {filter.created ? new Date(filter.created).toLocaleString() : 'N/A'}
                </div>
                
                <div className="flex items-center gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 h-8 text-[11px]" asChild>
                    <a href={filter.api_full_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={12} className="mr-1" />
                      {t("viewRaw") || "View Raw"}
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 h-8 text-[11px]" asChild>
                    <a href={filter.api_full_url} download={filter.name}>
                      <Download size={12} className="mr-1" />
                      {t("download") || "Download"}
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-surface-3 rounded-xl bg-surface-1/30">
            <div className="p-4 rounded-full bg-surface-2 mb-4">
              <FileJson size={32} className="text-text-tertiary" />
            </div>
            <p className="text-sm text-text-secondary font-medium">
              {t("noFiltersFound") || "No filters found for this run"}
            </p>
            <p className="text-xs text-text-tertiary mt-1">
              {t("createFilterInSidebar") || "Create a new filter using the right sidebar"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
