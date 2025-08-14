/**
 * Button Examples and Testing Component
 * Use this component to test all button variants and states
 * Can be used as a style guide or for visual regression testing
 */

import React, { useState } from 'react';
import { Button } from './Button';
import { Search, Download, X, Heart, Settings, ArrowLeft, Check, AlertTriangle } from 'lucide-react';

const ButtonExamples: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const simulateLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-12">
      <div>
        <h1 className="text-3xl font-serif mb-4">Paper Giant Button System</h1>
        <p className="text-neutral-600 mb-8">
          A comprehensive button system built with CSS custom properties for easy theming and maintenance.
        </p>
      </div>

      {/* Variants */}
      <section>
        <h2 className="text-2xl font-serif mb-6">Button Variants</h2>
        <div className="flex flex-wrap gap-4 mb-6">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="success">Success</Button>
          <Button variant="vibrant">Vibrant</Button>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg">
          <code className="text-sm">
            {`<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>`}
          </code>
        </div>
      </section>

      {/* Sizes */}
      <section>
        <h2 className="text-2xl font-serif mb-6">Button Sizes</h2>
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="xl">Extra Large</Button>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg">
          <code className="text-sm">
            {`<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>`}
          </code>
        </div>
      </section>

      {/* With Icons */}
      <section>
        <h2 className="text-2xl font-serif mb-6">Buttons with Icons</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <h3 className="w-full text-lg font-medium">Icon Left</h3>
            <Button iconLeft={<Search />}>Search</Button>
            <Button variant="secondary" iconLeft={<Download />}>Download</Button>
            <Button variant="ghost" iconLeft={<Settings />}>Settings</Button>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <h3 className="w-full text-lg font-medium">Icon Right</h3>
            <Button iconRight={<ArrowLeft />}>Back</Button>
            <Button variant="success" iconRight={<Check />}>Complete</Button>
            <Button variant="danger" iconRight={<AlertTriangle />}>Warning</Button>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <h3 className="w-full text-lg font-medium">Icon Only</h3>
            <Button iconOnly iconLeft={<X />} aria-label="Close" />
            <Button variant="secondary" iconOnly iconLeft={<Heart />} aria-label="Like" />
            <Button variant="ghost" iconOnly iconLeft={<Settings />} aria-label="Settings" />
          </div>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg mt-6">
          <code className="text-sm">
            {`<Button iconLeft={<Search />}>Search</Button>
<Button iconRight={<ArrowLeft />}>Back</Button>
<Button iconOnly iconLeft={<X />} aria-label="Close" />`}
          </code>
        </div>
      </section>

      {/* States */}
      <section>
        <h2 className="text-2xl font-serif mb-6">Button States</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <h3 className="w-full text-lg font-medium">Normal vs Disabled</h3>
            <Button variant="primary">Normal</Button>
            <Button variant="primary" disabled>Disabled</Button>
            <Button variant="secondary">Normal</Button>
            <Button variant="secondary" disabled>Disabled</Button>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <h3 className="w-full text-lg font-medium">Loading State</h3>
            <Button variant="primary" loading={loading} onClick={simulateLoading}>
              {loading ? 'Loading...' : 'Simulate Loading'}
            </Button>
            <Button variant="secondary" loading>
              Loading Secondary
            </Button>
          </div>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg mt-6">
          <code className="text-sm">
            {`<Button disabled>Disabled</Button>
<Button loading={isLoading}>
  {isLoading ? 'Loading...' : 'Submit'}
</Button>`}
          </code>
        </div>
      </section>

      {/* As Links */}
      <section>
        <h2 className="text-2xl font-serif mb-6">Buttons as Links</h2>
        <div className="flex flex-wrap gap-4 mb-6">
          <Button asLink href="#" variant="primary">
            Link Button
          </Button>
          <Button asLink href="#" variant="secondary" target="_blank">
            External Link
          </Button>
          <Button asLink href="#" variant="ghost" iconLeft={<ArrowLeft />}>
            Back Link
          </Button>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg">
          <code className="text-sm">
            {`<Button asLink href="/path" variant="primary">
  Link Button
</Button>
<Button asLink href="/path" target="_blank">
  External Link
</Button>`}
          </code>
        </div>
      </section>

      {/* Theme Examples */}
      <section>
        <h2 className="text-2xl font-serif mb-6">Theme Examples</h2>
        
        {/* Default Theme */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Default Theme</h3>
            <div className="flex flex-wrap gap-4 p-6 bg-white border rounded-lg">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="vibrant">Vibrant</Button>
            </div>
          </div>

          {/* Dark Theme */}
          <div className="theme-dark">
            <h3 className="text-lg font-medium mb-4 text-white">Dark Theme</h3>
            <div className="flex flex-wrap gap-4 p-6 bg-gray-800 rounded-lg">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="vibrant">Vibrant</Button>
            </div>
          </div>

          {/* Vibrant Theme */}
          <div className="theme-vibrant">
            <h3 className="text-lg font-medium mb-4">Vibrant Theme</h3>
            <div className="flex flex-wrap gap-4 p-6 bg-gradient-to-r from-pink-50 to-blue-50 rounded-lg">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="vibrant">Vibrant</Button>
            </div>
          </div>

          {/* Minimal Theme */}
          <div className="theme-minimal">
            <h3 className="text-lg font-medium mb-4">Minimal Theme</h3>
            <div className="flex flex-wrap gap-4 p-6 bg-gray-50 rounded-lg">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="vibrant">Vibrant</Button>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg mt-6">
          <code className="text-sm">
            {`<!-- Apply theme to container -->
<div className="theme-dark">
  <Button variant="primary">Dark Theme Button</Button>
</div>

<!-- Or apply globally -->
<script>
document.documentElement.className = 'theme-vibrant';
</script>`}
          </code>
        </div>
      </section>

      {/* Responsive */}
      <section>
        <h2 className="text-2xl font-serif mb-6">Responsive Behavior</h2>
        <div className="space-y-4">
          <p className="text-neutral-600">
            Buttons automatically adjust for mobile devices with appropriate touch targets.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button fullWidthMobile>Full Width on Mobile</Button>
            <Button variant="secondary">Normal Button</Button>
          </div>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg mt-6">
          <code className="text-sm">
            {`<Button fullWidthMobile>Full Width on Mobile</Button>`}
          </code>
        </div>
      </section>

      {/* Common Patterns */}
      <section>
        <h2 className="text-2xl font-serif mb-6">Common Patterns</h2>
        
        <div className="space-y-8">
          {/* Form Actions */}
          <div>
            <h3 className="text-lg font-medium mb-4">Form Actions</h3>
            <div className="p-6 border rounded-lg">
              <div className="flex justify-end gap-3">
                <Button variant="ghost">Cancel</Button>
                <Button variant="primary">Save Changes</Button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-lg font-medium mb-4">Navigation</h3>
            <div className="p-6 border rounded-lg">
              <div className="flex justify-between items-center">
                <Button variant="ghost" iconLeft={<ArrowLeft />}>
                  Back
                </Button>
                <Button variant="primary" iconRight={<Check />}>
                  Continue
                </Button>
              </div>
            </div>
          </div>

          {/* Action Groups */}
          <div>
            <h3 className="text-lg font-medium mb-4">Action Groups</h3>
            <div className="p-6 border rounded-lg">
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" iconLeft={<Download />}>
                  Download
                </Button>
                <Button variant="ghost" size="sm" iconLeft={<Heart />}>
                  Like
                </Button>
                <Button variant="ghost" size="sm" iconLeft={<Settings />}>
                  Settings
                </Button>
                <Button variant="danger" size="sm" iconLeft={<X />}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg mt-6">
          <code className="text-sm">
            {`<!-- Form Actions -->
<div className="flex justify-end gap-3">
  <Button variant="ghost">Cancel</Button>
  <Button variant="primary">Save Changes</Button>
</div>

<!-- Navigation -->
<Button variant="ghost" iconLeft={<ArrowLeft />}>Back</Button>`}
          </code>
        </div>
      </section>

      {/* Custom Styling */}
      <section>
        <h2 className="text-2xl font-serif mb-6">Custom Styling</h2>
        <div className="space-y-4">
          <p className="text-neutral-600">
            While the button system provides comprehensive variants, you can still customize individual buttons when needed.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button 
              variant="primary" 
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              Custom Gradient
            </Button>
            <Button 
              variant="secondary" 
              className="border-orange-500 text-orange-500 hover:bg-orange-50"
            >
              Custom Colors
            </Button>
          </div>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg mt-6">
          <code className="text-sm">
            {`<Button 
  variant="primary" 
  className="bg-gradient-to-r from-purple-500 to-pink-500"
>
  Custom Gradient
</Button>`}
          </code>
        </div>
      </section>

      {/* Performance Note */}
      <section className="bg-blue-50 p-6 rounded-lg">
        <h2 className="text-lg font-medium mb-2">Performance Benefits</h2>
        <ul className="text-sm text-neutral-700 space-y-1">
          <li>• CSS custom properties eliminate style recalculation</li>
          <li>• Single CSS file reduces bundle size vs scattered Tailwind utilities</li>
          <li>• No runtime JavaScript for styling (unlike CSS-in-JS solutions)</li>
          <li>• Optimized for browser caching and reuse</li>
        </ul>
      </section>
    </div>
  );
};

export default ButtonExamples;