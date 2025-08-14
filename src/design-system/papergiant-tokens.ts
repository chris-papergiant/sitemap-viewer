/**
 * Paper Giant Design System Tokens
 * Based on analysis of papergiant.net design principles
 * Professional, sophisticated, human-centered design approach
 */

// Paper Giant Vibrant Color System
export const paperGiantColors = {
  // Core vibrant brand colors from Paper Giant's actual palette
  primary: {
    // Signature Paper Giant Pink - The key brand color
    pink: {
      50: '#FDF2F8',
      100: '#FCE7F3', 
      200: '#FBCFE8',
      300: '#F9A8D4',
      400: '#F472B6',
      500: '#DB1B5C',  // Paper Giant's signature bright pink
      600: '#BE185D',
      700: '#9D174D',
      800: '#831843',
      900: '#701A34',
      950: '#4C0519',
    },
    
    // Professional dark for text and contrasts
    charcoal: '#292A2C',        // Maintained for readability
    
    // Vibrant supporting colors
    electricBlue: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE', 
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',  // Vibrant blue
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
    },
    
    // Energetic teal 
    vibrantTeal: {
      50: '#F0FDFA',
      100: '#CCFBF1',
      200: '#99F6E4',
      300: '#5EEAD4',
      400: '#2DD4BF',
      500: '#14B8A6',  // Vibrant teal
      600: '#0D9488',
      700: '#0F766E',
      800: '#115E59',
      900: '#134E4A',
    },
    
    white: '#FFFFFF',
    black: '#000000',
  },

  // Extended palette for interface needs
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
    950: '#292A2C',  // Paper Giant's primary dark
  },

  // Vibrant accent colors for energy and personality
  accent: {
    // Energetic purple
    purple: {
      50: '#FAF5FF',
      100: '#F3E8FF',
      200: '#E9D5FF', 
      300: '#D8B4FE',
      400: '#C084FC',
      500: '#A855F7',  // Vibrant purple
      600: '#9333EA',
      700: '#7C3AED',
      800: '#6B21A8',
      900: '#581C87',
    },
    
    // Warm energetic orange
    orange: {
      50: '#FFF7ED',
      100: '#FFEDD5',
      200: '#FED7AA',
      300: '#FDBA74',
      400: '#FB923C',  // Vibrant orange
      500: '#F97316',
      600: '#EA580C',
      700: '#C2410C',
      800: '#9A3412',
      900: '#7C2D12',
    },
  },

  // Semantic colors - vibrant yet accessible
  semantic: {
    success: {
      50: '#F0FDF4',
      100: '#DCFCE7',
      200: '#BBF7D0',
      300: '#86EFAC',
      400: '#4ADE80',
      500: '#22C55E',  // Vibrant green
      600: '#16A34A',
      700: '#15803D',
      800: '#166534',
      900: '#14532D',
    },
    warning: {
      50: '#FFF7ED',
      100: '#FFEDD5',
      200: '#FED7AA',
      300: '#FDBA74',
      400: '#FB923C',
      500: '#F97316',  // Vibrant warning orange
      600: '#EA580C',
      700: '#C2410C',
      800: '#9A3412',
      900: '#7C2D12',
    },
    error: {
      50: '#FEF2F2',
      100: '#FEE2E2',
      200: '#FECACA',
      300: '#FCA5A5',
      400: '#F87171',
      500: '#EF4444',  // Vibrant red
      600: '#DC2626',
      700: '#B91C1C',
      800: '#991B1B',
      900: '#7F1D1D',
    },
    info: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',  // Vibrant blue for info
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
    }
  },

  // Section backgrounds with vibrant energy yet professional
  sections: {
    primary: '#FFFFFF',                    // Clean white sections
    secondary: '#FDF2F8',                  // Soft pink tint for energy
    tertiary: '#292A2C',                   // Professional dark sections  
    quaternary: '#F0FDFA',                 // Subtle vibrant teal background
    accent: 'linear-gradient(135deg, #DB1B5C 0%, #3B82F6 100%)', // Pink-to-blue gradient
  }
} as const;

