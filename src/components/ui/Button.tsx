/**
 * Paper Giant Button Component
 * A comprehensive, accessible button component that leverages the new CSS system
 */

import React, { forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'vibrant';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  /** Button visual variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Whether button is in loading state */
  loading?: boolean;
  /** Icon to display before text */
  iconLeft?: React.ReactNode;
  /** Icon to display after text */
  iconRight?: React.ReactNode;
  /** Whether this is an icon-only button */
  iconOnly?: boolean;
  /** Whether button should be full width on mobile */
  fullWidthMobile?: boolean;
  /** Custom CSS class names */
  className?: string;
  /** Button content */
  children?: React.ReactNode;
  /** Whether to render as a link */
  asLink?: boolean;
  /** Link href when asLink is true */
  href?: string;
  /** Link target when asLink is true */
  target?: string;
  /** Link rel when asLink is true */
  rel?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
}

/**
 * Button component that provides consistent styling and behavior
 * Uses the new CSS custom property system for easy theming
 */
export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  iconLeft,
  iconRight,
  iconOnly = false,
  fullWidthMobile = false,
  className = '',
  children,
  disabled,
  asLink = false,
  href,
  target,
  rel,
  style,
  type = 'button',
  ...props
}, ref) => {
  // Build CSS classes
  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    iconLeft && 'btn-icon-left',
    iconRight && 'btn-icon-right',
    iconOnly && 'btn-icon-only',
    loading && 'btn-loading',
    fullWidthMobile && 'btn-mobile-full',
    className
  ].filter(Boolean).join(' ');

  // Handle loading state
  const isDisabled = disabled || loading;
  
  // Icon sizing based on button size
  const getIconSize = () => {
    switch (size) {
      case 'sm': return { width: 16, height: 16 };
      case 'lg': return { width: 20, height: 20 };
      case 'xl': return { width: 24, height: 24 };
      default: return { width: 18, height: 18 };
    }
  };

  const iconSize = getIconSize();

  // Render icons with consistent sizing
  const renderIcon = (icon: React.ReactNode) => {
    if (!icon) return null;
    
    // If it's already a React element, clone with size props
    if (React.isValidElement(icon)) {
      return React.cloneElement(icon, {
        ...iconSize,
        'aria-hidden': true,
        ...icon.props
      });
    }
    
    return icon;
  };

  // Button content
  const content = (
    <>
      {iconLeft && renderIcon(iconLeft)}
      {!iconOnly && children && <span>{children}</span>}
      {iconRight && renderIcon(iconRight)}
    </>
  );

  // Render as link if requested
  if (asLink && href) {
    return (
      <a
        ref={ref as React.ForwardedRef<HTMLAnchorElement>}
        href={href}
        target={target}
        rel={rel}
        className={classes}
        style={style}
        aria-disabled={isDisabled}
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {content}
      </a>
    );
  }

  // Render as button
  return (
    <button
      ref={ref as React.ForwardedRef<HTMLButtonElement>}
      type={type}
      disabled={isDisabled}
      className={classes}
      style={style}
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {content}
    </button>
  );
});

Button.displayName = 'Button';

/**
 * Convenience components for common button patterns
 */

export const PrimaryButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>((props, ref) => (
  <Button ref={ref} variant="primary" {...props} />
));
PrimaryButton.displayName = 'PrimaryButton';

export const SecondaryButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>((props, ref) => (
  <Button ref={ref} variant="secondary" {...props} />
));
SecondaryButton.displayName = 'SecondaryButton';

export const GhostButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>((props, ref) => (
  <Button ref={ref} variant="ghost" {...props} />
));
GhostButton.displayName = 'GhostButton';

export const DangerButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>((props, ref) => (
  <Button ref={ref} variant="danger" {...props} />
));
DangerButton.displayName = 'DangerButton';

export const SuccessButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>((props, ref) => (
  <Button ref={ref} variant="success" {...props} />
));
SuccessButton.displayName = 'SuccessButton';

export const VibrantButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>((props, ref) => (
  <Button ref={ref} variant="vibrant" {...props} />
));
VibrantButton.displayName = 'VibrantButton';

export default Button;