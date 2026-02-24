import {useMemo} from "react";
import {usePathname} from "next/navigation";
import type {MainContentMode} from "@/types/view-mode";
import type {PanelMode} from "../types/layout";

function getModeFromPath(pathname: string): MainContentMode {
  if (pathname.startsWith("/simulador")) return "simulations";
  if (pathname.startsWith("/analyticsGraphCreator")) return "analyticsGraphs";
  if (pathname.startsWith("/analyticsMapCreator")) return "analyticsMaps";
  if (pathname.startsWith("/filters")) return "filters";
  if(pathname.startsWith("/statisticsAnalyzer")) return "statisticsAnalyzer";
  if(pathname.startsWith("/dirComparison")) return "dirComparison";
  if (pathname.startsWith("/history")) return "dashboard";
  return "dashboard";
}

export function useLayoutMode() {
  const pathname = usePathname();

  const mode = getModeFromPath(pathname);

  const panelMode = useMemo<PanelMode>(() => {
    if (pathname.startsWith("/analyticsMapCreator")) return "maps";
    if (pathname.startsWith("/analyticsGraphCreator")) return "graphs";
    if(pathname.startsWith("/statisticsAnalyzer")) return "statisticsAnalyzer";
    if(pathname.startsWith("/dirComparison")) return "dirComparison";
    return "none";
  }, [pathname]);

  const showBottomPanel = panelMode !== "none";
  const showRightSidebar = mode === "simulations" || mode === "dashboard";

  return {
    mode,
    panelMode,
    showBottomPanel,
    showRightSidebar,
  };
}
