# Button System Migration Guide

## Overview

The sitemap viewer has been refactored to use a new, simplified button system that eliminates CSS specificity conflicts and makes styling changes trivial. This guide will help you understand the new system and migrate any remaining components.

## What Changed

### Before (Old System)
```tsx
// Complex Tailwind utilities scattered across components
<button className="bg-primary-pink hover:bg-primary-pink-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-pink/20">
  Submit
</button>

// Inconsistent CSS classes with !important declarations
.btn-primary {
  background-color: #000000 !important;
  color: #ffffff !important;
  font-weight: 700 !important;
}
```

### After (New System)
```tsx
// Clean, semantic component with predictable behavior
import { Button } from './components/ui/Button';

<Button variant="primary" size="lg">
  Submit
</Button>

// Easy theme customization via CSS custom properties
:root {
  --btn-primary-bg: #your-color;
  --btn-primary-bg-hover: #your-hover-color;
}
```

## Benefits

1. **No More Specificity Wars**: CSS custom properties eliminate `!important` declarations
2. **Easy Color Changes**: Update a few CSS variables to change the entire theme
3. **Consistent API**: All buttons use the same predictable component interface
4. **Better Accessibility**: Built-in ARIA support and keyboard navigation
5. **Responsive by Default**: Mobile-friendly touch targets and responsive sizing

## Button Component API

### Basic Usage

```tsx
import { Button } from './components/ui/Button';

// Primary button (default)
<Button>Primary Action</Button>

// Different variants
<Button variant="secondary">Secondary Action</Button>
<Button variant="ghost">Ghost Button</Button>
<Button variant="danger">Delete</Button>
<Button variant="success">Save</Button>
<Button variant="vibrant">Paper Giant Special</Button>
```

### With Icons

```tsx
import { Search, Download, X } from 'lucide-react';

// Icon with text
<Button iconLeft={<Search />}>Search</Button>
<Button iconRight={<Download />}>Download</Button>

// Icon only
<Button iconOnly iconLeft={<X />} aria-label="Close" />
```

### Sizes

```tsx
<Button size="sm">Small</Button>
<Button size="md">Medium (default)</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>
```

### Loading State

```tsx
<Button loading={isSubmitting}>
  {isSubmitting ? 'Submitting...' : 'Submit'}
</Button>
```

### As Link

```tsx
<Button asLink href="/path" target="_blank">
  Visit Link
</Button>
```

## Available Variants

| Variant | Use Case | Visual Style |
|---------|----------|--------------|
| `primary` | Main actions | Dark background, white text |
| `secondary` | Secondary actions | Light background, border |
| `ghost` | Subtle actions | Transparent, hover effects |
| `danger` | Destructive actions | Red background |
| `success` | Positive actions | Green background |
| `vibrant` | Paper Giant special | Gradient background |

## Migration Steps

### 1. Update Imports

Replace old button imports with the new component:

```tsx
// Remove these if you have them
// import { Button as OldButton } from './old-location';

// Add this
import { Button } from './components/ui/Button';
```

### 2. Replace Button Elements

**Old:**
```tsx
<button className="btn btn-primary btn-lg">
  Submit
</button>
```

**New:**
```tsx
<Button variant="primary" size="lg">
  Submit
</Button>
```

### 3. Convert CSS Classes

| Old Class | New Variant |
|-----------|-------------|
| `btn-primary` | `variant="primary"` |
| `btn-secondary` | `variant="secondary"` |
| `btn-ghost` | `variant="ghost"` |
| `btn-vibrant` | `variant="vibrant"` |
| `btn-lg` | `size="lg"` |
| `btn-xl` | `size="xl"` |

### 4. Handle Icons

**Old:**
```tsx
<button className="btn btn-ghost">
  <Search className="h-4 w-4 mr-2" />
  Search
</button>
```

**New:**
```tsx
<Button variant="ghost" iconLeft={<Search />}>
  Search
</Button>
```

### 5. Loading States

**Old:**
```tsx
<button className="btn btn-primary" disabled={loading}>
  {loading && <Spinner className="mr-2" />}
  {loading ? 'Loading...' : 'Submit'}
</button>
```

**New:**
```tsx
<Button variant="primary" loading={loading}>
  {loading ? 'Loading...' : 'Submit'}
</Button>
```

## Theming System

### Basic Theme Change

Change button colors across your entire app:

```css
:root {
  /* Change primary button color */
  --btn-primary-bg: #your-brand-color;
  --btn-primary-bg-hover: #your-brand-color-darker;
  
  /* Change secondary button */
  --btn-secondary-color: #your-brand-color;
  --btn-secondary-border-hover: #your-brand-color;
}
```

### Theme Classes

Apply different themes to sections of your app:

