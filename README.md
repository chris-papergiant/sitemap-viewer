# Sitemap Visualizer

A web-based tool to fetch and visualize XML sitemaps from any URL, displaying the site structure as an interactive tree diagram.

## Features

- **Fetch Sitemaps**: Enter any website URL to fetch its sitemap
- **Interactive Visualization**: D3.js-powered tree visualization with:
  - Collapsible nodes
  - Zoom and pan controls
  - Click to open URLs in new tab
  - Hover for URL details (lastmod, changefreq, priority)
  - Color-coded nodes by depth level
- **Sitemap Statistics**: View total URLs, max depth, domains, and priority distribution
- **Nested Sitemap Support**: Automatically handles sitemap index files
- **CORS Proxy**: Built-in proxy to handle cross-origin requests

## Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

1. Start the development server with `npm run dev`
2. Open http://localhost:5173 in your browser
3. Enter a website URL in the input field:
   - Example: `https://example.com`
   - Or direct sitemap: `example.com/sitemap.xml`
4. Click "Visualize" to fetch and display the sitemap
5. Interact with the visualization:
   - Click nodes to open URLs
   - Hover for details
   - Use mouse to pan and zoom
   - Click "Reset Zoom" to return to default view

## Technology Stack

- **React** with TypeScript
- **Vite** for fast development and building
- **D3.js** for interactive tree visualization
- **Tailwind CSS** for styling
- **fast-xml-parser** for XML parsing
- **CORS proxy** for cross-origin sitemap fetching

## Project Structure

```
sitemap-viewer/
├── src/
│   ├── components/
│   │   ├── SitemapFetcher.tsx    # URL input component
│   │   ├── SitemapVisualizer.tsx # D3.js tree visualization
│   │   └── SitemapStats.tsx      # Statistics display
│   ├── utils/
│   │   ├── sitemapParser.ts      # XML parsing logic
│   │   └── treeBuilder.ts        # Tree data structure builder
│   ├── App.tsx                   # Main application
│   └── main.tsx                  # Entry point
├── public/                       # Static assets
└── package.json                  # Dependencies
```

## Browser Compatibility

Works on all modern browsers that support ES6+ and SVG.