/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Paper Giant typography system
        serif: ['Sectra', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['America', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
        
        // Aliases for easier usage
        display: ['Sectra', 'Georgia', 'serif'], // For headings
        body: ['America', 'Inter', 'system-ui', 'sans-serif'], // For body text
      },
      colors: {
        // Paper Giant vibrant primary colors
        primary: {
          // Signature pink system
          pink: {
            50: '#FDF2F8',
            100: '#FCE7F3',
            200: '#FBCFE8',
            300: '#F9A8D4',
            400: '#F472B6',
            500: '#DB1B5C',  // Paper Giant signature
            600: '#BE185D',
            700: '#9D174D',
            800: '#831843',
            900: '#701A34',
            DEFAULT: '#DB1B5C',
          },
          
          // Vibrant supporting colors
          blue: {
            50: '#EFF6FF',
            100: '#DBEAFE',
            200: '#BFDBFE',
            300: '#93C5FD',
            400: '#60A5FA',
            500: '#3B82F6',
            600: '#2563EB',
            700: '#1D4ED8',
            800: '#1E40AF',
            900: '#1E3A8A',
            DEFAULT: '#3B82F6',
          },
          
          teal: {
            50: '#F0FDFA',
            100: '#CCFBF1',
            200: '#99F6E4',
            300: '#5EEAD4',
            400: '#2DD4BF',
            500: '#14B8A6',
            600: '#0D9488',
            700: '#0F766E',
            800: '#115E59',
            900: '#134E4A',
            DEFAULT: '#14B8A6',
          },
          
          charcoal: '#292A2C',
          white: '#FFFFFF',
          black: '#000000',
        },
        
        // Vibrant accent colors
        accent: {
          purple: {
            50: '#FAF5FF',
            100: '#F3E8FF',
            200: '#E9D5FF',
            300: '#D8B4FE',
            400: '#C084FC',
            500: '#A855F7',
            600: '#9333EA',
            700: '#7C3AED',
            800: '#6B21A8',
            900: '#581C87',
            DEFAULT: '#A855F7',
          },
          orange: {
            50: '#FFF7ED',
            100: '#FFEDD5',
            200: '#FED7AA',
            300: '#FDBA74',
            400: '#FB923C',
            500: '#F97316',
            600: '#EA580C',
            700: '#C2410C',
            800: '#9A3412',
            900: '#7C2D12',
            DEFAULT: '#FB923C',
          },
        },
        
        // Paper Giant neutral scale
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
          950: '#292A2C',
        },

        // Vibrant semantic colors - WCAG compliant
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
          DEFAULT: '#22C55E',
        },
        warning: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
          DEFAULT: '#F97316',
        },
        error: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
          DEFAULT: '#EF4444',
        },
        info: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          DEFAULT: '#3B82F6',
        },

        // Vibrant section backgrounds
        section: {
          primary: '#FFFFFF',
          secondary: '#FDF2F8',   // Soft pink energy
          tertiary: '#292A2C',    // Professional dark
          quaternary: '#F0FDFA',  // Subtle vibrant teal
        },

        // Updated vibrant color mappings
        pink: '#DB1B5C',        // Paper Giant signature pink
        blue: '#3B82F6',        // Vibrant blue  
        teal: '#14B8A6',        // Vibrant teal
        purple: '#A855F7',      // Energetic purple
        orange: '#FB923C',      // Warm orange
        white: '#FFFFFF',
        black: '#292A2C',
        gray: {
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
          950: '#292A2C',
        },
      },

      // Paper Giant spacing system with generous whitespace
      spacing: {
        // Section-specific spacing
        'section-xs': '4rem',    // 64px
        'section-sm': '6rem',    // 96px - Paper Giant's typical section padding
        'section-md': '8rem',    // 128px - Paper Giant's large section padding
        'section-lg': '10rem',   // 160px
        'section-xl': '12rem',   // 192px
        
        // Content spacing
        'content-h': '2.5rem',   // 40px - Paper Giant's horizontal padding
        'content-narrow': '1.5rem', // 24px
        'content-wide': '4rem',  // 64px
      },

      // Paper Giant border radius
      borderRadius: {
        'button': '1.5rem',     // 24px - Paper Giant button style
        'card': '0.5rem',       // 8px - Subtle cards
        'input': '0.375rem',    // 6px - Form inputs
      },

      // Professional shadows
      boxShadow: {
        'subtle': '0 2px 8px 0 rgb(0 0 0 / 0.08)',
        'card': '0 4px 12px 0 rgb(0 0 0 / 0.1)',
        'elevated': '0 8px 24px 0 rgb(0 0 0 / 0.12)',
        'soft': '0 2px 15px 0 rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 25px 0 rgba(0, 0, 0, 0.12)',
        'strong': '0 8px 40px 0 rgba(0, 0, 0, 0.16)',
      },

      // Paper Giant typography scale
      fontSize: {
        'display': ['3.375rem', { lineHeight: '3.75rem', letterSpacing: '-0.031em', fontWeight: '400' }], // 54px - Paper Giant heading
        'section-title': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em', fontWeight: '400' }], // Section headings
        'card-title': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.015em', fontWeight: '400' }], // Card titles
      },

      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2.5s infinite',
        'gradient-shift': 'gradientShift 4s ease-in-out infinite',
        'scale-in': 'scaleIn 0.3s ease-out',
        'wiggle': 'wiggle 0.5s ease-in-out',
        'zoom-in': 'zoomIn 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-down-fade': 'slideDownFade 0.7s ease-out',
        'professional': 'professional 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(30px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%': { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.4)' },
          '100%': { boxShadow: '0 0 20px 5px rgba(59, 130, 246, 0.2)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1200px 0' },
          '100%': { backgroundPosition: '1200px 0' },
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(1deg)' },
          '75%': { transform: 'rotate(-1deg)' },
        },
        zoomIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideDownFade: {
          '0%': { transform: 'translateY(-30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'soft': '0 2px 15px 0 rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 25px 0 rgba(0, 0, 0, 0.12)',
        'strong': '0 8px 40px 0 rgba(0, 0, 0, 0.16)',
        // Vibrant Paper Giant glows
        'glow-pink': '0 0 0 1px rgba(219, 27, 92, 0.1), 0 4px 20px 0 rgba(219, 27, 92, 0.15)',
        'glow-pink-lg': '0 0 0 1px rgba(219, 27, 92, 0.15), 0 10px 40px 0 rgba(219, 27, 92, 0.2)',
        'glow-blue': '0 0 0 1px rgba(59, 130, 246, 0.1), 0 4px 20px 0 rgba(59, 130, 246, 0.15)',
        'glow-purple': '0 0 0 1px rgba(168, 85, 247, 0.1), 0 4px 20px 0 rgba(168, 85, 247, 0.15)',
        'glow-teal': '0 0 0 1px rgba(20, 184, 166, 0.1), 0 4px 20px 0 rgba(20, 184, 166, 0.15)',
        'vibrant': '0 8px 32px 0 rgba(219, 27, 92, 0.15), 0 4px 16px 0 rgba(59, 130, 246, 0.1)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        
        // Paper Giant vibrant gradients
        'gradient-pink-blue': 'linear-gradient(135deg, #DB1B5C 0%, #3B82F6 100%)',
        'gradient-pink-teal': 'linear-gradient(135deg, #DB1B5C 0%, #14B8A6 100%)',
        'gradient-purple-pink': 'linear-gradient(135deg, #A855F7 0%, #DB1B5C 100%)',
        'gradient-blue-purple': 'linear-gradient(135deg, #3B82F6 0%, #A855F7 100%)',
        'gradient-teal-blue': 'linear-gradient(135deg, #14B8A6 0%, #3B82F6 100%)',
        'gradient-orange-pink': 'linear-gradient(135deg, #FB923C 0%, #DB1B5C 100%)',
        
        // Vibrant multi-color gradients
        'gradient-vibrant': 'linear-gradient(135deg, #DB1B5C 0%, #A855F7 25%, #3B82F6 50%, #14B8A6 75%, #22C55E 100%)',
        'gradient-energy': 'linear-gradient(135deg, #FB923C 0%, #DB1B5C 50%, #A855F7 100%)',
        'gradient-cool': 'linear-gradient(135deg, #3B82F6 0%, #14B8A6 50%, #22C55E 100%)',
        
        // Subtle shimmer with pink accent
        'shimmer-gradient': 'linear-gradient(90deg, transparent 0%, rgba(219, 27, 92, 0.15) 50%, transparent 100%)',
        'shimmer-vibrant': 'linear-gradient(90deg, transparent 0%, rgba(219, 27, 92, 0.3) 20%, rgba(59, 130, 246, 0.3) 50%, rgba(20, 184, 166, 0.3) 80%, transparent 100%)',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
}