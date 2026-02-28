import React, { useMemo, useState } from 'react';
import { TreeNode } from '../utils/treeBuilder';
import { SitemapEntry } from '../utils/sitemapParser';
import { analyzeStructure, StructuralReport, IssueSeverity } from '../utils/structuralAnalysis';
import { AlertTriangle, Info, AlertCircle, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';

interface StructuralInsightsProps {
  treeData: TreeNode;
  urls: SitemapEntry[];
}

const severityConfig: Record<IssueSeverity, { icon: typeof AlertTriangle; color: string; bg: string; border: string }> = {
  critical: { icon: AlertCircle, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  warning: { icon: AlertTriangle, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  info: { icon: Info, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
};

function healthColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function healthBg(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

const StructuralInsights: React.FC<StructuralInsightsProps> = ({ treeData, urls }) => {
  const [expanded, setExpanded] = useState(false);
  const [showAllSections, setShowAllSections] = useState(false);
  const report: StructuralReport = useMemo(
    () => analyzeStructure(treeData, urls),
    [treeData, urls]
  );

  if (report.issues.length === 0 && report.sections.length === 0) return null;

  const displayedSections = showAllSections ? report.sections : report.sections.slice(0, 6);
  const totalPages = report.sections.reduce((sum, s) => sum + s.pageCount, 0);

  return (
    <div className="mt-8 space-y-6">
      {/* Health Score + Issue Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-pink/10 rounded-lg">
              <BarChart3 className="h-5 w-5 text-primary-pink" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Structural Health</h3>
              <p className="text-sm text-gray-500">
                {report.issues.length === 0 ? 'No issues detected' : `${report.issues.length} insight${report.issues.length === 1 ? '' : 's'} found`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-3xl font-bold ${healthColor(report.healthScore)}`}>
              {report.healthScore}
            </span>
            <span className="text-sm text-gray-500">/100</span>
          </div>
        </div>

        {/* Health bar */}
        <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${healthBg(report.healthScore)}`}
            style={{ width: `${report.healthScore}%` }}
          />
        </div>

        {/* Issues list */}
        {report.issues.length > 0 && (
          <div className="space-y-3">
            {(expanded ? report.issues : report.issues.slice(0, 3)).map((issue, i) => {
              const config = severityConfig[issue.severity];
              const Icon = config.icon;
              return (
                <div key={i} className={`${config.bg} ${config.border} border rounded-lg p-4`}>
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 ${config.color} mt-0.5 flex-shrink-0`} />
                    <div className="min-w-0">
                      <p className={`text-sm font-medium ${config.color}`}>{issue.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                      {issue.affectedPaths.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {issue.affectedPaths.map((path, j) => (
                            <span key={j} className="text-xs bg-white/70 px-2 py-0.5 rounded text-gray-500 font-mono truncate max-w-[300px]">
                              {path.replace(/https?:\/\/[^/]+/, '')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {report.issues.length > 3 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mx-auto"
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {expanded ? 'Show less' : `Show ${report.issues.length - 3} more`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Section Breakdown */}
      {displayedSections.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Distribution</h3>
          <div className="space-y-3">
            {displayedSections.map(section => {
              const pct = totalPages > 0 ? (section.pageCount / totalPages) * 100 : 0;
              return (
                <div key={section.path}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                      /{section.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {section.pageCount} page{section.pageCount === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-primary-pink h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {!showAllSections && report.sections.length > 6 && (
              <button
                onClick={() => setShowAllSections(true)}
                className="text-sm text-primary-pink hover:underline mt-2 mx-auto block"
              >
                +{report.sections.length - 6} more sections
              </button>
            )}
            {showAllSections && report.sections.length > 6 && (
              <button
                onClick={() => setShowAllSections(false)}
                className="text-sm text-primary-pink hover:underline mt-2 mx-auto block"
              >
                Show fewer sections
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StructuralInsights;
