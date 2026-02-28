import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { TreeNode } from '../../utils/treeBuilder';
import { ZoomIn, ZoomOut, Maximize2, Home, Image, FileDown } from 'lucide-react';
import { exportSVG, exportPNG } from '../../utils/exportUtils';

interface GraphViewProps {
  data: TreeNode;
  searchQuery?: string;
  siteName?: string;
}

const GraphView: React.FC<GraphViewProps> = ({ data, searchQuery, siteName = 'sitemap' }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 600 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const zoomRef = useRef<any>(null);

  useEffect(() => {
    const handleResize = () => {
      const container = svgRef.current?.parentElement;
      if (container) {
        setDimensions({
          width: container.clientWidth - 32, // Account for padding
          height: Math.min(600, window.innerHeight - 300)
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 120, bottom: 20, left: 120 };
    const width = dimensions.width - margin.right - margin.left;
    const height = dimensions.height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    const treeLayout = d3.tree<TreeNode>()
      .size([height, width]);

    const root = d3.hierarchy(data);
    const treeData = treeLayout(root);

    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    // Helper function to check if node matches search
    const matchesSearch = (node: any) => {
      if (!searchQuery) return false;
      const query = searchQuery.toLowerCase();
      return node.data.name.toLowerCase().includes(query) || 
             node.data.path.toLowerCase().includes(query);
    };

    // Draw links
    g.selectAll('.link')
      .data(treeData.links())
      .enter().append('path')
      .attr('class', 'link')
      .attr('d', d3.linkHorizontal<any, any>()
        .x(d => d.y)
        .y(d => d.x))
      .style('stroke', d => {
        if (searchQuery && (matchesSearch(d.source) || matchesSearch(d.target))) {
          return '#DB1B5C'; // Pink for search matches
        }
        return '#ccc';
      })
      .style('stroke-width', d => {
        if (searchQuery && (matchesSearch(d.source) || matchesSearch(d.target))) {
          return 2;
        }
        return 1.5;
      });

    const node = g.selectAll('.node')
      .data(treeData.descendants())
      .enter().append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.y},${d.x})`);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Draw node circles
    node.append('circle')
      .attr('r', d => {
        if (matchesSearch(d)) return 8;
        return 6;
      })
      .style('fill', d => {
        if (matchesSearch(d)) return '#DB1B5C'; // Pink for search matches
        return d.depth === 0 ? '#DB1B5C' : colorScale(String(d.depth));
      })
      .style('stroke', d => {
        if (matchesSearch(d)) return '#BE185D';
        return '#DB1B5C';
      })
      .style('stroke-width', d => {
        if (matchesSearch(d)) return 2;
        return 1.5;
      })
      .style('cursor', 'pointer')
      .on('click', (_event, d: any) => {
        if (d.data.data?.loc) {
          window.open(d.data.data.loc, '_blank');
        }
      })
      .on('mouseover', (event, d: any) => {
        tooltip.transition()
          .duration(200)
          .style('opacity', .9);
        
        const tooltipContent = `
          <strong>${d.data.name}</strong><br/>
          ${d.data.data?.loc ? `<span style="font-size: 11px;">URL: ${d.data.data.loc}</span><br/>` : ''}
          ${d.data.data?.lastmod ? `Last Modified: ${new Date(d.data.data.lastmod).toLocaleDateString()}<br/>` : ''}
          ${d.data.data?.changefreq ? `Change Frequency: ${d.data.data.changefreq}<br/>` : ''}
          ${d.data.data?.priority !== undefined ? `Priority: ${d.data.data.priority}` : ''}
        `;
        
        tooltip.html(tooltipContent)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });

    // Draw node labels
    node.append('text')
      .attr('dy', '.35em')
      .attr('x', d => d.children ? -13 : 13)
      .style('text-anchor', d => d.children ? 'end' : 'start')
      .text(d => d.data.name)
      .style('font-size', d => {
        if (matchesSearch(d)) return '14px';
        return '12px';
      })
      .style('font-weight', d => {
        if (matchesSearch(d)) return 'bold';
        return 'normal';
      })
      .style('fill', d => {
        if (matchesSearch(d)) return '#BE185D';
        return '#333';
      });

    // Highlight search matches
    if (searchQuery) {
      const matches = treeData.descendants().filter(matchesSearch);
      if (matches.length > 0) {
        // Auto-zoom to show first match
        const firstMatch = matches[0];
        const scale = 1.5;
        svg.transition()
          .duration(750)
          .call(
            zoom.transform,
            d3.zoomIdentity
              .translate(dimensions.width / 2, dimensions.height / 2)
              .scale(scale)
              .translate(-firstMatch.y, -firstMatch.x)
          );
      }
    }

    return () => {
      tooltip.remove();
    };
  }, [data, dimensions, searchQuery]);

  const handleZoom = (direction: 'in' | 'out' | 'reset' | 'fit') => {
    if (!svgRef.current || !zoomRef.current) return;
    
    const svg = d3.select(svgRef.current);
    
    switch (direction) {
      case 'in':
        svg.transition().duration(300).call(zoomRef.current.scaleBy, 1.3);
        break;
      case 'out':
        svg.transition().duration(300).call(zoomRef.current.scaleBy, 0.7);
        break;
      case 'reset':
        svg.transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity);
        break;
      case 'fit':
        // Calculate bounds and fit to view
        const bounds = (svgRef.current.querySelector('g') as SVGGElement)?.getBBox();
        if (bounds) {
          const fullWidth = dimensions.width;
          const fullHeight = dimensions.height;
          const width = bounds.width;
          const height = bounds.height;
          const midX = bounds.x + width / 2;
          const midY = bounds.y + height / 2;
          const scale = 0.9 / Math.max(width / fullWidth, height / fullHeight);
          svg.transition().duration(750).call(
            zoomRef.current.transform,
            d3.zoomIdentity
              .translate(fullWidth / 2, fullHeight / 2)
              .scale(scale)
              .translate(-midX, -midY)
          );
        }
        break;
    }
  };

  return (
    <div className="bg-white relative">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Network Graph</h3>
        <p className="text-sm text-gray-500">Interactive map of your site structure. Drag to pan, scroll to zoom, click a node to open the page.</p>
      </div>
      <div className="relative">
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
        <button
          onClick={() => handleZoom('in')}
          className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom('out')}
          className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom('fit')}
          className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm"
          title="Fit to View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom('reset')}
          className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm"
          title="Reset Zoom"
        >
          <Home className="w-4 h-4" />
        </button>

        <div className="border-t border-gray-200 my-1" />

        <button
          onClick={() => {
            if (svgRef.current) {
              const safeName = siteName.replace(/[^a-z0-9]/gi, '_');
              exportSVG(svgRef.current, `${safeName}_graph.svg`);
            }
          }}
          className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm"
          title="Export as SVG"
        >
          <FileDown className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            if (svgRef.current) {
              const safeName = siteName.replace(/[^a-z0-9]/gi, '_');
              exportPNG(svgRef.current, `${safeName}_graph.png`);
            }
          }}
          className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm"
          title="Export as PNG"
        >
          <Image className="w-4 h-4" />
        </button>
      </div>
      
      <div className="absolute bottom-4 left-4 z-10 text-xs text-gray-600 bg-white px-2 py-1 rounded border border-gray-200">
        Zoom: {Math.round(zoomLevel * 100)}%
      </div>
      
      <div className="p-4 sm:p-6">
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="border border-gray-200 rounded"
        />
      </div>
      </div>
    </div>
  );
};

export default GraphView;