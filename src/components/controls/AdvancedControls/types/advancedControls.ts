export type DeltaMode = "media" | "acumulada";

export interface AdvancedControlsProps {
  advancedUser: boolean;
  setAdvancedUser: React.Dispatch<React.SetStateAction<boolean>>;
  deltaMode: DeltaMode;
  setDeltaMode: React.Dispatch<React.SetStateAction<DeltaMode>>;
  deltaValueTxt: string;
  setDeltaValueTxt: React.Dispatch<React.SetStateAction<string>>;
  advancedEntrada: string;
  setAdvancedEntrada: React.Dispatch<React.SetStateAction<string>>;
  advancedSalida: string;
  setAdvancedSalida: React.Dispatch<React.SetStateAction<string>>;
}

export interface DeltaConfigurationProps {
  deltaMode: DeltaMode;
  setDeltaMode: React.Dispatch<React.SetStateAction<DeltaMode>>;
  deltaValueTxt: string;
  setDeltaValueTxt: React.Dispatch<React.SetStateAction<string>>;
}

export interface FolderConfigurationProps {
  advancedEntrada: string;
  setAdvancedEntrada: React.Dispatch<React.SetStateAction<string>>;
  advancedSalida: string;
  setAdvancedSalida: React.Dispatch<React.SetStateAction<string>>;
}

export interface AdvancedToggleProps {
  advancedUser: boolean;
  setAdvancedUser: React.Dispatch<React.SetStateAction<boolean>>;
}
