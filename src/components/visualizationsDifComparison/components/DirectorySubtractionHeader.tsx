// src/components/visualizations/directory-subtraction/DirectorySubtractionHeader.tsx

import React from "react";
import { RefreshCw } from "lucide-react";

interface Props {
  loading: boolean;
  onRefresh: () => void;
}

export default function DirectorySubtractionHeader({ loading, onRefresh }: Props) {
  return (
    <div className="border-b border-surface-3 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-text-primary">Directory Subtraction</h1>
          <p className="text-sm text-text-secondary mt-0.5">Compare and subtract simulation results</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-accent hover:text-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
    </div>
  );
}
