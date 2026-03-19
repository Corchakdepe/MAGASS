// src/components/visualizations/directory-subtraction/SubtractionResultsPanel.tsx

import React from "react";
import {
  CheckCircle2, FolderOpen, FileText, HardDrive,
  Database, PlusCircle, RefreshCw,
} from "lucide-react";
import { SubtractionResponse } from "../types/types";

interface Props {
  subtractionResult: SubtractionResponse | null;
  onNewSubtraction: () => void;
  onRefreshList: () => void;
}

export default function SubtractionResultsPanel({
  subtractionResult,
  onNewSubtraction,
  onRefreshList,
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow-mac-panel overflow-hidden">
      <div className="px-6 py-4 border-b border-surface-3">
        <h2 className="font-medium text-text-primary">Results</h2>
        <p className="text-xs text-text-secondary mt-1">Output of the subtraction operation</p>
      </div>

      <div className="p-6">
        {subtractionResult ? (
          <div className="space-y-6">
            <div className="bg-success-soft rounded-lg p-4 border border-success/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">Success!</p>
                  <p className="text-sm text-text-secondary">{subtractionResult.message}</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-0 rounded-lg p-4">
              <dl className="space-y-4">
                <div>
                  <dt className="text-xs text-text-secondary mb-1 flex items-center gap-1">
                    <FolderOpen className="w-3 h-3" />
                    Output Folder
                  </dt>
                  <dd className="font-mono text-sm bg-white p-3 rounded-lg border border-surface-3 break-all">
                    {subtractionResult.output_folder}
                  </dd>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs text-text-secondary mb-1 flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      Files Created
                    </dt>
                    <dd className="text-lg font-medium text-text-primary">
                      {subtractionResult.files_created}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-text-secondary mb-1 flex items-center gap-1">
                      <HardDrive className="w-3 h-3" />
                      Output Path
                    </dt>
                    <dd className="text-sm text-text-secondary truncate">
                      {subtractionResult.output_path}
                    </dd>
                  </div>
                </div>
              </dl>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onNewSubtraction}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1"
              >
                <PlusCircle className="w-4 h-4" />
                New Subtraction
              </button>
              <button
                onClick={onRefreshList}
                className="px-4 py-2 text-sm font-medium text-accent hover:text-accent-hover transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh List
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-surface-2 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Database className="w-8 h-8 text-text-tertiary" />
            </div>
            <p className="text-text-secondary">No results yet</p>
            <p className="text-xs text-text-tertiary mt-2 max-w-[250px] mx-auto">
              Select two simulations and click subtract to see the results here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
