import {useState, useMemo, useCallback} from "react";
import {parseStationsLoose, formatStationsCanonical} from "../utils/stationParser";
import type {StationPickPayload} from "../types/layout";

export function useStationPicker() {
  const [pickedStationsShared, setPickedStationsShared] = useState<string>("");

  const externalStationsMaps = useMemo(() => {
    return {
      mapa_circulo: pickedStationsShared,
      mapa_densidad: pickedStationsShared,
    } as Record<string, string>;
  }, [pickedStationsShared]);

  const onStationPick = useCallback((p: StationPickPayload) => {
    setPickedStationsShared((prev) => {
      const cur = parseStationsLoose(prev);

      const idx = cur.indexOf(p.station);
      if (idx >= 0) {
        cur.splice(idx, 1);
      } else {
        cur.push(p.station);
      }

      cur.sort((a, b) => a - b);
      return formatStationsCanonical(cur);
    });
  }, []);

  const onClearSharedStations = useCallback(() => {
    setPickedStationsShared("");
  }, []);

  return {
    pickedStationsShared,
    externalStationsMaps,
    onStationPick,
    onClearSharedStations,
  };
}
