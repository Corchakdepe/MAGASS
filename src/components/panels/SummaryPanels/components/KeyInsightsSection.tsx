import {TrendingUp, AlertTriangle, CheckCircle, Activity} from "lucide-react";
import type {SummaryMetrics} from "../hooks/useSummaryMetrics";

type KeyInsightsSectionProps = {
  metrics: SummaryMetrics;
  t: (key: string) => string;
};

type Insight = {
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  icon: React.ReactNode;
};

export function KeyInsightsSection({metrics, t}: KeyInsightsSectionProps) {
  const insights: Insight[] = [];

  // Generate insights based on metrics
  if (metrics.overallSuccessRate >= 90) {
    insights.push({
      type: 'success',
      title: t('excellentPerformance') || 'Excellent Performance',
      message: `${metrics.overallSuccessRate.toFixed(1)}% success rate indicates optimal system efficiency`,
      icon: <CheckCircle className="h-5 w-5" />,
    });
  } else if (metrics.overallSuccessRate < 70) {
    insights.push({
      type: 'warning',
      title: t('performanceImprovement') || 'Performance Needs Improvement',
      message: `Only ${metrics.overallSuccessRate.toFixed(1)}% success rate. Consider adjusting station capacity or rebalancing strategy`,
      icon: <AlertTriangle className="h-5 w-5" />,
    });
  }

  if (metrics.rebalancingIntensity > 50) {
    insights.push({
      type: 'info',
      title: t('highRebalancing') || 'High Rebalancing Activity',
      message: `Rebalancing operations are ${metrics.rebalancingIntensity.toFixed(0)}% of real demand. Consider optimizing station distribution`,
      icon: <Activity className="h-5 w-5" />,
    });
  }

  if (metrics.efficiencyScore >= 80) {
    insights.push({
      type: 'success',
      title: t('highEfficiency') || 'High System Efficiency',
      message: `Efficiency score of ${metrics.efficiencyScore.toFixed(1)}/100 indicates well-balanced operations`,
      icon: <TrendingUp className="h-5 w-5" />,
    });
  }

  if (metrics.operationalBalance > 20) {
    insights.push({
      type: 'warning',
      title: t('operationalImbalance') || 'Operational Imbalance Detected',
      message: `${metrics.operationalBalance.toFixed(1)}% imbalance between pickups and dropoffs`,
      icon: <AlertTriangle className="h-5 w-5" />,
    });
  }

  const getInsightStyles = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return {bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-500', icon: 'text-green-500'};
      case 'warning':
        return {bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-500', icon: 'text-yellow-500'};
      case 'error':
        return {bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-500', icon: 'text-red-500'};
      default:
        return {bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-500', icon: 'text-blue-500'};
    }
  };

  if (insights.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-text-primary">
        {t('keyInsights') || 'Key Insights'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((insight, idx) => {
          const styles = getInsightStyles(insight.type);
          return (
            <div
              key={idx}
              className={`rounded-lg border ${styles.border} ${styles.bg} p-4`}
            >
              <div className="flex items-start gap-3">
                <div className={styles.icon}>{insight.icon}</div>
                <div className="flex-1">
                  <h4 className={`text-sm font-semibold ${styles.text} mb-1`}>
                    {insight.title}
                  </h4>
                  <p className="text-xs text-text-secondary">{insight.message}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
