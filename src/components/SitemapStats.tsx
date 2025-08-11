import React from 'react';
import { TreeNode, getTreeStats } from '../utils/treeBuilder';
import { SitemapEntry } from '../utils/sitemapParser';
import { Globe, Layers, MapPin, TrendingUp, Clock, AlertTriangle } from 'lucide-react';

interface SitemapStatsProps {
  treeData: TreeNode | null;
  urls: SitemapEntry[];
}

const SitemapStats: React.FC<SitemapStatsProps> = ({ treeData, urls }) => {
  if (!treeData) return null;

  const stats = getTreeStats(treeData);
  const uniqueDomains = new Set(urls.map(url => new URL(url.loc).hostname));
  
  const priorityGroups = urls.reduce((acc, url) => {
    const priority = url.priority ?? 0.5;
    const key = priority >= 0.8 ? 'high' : priority >= 0.5 ? 'medium' : 'low';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate additional statistics
  const recentUrls = urls.filter(url => {
    if (!url.lastmod) return false;
    const lastMod = new Date(url.lastmod);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return lastMod > thirtyDaysAgo;
  }).length;
  
  const changeFreqGroups = urls.reduce((acc, url) => {
    const freq = url.changefreq || 'unknown';
    acc[freq] = (acc[freq] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const avgDepth = urls.length > 0 ? 
    urls.reduce((sum, url) => {
      const pathParts = new URL(url.loc).pathname.split('/').filter(Boolean);
      return sum + pathParts.length;
    }, 0) / urls.length : 0;

  // Stat cards configuration
  const statCards = [
    {
      icon: Globe,
      label: 'Total URLs',
      value: urls.length.toLocaleString(),
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-200',
      description: 'Pages in sitemap'
    },
    {
      icon: Layers,
      label: 'Max Depth',
      value: stats.maxDepth.toString(),
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-50',
      borderColor: 'border-secondary-200',
      description: 'Deepest page level'
    },
    {
      icon: MapPin,
      label: 'Domains',
      value: uniqueDomains.size.toString(),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      description: 'Unique domains found'
    },
    {
      icon: TrendingUp,
      label: 'Avg Depth',
      value: avgDepth.toFixed(1),
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      description: 'Average page depth'
    }
  ];

  return (
    <section className="space-y-8 animate-fade-in" aria-label="Sitemap statistics">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-r from-accent-500 to-warning-500 p-2 rounded-xl">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gradient-rainbow">Analytics Overview</h2>
          </div>
          <p className="text-lg text-gray-700 font-medium ml-11">
            Discover powerful insights and patterns in your sitemap structure
          </p>
        </div>
        
        {recentUrls > 0 && (
          <div className="status-badge-success flex items-center space-x-2 px-5 py-3 shadow-medium animate-pulse-glow">
            <div className="bg-success-500 p-1.5 rounded-full">
              <Clock className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <span className="text-base font-bold">{recentUrls}</span>
            <span className="text-success-700 font-semibold">recently updated</span>
          </div>
        )}
      </div>
      
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div 
              key={card.label}
              className={`
                relative group card-gradient p-8 hover:shadow-rainbow transition-all duration-300 transform hover:scale-105
                animate-slide-up overflow-hidden
              `}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
                <div className={`w-full h-full bg-gradient-to-bl ${card.color.replace('text-', 'from-').replace('-600', '-400')} to-transparent rounded-full blur-2xl`} />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${card.bgColor.replace('bg-', 'from-').replace('-50', '-100')} ${card.bgColor.replace('bg-', 'to-').replace('-50', '-200')} shadow-medium group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-6 w-6 ${card.color} group-hover:animate-wiggle`} aria-hidden="true" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-600 uppercase tracking-wider">{card.label}</p>
                    <p className={`text-4xl font-black ${card.color} group-hover:text-gradient transition-all duration-300`}>{card.value}</p>
                  </div>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/80">
                  <p className="text-sm font-semibold text-gray-700">{card.description}</p>
                </div>
              </div>
              
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
            </div>
          );
        })}
      </div>
      
    </section>
  );
};

export default SitemapStats;