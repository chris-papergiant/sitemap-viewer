// Design tokens aligned with Lorikeet CX style
export const lorikeetTokens = {
  colors: {
    // Primary palette - clean and professional
    white: '#FFFFFF',
    black: '#131415',
    blue: '#4348DC',
    pink: '#EB2893',
    
    // Supporting grays
    gray: {
      50: '#F8FAFC',
      100: '#F1F5F9', 
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#131415'
    },
    
    // Semantic colors - simplified
    success: '#10B981',
    warning: '#F59E0B', 
    error: '#EF4444'
  },
  
  // Typography scale
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif']
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem', 
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem'
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      black: 900
    }
  },
  
  // Spacing and layout
  spacing: {
    borderRadius: {
      sm: '0.5rem',
      md: '0.75rem', 
      lg: '1rem',
      xl: '1.5rem',
      '2xl': '2rem'
    }
  }
} as const;

// Component-specific styling
export const componentStyles = {
  // Clean button system
  buttons: {
    primary: 'bg-blue text-white px-6 py-4 rounded-xl font-semibold hover:bg-blue/90 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-blue/20',
    secondary: 'bg-white text-gray-700 px-6 py-4 rounded-xl font-semibold border-2 border-gray-200 hover:border-gray-300 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-blue/20',
    suggestion: 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-700 px-3 py-1.5 rounded-full text-xs transition-colors duration-200'
  },
  
  // Card system
  cards: {
    clean: 'bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200',
    elevated: 'bg-white rounded-2xl border border-gray-200 shadow-lg'
  },
  
  // Input system
  inputs: {
    primary: 'block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-4 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-blue focus:ring-0 focus:outline-none hover:border-gray-300',
    error: 'block w-full rounded-xl border-2 border-error bg-white px-4 py-4 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-error focus:ring-0 focus:outline-none'
  }
};