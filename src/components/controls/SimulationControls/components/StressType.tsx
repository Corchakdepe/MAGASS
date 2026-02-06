import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import type { StressTypeValue } from "../types/types";

type StressTypeProps = {
  stressType: StressTypeValue;
  setStressType: (v: StressTypeValue) => void;
};

export default function StressType({ stressType, setStressType }: StressTypeProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-text-secondary">{t("stressType")}</Label>

      <Select value={stressType} onValueChange={setStressType}>
        <SelectTrigger className="h-9 text-xs bg-surface-1 border border-surface-3 focus:ring-2 focus:ring-accent/25 focus:border-accent/30">
          <SelectValue placeholder={t("selectStressType")} />
        </SelectTrigger>

        <SelectContent className="bg-surface-1 border border-surface-3 shadow-mac-panel">
          <SelectItem value="0">{t("stressTypeNone")}</SelectItem>
          <SelectItem value="1">{t("stressTypeBike")}</SelectItem>
          <SelectItem value="2">{t("stressTypeMovement")}</SelectItem>
          <SelectItem value="3">{t("stressTypeBoth")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
