"use client";

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X, Upload, File, AlertCircle } from 'lucide-react';

interface FileUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => Promise<string | null>;
  uploadedFiles: File[];
  compact?: boolean;
}

export default function FileUploadDialog({
  isOpen,
  onClose,
  onUpload,
  uploadedFiles,
  compact = false
}: FileUploadDialogProps) {
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateFiles = (files: File[]): { isValid: boolean; errors: string[] } => {
    const fileNames = files.map(f => f.name.toLowerCase());
    const errors: string[] = [];

    const hasExact = (name: string) => fileNames.includes(name.toLowerCase());
    const hasSuffix = (suffix: string) => fileNames.some(name => name.endsWith(suffix.toLowerCase()));

    // Mandatory specific files
    if (!hasExact('indices_andar.csv')) errors.push("Missing 'indices_andar.csv'");
    if (!hasExact('indices_bicicleta.csv')) errors.push("Missing 'indices_bicicleta.csv'");
    if (!hasExact('kms_andar.csv')) errors.push("Missing 'kms_andar.csv'");
    if (!hasExact('kms_bicicleta.csv')) errors.push("Missing 'kms_bicicleta.csv'");

    // Mandatory pattern files
    if (!hasSuffix('_capacidades.csv')) errors.push("Missing file ending with '_capacidades.csv'");
    if (!hasSuffix('_coordenadas.csv')) errors.push("Missing file ending with '_coordenadas.csv'");
    if (!hasSuffix('_deltas.csv')) errors.push("Missing file ending with '_deltas.csv'");
    if (!hasSuffix('_tendencia_media.csv')) errors.push("Missing file ending with '_tendencia_media.csv'");

    // Exact count check
    if (files.length !== 8) {
      errors.push(`Expected exactly 8 files, but found ${files.length}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      await handleFiles(Array.from(e.target.files));
    }
  }, []);

  const handleFiles = async (files: File[]) => {
    setError(null);
    setValidationErrors([]);

    const { isValid, errors: vErrors } = validateFiles(files);
    if (!isValid) {
      setValidationErrors(vErrors);
      return;
    }

    setIsUploading(true);
    try {
      const result = await onUpload(files);
      if (result) {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className={cn(
        "bg-surface-1 rounded-lg border border-surface-3 shadow-mac-window",
        compact ? "max-w-md" : "max-w-lg",
        "w-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-accent-soft">
              <Upload className="h-4 w-4 text-accent" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary">
              Upload Files
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-surface-2 transition-colors"
          >
            <X className="h-4 w-4 text-text-tertiary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg transition-all duration-200",
              "flex flex-col items-center justify-center text-center cursor-pointer",
              dragActive 
                ? "border-accent bg-accent-soft/20" 
                : "border-surface-3 bg-surface-1",
              compact ? "p-6" : "p-8"
            )}
          >
            <div className={cn(
              "rounded-full mb-3",
              dragActive ? "bg-accent/20 text-accent" : "bg-surface-3 text-text-tertiary"
            )}>
              <Upload className={compact ? "h-5 w-5 p-2" : "h-6 w-6 p-2.5"} />
            </div>
            
            <p className="text-sm font-medium text-text-primary mb-1">
              Drag & drop files here
            </p>
            <p className="text-xs text-text-tertiary mb-4">
              or click to browse your computer
            </p>
            
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
              <div className={cn(
                "px-4 py-2 rounded-md font-medium transition-colors",
                "bg-accent text-white hover:bg-accent-hover",
                compact ? "text-xs" : "text-sm"
              )}>
                {isUploading ? 'Uploading...' : 'Browse Files'}
              </div>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 mt-4 rounded-lg bg-danger-soft border border-danger/20">
              <AlertCircle className="h-4 w-4 text-danger" />
              <p className="text-sm text-text-secondary flex-1">{error}</p>
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-warning-soft border border-warning/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-warning" />
                <p className="text-sm font-semibold text-text-primary">Missing or invalid files:</p>
              </div>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((err, i) => (
                  <li key={i} className="text-xs text-text-secondary">{err}</li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] text-text-tertiary">
                Please make sure to upload exactly 8 CSV files: 
                indices_andar.csv, indices_bicicleta.csv, kms_andar.csv, kms_bicicleta.csv, 
                and four timestamped files ending with _capacidades.csv, _coordenadas.csv, _deltas.csv, and _tendencia_media.csv.
              </p>
            </div>
          )}

          {/* Current Files */}
          {uploadedFiles.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-text-secondary mb-2">
                Current files ({uploadedFiles.length})
              </h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 rounded border border-surface-3 bg-surface-1"
                  >
                    <File className="h-3.5 w-3.5 text-accent" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">{file.name}</p>
                      <p className="text-xs text-text-tertiary">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-surface-3">
          <button
            onClick={onClose}
            className={cn(
              "px-4 py-2 rounded-md font-medium transition-colors",
              "border border-surface-3 text-text-primary hover:bg-surface-2",
              compact ? "text-xs" : "text-sm"
            )}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}