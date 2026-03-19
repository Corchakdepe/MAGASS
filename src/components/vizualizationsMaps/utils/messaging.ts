// src/components/visualizations/maps/utils/messaging.ts

import type { MapMessage } from "../types";

export function sendToMap(iframeRef: React.RefObject<HTMLIFrameElement>, message: MapMessage) {
  const win = iframeRef.current?.contentWindow;
  if (!win) return;
  win.postMessage(message, "*");
}

export function isStationClickMessage(msg: any): boolean {
  return msg && (msg.type === "MAPSTATIONCLICK" || msg.type === "MAP_STATION_CLICK");
}
