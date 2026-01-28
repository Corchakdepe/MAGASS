"use client";

import * as React from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useLanguage} from "@/contexts/LanguageContext";

interface MatrixComparisonConfigProps {
  delta: string;
  onDeltaChange: (value: string) => void;
  mode: "Suma" | "Media";
  onModeChange: (mode: "Suma" | "Media") => void;
  stations1: string;
  onStations1Change: (value: string) => void;
  stations2: string;
  onStations2Change: (value: string) => void;
}

export function MatrixComparisonConfig({
  delta,
  onDeltaChange,
  mode,
  onModeChange,
  stations1,
  onStations1Change,
  stations2,
  onStations2Change,
}: MatrixComparisonConfigProps) {
  const {t} = useLanguage();

  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold text-text-primary">
        {t('matrixComparisonConfiguration')}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-text-secondary">
            {t('delta')}
          </Label>
          <Input
            type="text"
            className="h-9 text-xs rounded-md border-surface-3 bg-surface-1"
            value={delta}
            onChange={(e) => onDeltaChange(e.target.value)}
            placeholder="1440"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-text-secondary">
            {t('mode')}
          </Label>
          <Select value={mode} onValueChange={onModeChange}>
            <SelectTrigger className="h-9 text-xs rounded-md border-surface-3 bg-surface-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-surface-3 bg-surface-1/95 backdrop-blur-md">
              <SelectItem value="Suma" className="text-xs">{t('sum')}</SelectItem>
              <SelectItem value="Media" className="text-xs">{t('average')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[11px] font-medium text-text-secondary">
          {t('stationsSet1')}
        </Label>
        <Autocomplete
          freeSolo
          options={[]}
          value={stations1}
          onInputChange={(_, val) => onStations1Change(val)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="1;2;3;…"
              size="small"
              sx={{
                "& .MuiInputBase-root": {
                  fontSize: "0.75rem",
                  height: "2.25rem",
                },
              }}
            />
          )}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[11px] font-medium text-text-secondary">
          {t('stationsSet2')}
        </Label>
        <Autocomplete
          freeSolo
          options={[]}
          value={stations2}
          onInputChange={(_, val) => onStations2Change(val)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="4;5;6;…"
              size="small"
              sx={{
                "& .MuiInputBase-root": {
                  fontSize: "0.75rem",
                  height: "2.25rem",
                },
              }}
            />
          )}
        />
      </div>
    </div>
  );
}
