// src/components/visualizations/maps/hooks/useMapMessages.ts

import { useEffect } from "react";
import type { StationPickEvent } from "../types";
import { isStationClickMessage } from "../utils/messaging";

export function useMapMessages(
  onStationPick?: (event: StationPickEvent) => void,
  onMessage?: (message: any) => void
) {
  useEffect(() => {
    const handler = (ev: MessageEvent) => {
      const msg = ev.data;

      if (isStationClickMessage(msg)) {
        const event: StationPickEvent = {
          mapName: msg.mapName,
          station: Number(msg.station),
          data: msg.data ?? null,
        };

        onStationPick?.(event);
        onMessage?.(msg);
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onStationPick, onMessage]);
}
