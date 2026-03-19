

export function lsKey(runId: string) {
    return `viz_maps:${runId}`;
}

export const prettyMapName = (raw: string) => {
    let s = raw.replace(/^\d{8}_\d{6}_/, "");
    s = s.replace(/_/g, " ");
    s = s.replace(/([a-z])([A-Z])/g, "$1 $2");

    const m = s.match(/^(.+?)\s+instante(\d+)D(\d+)/);
    if (m) {
        const base = m[1].trim();
        const inst = m[2];
        const delta = m[3];
        const baseWithDe = base.replace(/^Mapa\s+/i, "Mapa de ");
        return `${baseWithDe} instante ${inst} Delta ${delta}`;
    }

    return s.trim().replace(/^Mapa\s+/i, "Mapa de ");
};
