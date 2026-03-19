import {useState, useEffect} from "react";
import {API_BASE} from "@/lib/analysis/constants";
import {parseDeltaFromRunId} from "@/lib/analysis/parsers";

export function useDeltaCalculation(runId?: string) {
  const parsedDelta = parseDeltaFromRunId(runId);
  const [deltaInMin, setDeltaInMin] = useState<number>(parsedDelta ?? 0);
  const [deltaAutoSource, setDeltaAutoSource] = useState<"runId" | "api" | "manual">(
    parsedDelta ? "runId" : "api"
  );
  const [deltaLoading, setDeltaLoading] = useState(false);

  useEffect(() => {
    const fromRunId = parseDeltaFromRunId(runId);
    if (fromRunId) {
      setDeltaInMin(fromRunId);
      setDeltaAutoSource("runId");
      return;
    }

    const fetchDelta = async () => {
      if (!runId) {
        setDeltaInMin(0);
        setDeltaAutoSource("api");
        return;
      }

      setDeltaLoading(true);
      try {
        let res = await fetch(
          `${API_BASE}/simulation-summary?runId=${encodeURIComponent(runId)}`,
          {cache: "no-store"},
        );

        if (!res.ok) {
          res = await fetch(`${API_BASE}/simulation-summary`, {cache: "no-store"});
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const txt = await res.text();
        const cleaned = txt.trim().replace(/^"|"$/g, "");
        const first = cleaned.split(",")[0];
        const n = Number(first);

        if (Number.isFinite(n) && n > 0) {
          setDeltaInMin(n);
          setDeltaAutoSource("api");
        } else {
          setDeltaInMin(0);
          setDeltaAutoSource("manual");
        }
      } catch {
        setDeltaInMin(0);
        setDeltaAutoSource("manual");
      } finally {
        setDeltaLoading(false);
      }
    };

    fetchDelta();
  }, [runId]);

  return {
    deltaInMin,
    deltaAutoSource,
    deltaLoading,
  };
}
