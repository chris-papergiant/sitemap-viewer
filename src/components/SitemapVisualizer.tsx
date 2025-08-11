import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { TreeNode } from '../utils/treeBuilder';

interface SitemapVisualiserProps {
  data: TreeNode;
}

const SitemapVisualiser: React.FC<SitemapVisualiserProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  useEffect(() => {
    const handleResize = () => {
      const container = svgRef.current?.parentElement;
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: Math.max(600, window.innerHeight - 400)
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
      });

    svg.call(zoom);

    const treeLayout = d3.tree<TreeNode>()
      .size([height, width]);

    const root = d3.hierarchy(data);
    const treeData = treeLayout(root);

    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    g.selectAll('.link')
      .data(treeData.links())
      .enter().append('path')
      .attr('class', 'link')
      .attr('d', d3.linkHorizontal<any, any>()
        .x(d => d.y)
        .y(d => d.x));

    const node = g.selectAll('.node')
      .data(treeData.descendants())
      .enter().append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.y},${d.x})`);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    node.append('circle')
      .attr('r', 6)
      .style('fill', d => colorScale(String(d.depth)))
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
          ${d.data.data?.loc ? `URL: ${d.data.data.loc}<br/>` : ''}
          ${d.data.data?.lastmod ? `Last Modified: ${d.data.data.lastmod}<br/>` : ''}
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

    node.append('text')
      .attr('dy', '.35em')
      .attr('x', d => d.children ? -13 : 13)
      .style('text-anchor', d => d.children ? 'end' : 'start')
      .text(d => d.data.name)
      .style('font-size', '12px')
      .style('fill', '#333');

    const resetButton = d3.select(svgRef.current.parentElement)
      .append('button')
      .attr('class', 'absolute top-4 right-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700')
      .text('Reset Zoom')
      .on('click', () => {
        svg.transition()
          .duration(750)
          .call(zoom.transform, d3.zoomIdentity);
      });

    return () => {
      tooltip.remove();
      resetButton.remove();
    };
  }, [data, dimensions]);

  return (
    <div className="relative bg-white rounded-lg shadow-lg p-4">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="border border-gray-200 rounded"
      />
    </div>
  );
};

export default SitemapVisualiser;