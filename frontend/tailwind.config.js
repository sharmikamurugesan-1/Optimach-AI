/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // FactoryMind Minimal Purple + Soft Blue Palette
        fm: {
          bg: '#FAF9FD',           // Near-white canvas background
          surface: '#FFFFFF',      // Pure white card surfaces
          section: '#F5F3FF',      // Subtle lavender section surface
          elevated: '#FFFFFF',     // Clean elevated surface
          border: '#EDE9FE',       // Soft purple/gray border
          borderLight: '#F3EEFF',  // Very soft border
          borderHover: '#DDD6FE',  // Hover border
          
          // Purple Identity
          primary: '#7C3AED',      // Clean vibrant purple
          primaryHover: '#6D28D9', // Darker purple hover
          secondary: '#8B5CF6',    // Violet secondary
          lavender: '#EDE9FE',     // Lavender container / active
          lavenderLight: '#F5F3FF',// Subtle lavender background
          deepPurple: '#2E1065',   // Dark purple for important text/headings
          
          // Soft Blue Accents
          blue: '#3B82F6',         // Soft blue accent
          blueLight: '#EFF6FF',    // Soft blue background
          blueBorder: '#BFDBFE',   // Soft blue border
          blueText: '#1D4ED8',     // Soft blue text
          
          // Typography
          textPrimary: '#1E1B4B',  // Deep dark purple-slate for primary text
          textSecondary: '#64748B',// Cool slate for secondary text
          textMuted: '#94A3B8',    // Muted slate
        },
        // Refined Industrial Status Colors
        status: {
          normal: '#059669',       // Mint Green
          normalBg: '#ECFDF5',     // Soft green background
          normalBorder: '#A7F3D0', // Normal border
          warning: '#D97706',      // Warm Amber
          warningBg: '#FFFBEB',    // Soft amber background
          warningBorder: '#FDE68A',// Warning border
          critical: '#DC2626',     // Crisp Red
          criticalBg: '#FEF2F2',   // Soft red background
          criticalBorder: '#FECACA', // Critical border
          info: '#2563EB',         // Soft Blue
          infoBg: '#EFF6FF',       // Info soft background
          infoBorder: '#BFDBFE',   // Info border
        }
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(124, 58, 237, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'card': '0 4px 12px rgba(124, 58, 237, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02)',
        'elevated': '0 8px 24px rgba(124, 58, 237, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
