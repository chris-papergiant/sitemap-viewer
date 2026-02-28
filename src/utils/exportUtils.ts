import { TreeNode } from './treeBuilder';
import { SitemapEntry } from './sitemapParser';

/**
 * Clones an SVG element, inlines critical styles, and adds a white background
 * for clean export output.
 */
function prepareSVGForExport(svgElement: SVGSVGElement): SVGSVGElement {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;

  // Add white background rect as first child
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('width', '100%');
  bg.setAttribute('height', '100%');
  bg.setAttribute('fill', 'white');
  clone.insertBefore(bg, clone.firstChild);

  // Inline computed styles on key elements
  const sourceNodes = svgElement.querySelectorAll('path, circle, text, line, rect');
  const cloneNodes = clone.querySelectorAll('path, circle, text, line, rect');

  sourceNodes.forEach((source, i) => {
    const target = cloneNodes[i];
    if (!target) return;
    const computed = window.getComputedStyle(source);
    const important = ['fill', 'stroke', 'stroke-width', 'font-size', 'font-weight', 'font-family', 'text-anchor', 'opacity'];
    important.forEach(prop => {
      const value = computed.getPropertyValue(prop);
      if (value) {
        (target as SVGElement).style.setProperty(prop, value);
      }
    });
  });

  // Remove tooltip elements
  clone.querySelectorAll('.tooltip').forEach(el => el.remove());

  // Set explicit dimensions
  const width = svgElement.getAttribute('width') || svgElement.viewBox?.baseVal?.width?.toString() || '1200';
  const height = svgElement.getAttribute('height') || svgElement.viewBox?.baseVal?.height?.toString() || '600';
  clone.setAttribute('width', width);
  clone.setAttribute('height', height);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  return clone;
}

/**
 * Triggers a file download in the browser.
 */
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Exports the graph view SVG as a downloadable .svg file.
 */
export function exportSVG(svgElement: SVGSVGElement, filename: string) {
  const prepared = prepareSVGForExport(svgElement);
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(prepared);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  triggerDownload(blob, filename);
}

/**
 * Exports the graph view SVG as a high-DPI PNG image.
 */
export function exportPNG(svgElement: SVGSVGElement, filename: string, scale: number = 2): Promise<void> {
  return new Promise((resolve, reject) => {
    const prepared = prepareSVGForExport(svgElement);
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(prepared);

    const width = parseInt(prepared.getAttribute('width') || '1200', 10);
    const height = parseInt(prepared.getAttribute('height') || '600', 10);

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.scale(scale, scale);
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (blob) {
          triggerDownload(blob, filename);
          resolve();
        } else {
          reject(new Error('Failed to create PNG blob'));
        }
      }, 'image/png');
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG for PNG conversion'));
    };

    img.src = url;
  });
}

/**
 * Exports tree data as a JSON file with metadata.
 */
export function exportJSON(
  treeData: TreeNode,
  urls: SitemapEntry[],
  domain: string
) {
  const timestamp = new Date().toISOString();
  const payload = {
    metadata: {
      domain,
      exportedAt: timestamp,
      totalUrls: urls.length,
    },
    tree: treeData,
    urls,
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const safeDomain = domain.replace(/[^a-z0-9]/gi, '_');
  const date = timestamp.split('T')[0];
  triggerDownload(blob, `${safeDomain}_sitemap_${date}.json`);
}

/**
 * Copies the current page URL to the clipboard and returns success status.
 */
export async function copyShareLink(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(window.location.href);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = window.location.href;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}
