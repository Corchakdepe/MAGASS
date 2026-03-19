import type {SimulationSummary} from "../types/sidebar";

export function parseSummary(summaryString: string): SimulationSummary {
  const cleaned = summaryString.trim().replace(/^"|"$/g, '');
  const values = cleaned.split(',').map((v) => Number(v.trim()) || 0);

  return {
    deltaMinutes: values[0] || 0,
    stressPercentage: values[1] || 0,
    realPickupKms: values[2] || 0,
    realDropoffKms: values[3] || 0,
    fictionalPickupKms: values[4] || 0,
    fictionalDropoffKms: values[5] || 0,
    resolvedRealPickups: values[6] || 0,
    resolvedRealDropoffs: values[7] || 0,
    unresolvedRealPickups: values[8] || 0,
    unresolvedRealDropoffs: values[9] || 0,
    resolvedFictionalPickups: values[10] || 0,
    resolvedFictionalDropoffs: values[11] || 0,
    unresolvedFictionalPickups: values[12] || 0,
    unresolvedFictionalDropoffs: values[13] || 0,
  };
}
