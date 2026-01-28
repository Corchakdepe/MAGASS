"use client";

import * as React from "react";
import {cn} from "@/lib/utils";

interface ChartContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  toolbar?: React.ReactNode;
  className?: string;
}

export function ChartContainer({
  children,
  title,
  subtitle,
  toolbar,
  className,
}: ChartContainerProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel p-4",
        className
      )}
    >
      {(title || toolbar) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-text-primary">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-text-secondary mt-1">{subtitle}</p>
            )}
          </div>
          {toolbar && <div className="flex gap-2">{toolbar}</div>}
        </div>
      )}
      <div className="w-full">{children}</div>
    </div>
  );
}