```tsx
// Dark mode section
<div className="theme-dark">
  <Button variant="primary">Dark Theme Button</Button>
</div>

// Vibrant section
<div className="theme-vibrant">
  <Button variant="primary">Vibrant Theme Button</Button>
</div>
```

### Available Themes

- `theme-dark` - Dark mode optimized
- `theme-vibrant` - Enhanced Paper Giant colors
- `theme-minimal` - Understated, clean
- `theme-glass` - Modern glassmorphism
- `theme-high-contrast` - WCAG AAA compliant

## CSS Custom Properties Reference

### Structure Properties
```css
--btn-font-family: Font family for buttons
--btn-font-weight: Default font weight
--btn-transition: Transition timing
--btn-border-width: Border thickness
--btn-focus-ring: Focus ring style
```

### Size Properties
```css
--btn-padding-sm: Small button padding
--btn-padding-md: Medium button padding
--btn-padding-lg: Large button padding
--btn-height-sm: Small button height
--btn-height-md: Medium button height
--btn-height-lg: Large button height
```

### Variant Properties (per variant)
```css
--btn-{variant}-bg: Background color
--btn-{variant}-bg-hover: Hover background
--btn-{variant}-color: Text color
--btn-{variant}-color-hover: Hover text color
--btn-{variant}-border: Border color
--btn-{variant}-border-hover: Hover border color
--btn-{variant}-shadow: Box shadow
--btn-{variant}-shadow-hover: Hover shadow
```

## Best Practices

### 1. Use Semantic Variants
```tsx
// Good - semantic meaning
<Button variant="danger" onClick={handleDelete}>Delete</Button>

// Avoid - color-based naming
<Button className="red-button" onClick={handleDelete}>Delete</Button>
```

### 2. Consistent Icon Sizing
Icons are automatically sized by the component. Don't override sizes unless necessary.

```tsx
// Good - let component handle sizing
<Button iconLeft={<Search />}>Search</Button>

// Avoid - manual sizing
<Button iconLeft={<Search className="w-4 h-4" />}>Search</Button>
```

### 3. Accessibility
Always provide accessible labels for icon-only buttons:

```tsx
// Good
<Button iconOnly iconLeft={<X />} aria-label="Close dialog" />

// Bad
<Button iconOnly iconLeft={<X />} />
```

### 4. Loading States
Use the built-in loading prop instead of custom implementations:

```tsx
// Good
<Button loading={isSubmitting}>Submit</Button>

// Avoid
<Button disabled={isSubmitting}>
  {isSubmitting && <Spinner />}
  Submit
</Button>
```

## Common Patterns

### Button Groups
```tsx
<div className="flex gap-2">
  <Button variant="secondary">Cancel</Button>
  <Button variant="primary">Save</Button>
</div>
```

### Form Actions
```tsx
<div className="flex justify-end gap-3 mt-6">
  <Button variant="ghost" onClick={onCancel}>
    Cancel
  </Button>
  <Button variant="primary" type="submit" loading={isSubmitting}>
    {isSubmitting ? 'Saving...' : 'Save Changes'}
  </Button>
</div>
```

### Navigation
```tsx
<Button
  variant="ghost"
  iconLeft={<ArrowLeft />}
  onClick={() => router.back()}
>
  Back
</Button>
```

## Troubleshooting

### Button Not Styling Correctly
1. Check if CSS files are imported in correct order
2. Verify you're using the new Button component, not old `<button>` elements
3. Check for CSS specificity conflicts from old styles

### Theme Not Applying
1. Ensure theme class is applied to a parent element
2. Check CSS custom property names are correct
3. Verify CSS imports are in the right order

### Icons Not Sizing
1. Let the component handle icon sizing automatically
2. For custom sizes, use the `className` prop sparingly
3. Ensure you're passing icons as `iconLeft` or `iconRight` props

### TypeScript Errors
1. Update imports to use the new Button component
2. Check variant and size prop values match the defined types
3. Ensure icon props are React elements, not strings

## Migration Checklist

- [ ] Import new Button component in all files
- [ ] Replace all `<button className="btn*">` with `<Button variant="*">`
- [ ] Update icon implementations to use `iconLeft`/`iconRight` props
- [ ] Convert size classes to `size` prop
- [ ] Replace loading implementations with `loading` prop
- [ ] Test all button interactions and visual states
- [ ] Update any custom CSS that targets old button classes
- [ ] Verify accessibility with screen readers
- [ ] Test responsive behavior on mobile devices

## Need Help?

If you encounter issues during migration:

1. Check this guide first
2. Look at existing migrated components for examples
3. Test in isolation to identify the specific issue
4. Check browser dev tools for CSS conflicts

The new system is designed to be simpler and more predictable. Most issues arise from mixing old and new approaches.