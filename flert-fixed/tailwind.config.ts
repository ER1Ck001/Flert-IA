import type { Config } from 'tailwindcss'
import { fontFamily } from 'tailwindcss/defaultTheme'

const rgb = (name: string) => `rgb(var(--${name}) / <alpha-value>)`

const displayStack = ["'Cabinet Grotesk'", 'var(--font-inter)', ...fontFamily.sans]

const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', ...fontFamily.sans],
        display: displayStack,
        cabinet: displayStack,
      },
      fontSize: {
        display: ['clamp(2.5rem, 5vw + 1rem, 4.5rem)', { lineHeight: '1.02', fontWeight: '800', letterSpacing: '-0.03em' }],
        h1: ['clamp(1.75rem, 2.5vw + 1rem, 2.5rem)', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.02em' }],
        h2: ['clamp(1.375rem, 1.5vw + 1rem, 2rem)', { lineHeight: '1.15', fontWeight: '700' }],
        h3: ['1.125rem', { lineHeight: '1.3', fontWeight: '700' }],
        body: ['1rem', { lineHeight: '1.6' }],
        small: ['.875rem', { lineHeight: '1.5' }],
        caption: ['.75rem', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.02em' }],
      },
      colors: {
        // ── Paleta Faísca ──
        bg: rgb('bg'),
        surface: {
          DEFAULT: rgb('surface'),
          2: rgb('surface-2'),
          3: rgb('surface-3'),
        },
        text: {
          DEFAULT: rgb('text'),
          2: rgb('text-2'),
          3: rgb('text-3'),
        },
        violet: {
          400: rgb('violet-400'),
          500: rgb('violet-500'),
          600: rgb('violet-600'),
        },
        pink: {
          400: rgb('pink-400'),
          500: rgb('pink-500'),
          600: rgb('pink-600'),
        },
        coral: { DEFAULT: rgb('coral-500'), 500: rgb('coral-500') },
        success: rgb('success'),
        warning: rgb('warning'),
        danger: rgb('danger'),

        // ── shadcn (mantidos) ──
        border: {
          DEFAULT: 'hsl(var(--border))',
          strong: 'hsl(var(--border-strong))',
        },
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        // Alias permanente (admin usa brand-*): escala violeta. 500 = #7C3AED (5,7:1 com texto
        // branco — #8B5CF6 dava 4,2:1 e reprovava no AA em `bg-brand-500 text-white`).
        brand: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#7C3AED',
          600: '#6D28D9',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
          950: '#2E1065',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'calc(var(--radius-xl) + 4px)',
      },
      boxShadow: {
        1: 'var(--shadow-1)',
        2: 'var(--shadow-2)',
        'glow-violet': 'var(--glow-violet)',
        'glow-pink': 'var(--glow-pink)',
      },
      backgroundImage: {
        signal: 'var(--grad-signal)',
        cta: 'var(--grad-cta)',
        aurora: 'var(--grad-aurora)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(.16,1,.3,1)',
        'in-out': 'cubic-bezier(.65,0,.35,1)',
      },
      maxWidth: {
        app: '960px',
        site: '1120px',
      },
      spacing: {
        nav: 'var(--nav-h)',
        topbar: 'var(--topbar-h)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        spark: {
          '0%, 100%': { transform: 'scale(.85) rotate(0deg)', opacity: '.75' },
          '50%': { transform: 'scale(1.12) rotate(45deg)', opacity: '1' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to: { backgroundPosition: '200% 0' },
        },
        'signal-sweep': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-up': 'fade-up 0.56s cubic-bezier(.16,1,.3,1) forwards',
        'fade-in': 'fade-in 0.32s ease forwards',
        spark: 'spark 1.4s cubic-bezier(.65,0,.35,1) infinite',
        shimmer: 'shimmer 1.6s linear infinite',
        'signal-sweep': 'signal-sweep 0.6s cubic-bezier(.16,1,.3,1) 1',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config

export default config
