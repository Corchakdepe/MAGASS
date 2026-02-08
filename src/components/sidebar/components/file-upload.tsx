"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { FolderOpen, Upload, File, X, Check, Folder } from 'lucide-react';
import FileUploadDialog from '@/components/sidebar/components/FileUploadDialog';

type FileUploadProps = {
  folderPath: string;
  setFolderPath: (path: string) => void;
  onFileUpload?: (files: File[]) => Promise<string | null>;
  uploadedFiles?: File[];
  compact?: boolean;
};

export default function FileUpload({
  folderPath,
  setFolderPath,
  onFileUpload,
  uploadedFiles = [],
  compact = false
}: FileUploadProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHover, setIsHover] = useState(false);

  const handleUpload = async (files: File[]) => {
    if (onFileUpload) {
      return await onFileUpload(files);
    }
    return null;
  };

  const hasFiles = uploadedFiles.length > 0;

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className={cn(
          "font-medium flex items-center gap-1.5",
          compact ? "text-xs text-text-secondary" : "text-sm text-text-secondary"
        )}>
          <Folder className={cn(
            "text-text-tertiary",
            compact ? "h-3 w-3" : "h-3.5 w-3.5"
          )} />
          Input Files
        </label>
        {hasFiles && (
          <span className={cn(
            "flex items-center gap-1 text-success font-medium",
            compact ? "text-[10px]" : "text-xs"
          )}>
            <Check className="h-3 w-3" />
            {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Upload Area */}
      <div
        onClick={() => setIsDialogOpen(true)}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        className={cn(
          "border-2 border-dashed rounded-md cursor-pointer transition-all duration-200",
          "flex flex-col items-center justify-center text-center",
          hasFiles
            ? "border-success/30 bg-success-soft/30"
            : isHover
            ? "border-accent/50 bg-accent-soft/30"
            : "border-surface-3 bg-surface-1/50",
          compact ? "p-3" : "p-4"
        )}
      >
        <div className={cn(
          "rounded-full mb-2 transition-all",
          hasFiles
            ? "bg-success/20 text-success"
            : isHover
            ? "bg-accent/20 text-accent"
            : "bg-surface-3 text-text-tertiary"
        )}>
          {hasFiles ? (
            <Check className={compact ? "h-4 w-4 p-1.5" : "h-5 w-5 p-2"} />
          ) : (
            <Upload className={compact ? "h-4 w-4 p-1.5" : "h-5 w-5 p-2"} />
          )}
        </div>

        <div className="space-y-1">
          <p className={cn(
            "font-medium",
            hasFiles ? "text-success" : "text-text-primary",
            compact ? "text-xs" : "text-sm"
          )}>
            {hasFiles ? "Files uploaded successfully!" : "Click to upload files"}
          </p>
          <p className={cn(
            "text-text-tertiary",
            compact ? "text-[10px]" : "text-xs"
          )}>
            {hasFiles
              ? "Drag & drop or click to add more files"
              : "Drag & drop or click to browse"}
          </p>
        </div>

        {hasFiles && (
          <div className={cn(
            "mt-2 w-full max-w-[200px]",
            compact ? "text-[10px]" : "text-xs"
          )}>
            <div className="flex items-center justify-between text-text-secondary mb-1">
              <span>Total size:</span>
              <span className="font-medium">
                {(uploadedFiles.reduce((acc, file) => acc + file.size, 0) / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
            <div className="h-1 w-full bg-surface-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-success rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, uploadedFiles.length * 10)}%`
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* File List (Compact View) */}
      {hasFiles && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className={cn(
              "font-medium text-text-secondary",
              compact ? "text-[10px]" : "text-xs"
            )}>
              Uploaded files:
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFolderPath('');
              }}
              className={cn(
                "text-danger hover:text-danger-hover transition-colors",
                compact ? "text-[10px]" : "text-xs"
              )}
            >
              Clear all
            </button>
          </div>
          <div className={cn(
            "max-h-20 overflow-y-auto space-y-1",
            compact ? "pr-1" : "pr-2"
          )}>
            {uploadedFiles.slice(0, 3).map((file, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-2 p-1.5 rounded border",
                  "bg-surface-1 border-surface-3"
                )}
              >
                <File className={cn(
                  "text-accent",
                  compact ? "h-3 w-3" : "h-3.5 w-3.5"
                )} />
                <span className={cn(
                  "flex-1 truncate text-text-primary",
                  compact ? "text-xs" : "text-sm"
                )}>
                  {file.name}
                </span>
                <span className={cn(
                  "text-text-tertiary font-medium",
                  compact ? "text-[10px]" : "text-xs"
                )}>
                  {(file.size / 1024).toFixed(0)}KB
                </span>
              </div>
            ))}
            {uploadedFiles.length > 3 && (
              <div className={cn(
                "text-center text-text-tertiary italic",
                compact ? "text-[10px] py-1" : "text-xs py-1.5"
              )}>
                +{uploadedFiles.length - 3} more files
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dialog */}
      <FileUploadDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onUpload={handleUpload}
        uploadedFiles={uploadedFiles}
        compact={compact}
      />
    </div>
  );
}