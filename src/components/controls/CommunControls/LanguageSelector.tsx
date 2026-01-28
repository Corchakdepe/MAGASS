"use client";

import * as React from "react";
import {Languages, Check} from "lucide-react";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {useLanguage} from "@/contexts/LanguageContext";

const LANGUAGES = [
  {code: "en", label: "English", flag: "🇬🇧"},
  {code: "sp", label: "Español", flag: "🇪🇸"},
  {code: "pt", label: "Português", flag: "🇵🇹"},
] as const;

export default function LanguageSelector() {
  const {language, setLanguage} = useLanguage();
  const [open, setOpen] = React.useState(false);

  const currentLanguage = LANGUAGES.find((lang) => lang.code === language);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-xs h-8 px-2 hover:bg-surface-0/70"
          aria-label="Select language"
        >
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">
            {currentLanguage?.flag} {currentLanguage?.label}
          </span>
          <span className="sm:hidden">{currentLanguage?.flag}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-48 p-2 rounded-lg border-surface-3 bg-surface-1/95 backdrop-blur-md shadow-mac-panel"
        align="end"
      >
        <div className="flex flex-col gap-1">
          {LANGUAGES.map((lang) => {
            const isSelected = lang.code === language;
            return (
              <Button
                key={lang.code}
                variant="ghost"
                onClick={() => {
                  setLanguage(lang.code);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-md transition-colors h-9",
                  isSelected
                    ? "bg-accent-soft text-accent font-medium"
                    : "text-text-primary hover:bg-surface-0/70"
                )}
              >
                <span className="flex items-center gap-2">
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </span>
                {isSelected && <Check className="h-4 w-4" />}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
