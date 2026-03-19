"use client";

import * as React from "react";
import {Play, FileText, Map, BarChart3} from "lucide-react";
import {Button} from "@/components/ui/button";

interface QuickActionsProps {
  onActionClick: (action: string) => void;
}

export function QuickActions({onActionClick}: QuickActionsProps) {
  const actions = [
    {id: "simulate", label: "New Simulation", icon: Play},
    {id: "report", label: "Generate Report", icon: FileText},
    {id: "map", label: "View Maps", icon: Map},
    {id: "chart", label: "View Charts", icon: BarChart3},
  ];

  return (
    <div className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-3">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => onActionClick(action.id)}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{action.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
