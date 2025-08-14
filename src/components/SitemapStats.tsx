import React from 'react';
import { TreeNode, getTreeStats } from '../utils/treeBuilder';
import { SitemapEntry } from '../utils/sitemapParser';
import { Globe, FolderTree, Activity, BarChart3 } from 'lucide-react';

interface SitemapStatsProps {
  treeData: TreeNode | null;
  urls: SitemapEntry[];
}

const SitemapStats: React.FC<SitemapStatsProps> = ({ treeData, urls }) => {
  if (!treeData) return null;

  const stats = getTreeStats(treeData);
  const uniqueDomains = new Set(urls.map(url => new URL(url.loc).hostname));
  
  // Calculate priority groups (currently unused but may be needed later)
  // const priorityGroups = urls.reduce((acc, url) => {
  //   const priority = url.priority ?? 0.5;
  //   const key = priority >= 0.8 ? 'high' : priority >= 0.5 ? 'medium' : 'low';
  //   acc[key] = (acc[key] || 0) + 1;
  //   return acc;
  // }, {} as Record<string, number>);
  
  // Calculate additional statistics
  const recentUrls = urls.filter(url => {
    if (!url.lastmod) return false;
    const lastMod = new Date(url.lastmod);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return lastMod > thirtyDaysAgo;
  }).length;
  
  // Calculate change frequency groups (currently unused but may be needed later)
  // const changeFreqGroups = urls.reduce((acc, url) => {
  //   const freq = url.changefreq || 'unknown';
  //   acc[freq] = (acc[freq] || 0) + 1;
  //   return acc;
  // }, {} as Record<string, number>);
  
  const avgDepth = urls.length > 0 ? 
    urls.reduce((sum, url) => {
      const pathParts = new URL(url.loc).pathname.split('/').filter(Boolean);
      return sum + pathParts.length;
    }, 0) / urls.length : 0;

  // Stat cards configuration
  const statCards = [
    {
      icon: Globe,
      label: 'Total Pages',
      value: urls.length.toLocaleString(),
      description: 'discovered in your sitemap'
    },
    {
      icon: FolderTree,
      label: 'Depth Levels',
      value: stats.maxDepth.toString(),
      description: 'of site hierarchy'
    },
    {
      icon: BarChart3,
      label: 'Average Depth',
      value: avgDepth.toFixed(1),
      description: 'pages from homepage'
    },
    {
      icon: Activity,
      label: 'Recent Updates',
      value: recentUrls.toString(),
      description: 'in the last 30 days'
    }
  ].filter(card => {
    // Only show Recent Updates if there are any
    if (card.label === 'Recent Updates' && recentUrls === 0) {
      return false;
    }
    return true;
  });

  return (
    <section className="space-y-8 animate-fade-in" aria-label="Sitemap statistics">
      {/* Domains section if multiple */}
      {uniqueDomains.size > 1 && (
        <div className="bg-primary-pink/5 rounded-lg p-4 border border-primary-pink/20">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-primary-pink" />
            <p className="text-sm font-semibold text-gray-900">
              {uniqueDomains.size} domains detected
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from(uniqueDomains).slice(0, 5).map(domain => (
              <span key={domain} className="text-xs bg-white px-3 py-1 rounded-full text-gray-600 border border-gray-200">
                {domain}
              </span>
            ))}
            {uniqueDomains.size > 5 && (
              <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-500">
                +{uniqueDomains.size - 5} more
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div 
              key={card.label}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:border-primary-pink/30"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 bg-primary-pink/10 rounded-lg">
                  <Icon className="h-5 w-5 text-primary-pink" aria-hidden="true" />
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900">
                  {card.value}
                </p>
                <p className="text-sm font-medium text-gray-600">
                  {card.label}
                </p>
                <p className="text-xs text-gray-500">
                  {card.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
    </section>
  );
};

export default SitemapStats;