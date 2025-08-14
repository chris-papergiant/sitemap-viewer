import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'small' | 'normal' | 'large';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'normal' }) => {
  const sizeClasses = {
    small: 'h-8 w-8',
    normal: 'h-10 w-10',
    large: 'h-16 w-16'
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      className={`${sizeClasses[size]} ${className}`}
      role="img"
      aria-labelledby="logo-title logo-desc"
    >
      <title id="logo-title">Sitemap brand mark</title>
      <desc id="logo-desc">Minimal mark of three nodes connected by a branching line inside a rounded square.</desc>

      {/* Badge */}
      <rect x="4" y="4" width="56" height="56" rx="14" ry="14"
            fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>

      {/* Connections */}
      <path d="M32 24v8M32 32h-12M32 32h12M20 32v8M44 32v8"
            fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>

      {/* Nodes */}
      <circle cx="32" cy="20" r="3" fill="currentColor"/>
      <circle cx="20" cy="44" r="3" fill="currentColor"/>
      <circle cx="44" cy="44" r="3" fill="currentColor"/>
    </svg>
  );
};

export default Logo;