// Typography System - Paper Giant Style
export const paperGiantTypography = {
  // Font stacks matching Paper Giant's approach
  fontFamily: {
    serif: [
      'Sectra',
      'Georgia',
      'Times New Roman',
      'serif'
    ],
    sans: [
      'America',
      'Inter',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'sans-serif'
    ],
    mono: [
      'JetBrains Mono',
      'Monaco',
      'Consolas',
      'Liberation Mono',
      'Courier New',
      'monospace'
    ]
  },

  // Typography scale based on Paper Giant's hierarchy
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],
    sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.01em' }],
    base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],           // 16px - America body text
    lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
    xl: ['1.25rem', { lineHeight: '1.875rem', letterSpacing: '-0.015em' }],
    '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.025em' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.03em' }],
    '5xl': ['3rem', { lineHeight: '3.375rem', letterSpacing: '-0.03em' }],   // Close to Paper Giant's 54px
    '6xl': ['3.375rem', { lineHeight: '3.75rem', letterSpacing: '-0.031em' }], // 54px - Sectra heading size
    '7xl': ['4.5rem', { lineHeight: '4.875rem', letterSpacing: '-0.035em' }],
  },

  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',        // Paper Giant's primary weight
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900'
  },

  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
    papergiant: '-0.031em', // Specific to Paper Giant's heading style
  }
} as const;

// Spacing System - Paper Giant's Generous Approach
export const paperGiantSpacing = {
  // Base spacing unit (8px)
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px - Paper Giant's horizontal padding
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px - Paper Giant's section padding
  28: '7rem',       // 112px
  32: '8rem',       // 128px - Paper Giant's large section padding
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px

  // Paper Giant specific spacing
  section: {
    xs: '4rem',       // 64px
    sm: '6rem',       // 96px  - Paper Giant's typical section padding
    md: '8rem',       // 128px - Paper Giant's large section padding
    lg: '10rem',      // 160px
    xl: '12rem',      // 192px
  },
  
  content: {
    horizontal: '2.5rem',  // 40px - Paper Giant's content horizontal padding
    narrow: '1.5rem',      // 24px - Narrow content padding
    wide: '4rem',          // 64px - Wide content padding
  }
} as const;

// Paper Giant Border Radius - Minimal and Professional
export const paperGiantRadius = {
  none: '0',
  xs: '0.125rem',     // 2px
  sm: '0.25rem',      // 4px
  base: '0.375rem',   // 6px
  md: '0.5rem',       // 8px
  lg: '0.75rem',      // 12px
  xl: '1rem',         // 16px
  '2xl': '1.5rem',    // 24px - Paper Giant's button radius
  '3xl': '2rem',      // 32px
  full: '9999px',
  
  // Component-specific radius
  button: '1.5rem',   // 24px - Based on Paper Giant's buttons
  card: '0.5rem',     // 8px - Subtle card rounding
  input: '0.375rem',  // 6px - Form inputs
} as const;

// Shadows - Subtle and Professional
export const paperGiantShadows = {
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  base: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
  
  // Professional shadows
  subtle: '0 2px 8px 0 rgb(0 0 0 / 0.08)',
  card: '0 4px 12px 0 rgb(0 0 0 / 0.1)',
  elevated: '0 8px 24px 0 rgb(0 0 0 / 0.12)',
} as const;

// Animation & Transitions - Subtle and Professional
export const paperGiantAnimation = {
  duration: {
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms'
  },
  
  timing: {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    linear: 'linear',
    
    // Professional easing
    professional: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    subtle: 'cubic-bezier(0.4, 0, 0.6, 1)',
  }
} as const;

// Breakpoints for Responsive Design
export const paperGiantBreakpoints = {
  xs: '375px',    // Mobile portrait
  sm: '640px',    // Mobile landscape / small tablet
  md: '768px',    // Tablet portrait
  lg: '1024px',   // Tablet landscape / desktop
  xl: '1280px',   // Large desktop
  '2xl': '1536px', // Extra large desktop
  
  // Content-specific breakpoints
  content: '1200px',  // Max content width
  prose: '65ch',      // Optimal reading width
} as const;

// Z-Index Scale
export const paperGiantZIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800
} as const;

// Export the complete Paper Giant design system
export const paperGiantDesignSystem = {
  colors: paperGiantColors,
  typography: paperGiantTypography,
  spacing: paperGiantSpacing,
  radius: paperGiantRadius,
  shadows: paperGiantShadows,
  animation: paperGiantAnimation,
  breakpoints: paperGiantBreakpoints,
  zIndex: paperGiantZIndex,
} as const;