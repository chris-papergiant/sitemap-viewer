/**
 * Paper Giant Component Library
 * Professional, accessible components matching papergiant.net aesthetic
 */

import React from 'react';

// Paper Giant Section Component
interface SectionProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'quaternary';
  size?: 'normal' | 'large';
  className?: string;
}

export const Section: React.FC<SectionProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'normal',
  className = '' 
}) => {
  const baseClasses = 'section';
  const variantClasses = `section-${variant}`;
  const sizeClasses = size === 'large' ? 'section-lg' : '';
  
  return (
    <section className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}>
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </section>
  );
};

// Paper Giant Container Component
interface ContainerProps {
  children: React.ReactNode;
  maxWidth?: 'narrow' | 'normal' | 'wide' | 'full';
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({ 
  children, 
  maxWidth = 'normal',
  className = '' 
}) => {
  const widthClasses = {
    narrow: 'max-w-4xl',
    normal: 'max-w-7xl',
    wide: 'max-w-8xl',
    full: 'max-w-full'
  };
  
  return (
    <div className={`mx-auto px-content-h ${widthClasses[maxWidth]} ${className}`}>
      {children}
    </div>
  );
};

// Paper Giant Typography Components
interface HeadingProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  variant?: 'display' | 'section' | 'card' | 'default';
  className?: string;
}

export const Heading: React.FC<HeadingProps> = ({ 
  children, 
  level = 1, 
  variant = 'default',
  className = '' 
}) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  
  const variantClasses = {
    display: 'text-display',
    section: 'text-section-title',
    card: 'text-card-title',
    default: ''
  };
  
  return (
    <Tag className={`font-serif ${variantClasses[variant]} ${className}`}>
      {children}
    </Tag>
  );
};

interface TextProps {
  children: React.ReactNode;
  variant?: 'body' | 'body-large' | 'caption' | 'small';
  className?: string;
}

export const Text: React.FC<TextProps> = ({ 
  children, 
  variant = 'body',
  className = '' 
}) => {
  const variantClasses = {
    body: 'text-body',
    'body-large': 'text-body-large',
    caption: 'text-sm text-neutral-600 font-body',
    small: 'text-xs text-neutral-500 font-body'
  };
  
  return (
    <p className={`${variantClasses[variant]} ${className}`}>
      {children}
    </p>
  );
};

// Paper Giant Button Components
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'teal';
  size?: 'small' | 'normal' | 'large' | 'xlarge';
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({ 
  children,
  variant = 'primary',
  size = 'normal',
  href,
  onClick,
  disabled = false,
  className = '',
  type = 'button'
}) => {
  const baseClasses = 'btn';
  const variantClasses = `btn-${variant}`;
  const sizeClasses = size === 'large' ? 'btn-lg' : size === 'xlarge' ? 'btn-xl' : '';
  
  const classes = `${baseClasses} ${variantClasses} ${sizeClasses} ${className}`;
  
  if (href) {
    return (
      <a 
        href={href} 
        className={classes}
        aria-disabled={disabled}
      >
        {children}
      </a>
    );
  }
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  );
};

// Paper Giant Card Components
interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'minimal';
  hover?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  variant = 'default',
  hover = false,
  className = '' 
}) => {
  const variantClasses = {
    default: 'card',
    elevated: 'card-elevated',
    minimal: 'card-minimal'
  };
  
  const hoverClasses = hover ? 'hover:transform hover:scale-102 cursor-pointer' : '';
  
  return (
    <div className={`${variantClasses[variant]} ${hoverClasses} ${className}`}>
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={`p-6 border-b border-neutral-100 ${className}`}>
      {children}
    </div>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
};

// Paper Giant Input Components
interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  className?: string;
  size?: 'normal' | 'large';
  label?: string;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  className = '',
  size = 'normal',
  label,
  required = false
}) => {
  const sizeClasses = size === 'large' ? 'input-lg' : '';
  const inputClasses = `input ${sizeClasses} ${className}`;
  
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-body font-medium text-primary-charcoal">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={inputClasses}
      />
    </div>
  );
};

// Paper Giant Status Components
interface StatusBadgeProps {
  children: React.ReactNode;
  variant?: 'active' | 'processing' | 'error' | 'neutral';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  children, 
  variant = 'neutral',
  className = '' 
}) => {
  const variantClasses = `status-${variant}`;
  
  return (
    <span className={`${variantClasses} ${className}`}>
      {children}
    </span>
  );
};

// Paper Giant Separator Component
interface SeparatorProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const Separator: React.FC<SeparatorProps> = ({ 
  className = '', 
  orientation = 'horizontal' 
}) => {
  const orientationClasses = orientation === 'horizontal' 
    ? 'w-full h-px bg-neutral-200' 
    : 'w-px h-full bg-neutral-200';
    
  return <div className={`${orientationClasses} ${className}`} role="separator" />;
};

// Paper Giant Link Component
interface LinkProps {
  children: React.ReactNode;
  href: string;
  variant?: 'default' | 'subtle' | 'prominent';
  external?: boolean;
  className?: string;
}

export const Link: React.FC<LinkProps> = ({ 
  children, 
  href, 
  variant = 'default',
  external = false,
  className = '' 
}) => {
  const variantClasses = {
    default: 'text-primary-charcoal hover:text-neutral-600 transition-colors duration-200',
    subtle: 'text-neutral-600 hover:text-primary-charcoal transition-colors duration-200',
    prominent: 'text-primary-charcoal font-medium hover:text-neutral-600 transition-colors duration-200'
  };
  
  const externalProps = external ? { target: '_blank', rel: 'noopener noreferrer' } : {};
  
  return (
    <a 
      href={href} 
      className={`${variantClasses[variant]} ${className}`}
      {...externalProps}
    >
      {children}
      {external && (
        <svg 
          className="inline w-3 h-3 ml-1" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
          />
        </svg>
      )}
    </a>
  );
};

// Paper Giant Grid System
interface GridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'small' | 'normal' | 'large';
  className?: string;
}

export const Grid: React.FC<GridProps> = ({ 
  children, 
  cols = 1, 
  gap = 'normal',
  className = '' 
}) => {
  const colsClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
    12: 'grid-cols-12'
  };
  
  const gapClasses = {
    small: 'gap-4',
    normal: 'gap-6',
    large: 'gap-8'
  };
  
  return (
    <div className={`grid ${colsClasses[cols]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};

// Paper Giant Logo/Brand Component
interface LogoProps {
  size?: 'small' | 'normal' | 'large';
  variant?: 'dark' | 'light';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'normal', 
  variant = 'dark',
  className = '' 
}) => {
  const sizeClasses = {
    small: 'h-8',
    normal: 'h-12',
    large: 'h-16'
  };
  
  const colorClasses = {
    dark: 'text-primary-charcoal',
    light: 'text-white'
  };
  
  return (
    <div className={`${sizeClasses[size]} ${colorClasses[variant]} ${className}`}>
      <svg 
        className="h-full w-auto" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={1.5} 
          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m-9 9a9 9 0 019-9" 
        />
      </svg>
    </div>
  );
};

// Export all components
export default {
  Section,
  Container,
  Heading,
  Text,
  Button,
  Card,
  CardHeader,
  CardContent,
  Input,
  StatusBadge,
  Separator,
  Link,
  Grid,
  Logo
};