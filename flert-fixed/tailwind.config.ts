import type { Config } from 'tailwindcss'
import { fontFamily } from 'tailwindcss/defaultTheme'

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
        cormorant: ['var(--font-cormorant)', 'Georgia', 'serif'],
        cabinet: ["'Cabinet Grotesk'", ...fontFamily.sans],
        display: ['var(--font-cormorant)', 'Georgia', 'serif'],
        sans: ["'Cabinet Grotesk'", ...fontFamily.sans],
      },
      colors: {
        border: 'hsl(var(--border))',
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
        brand: {
          50:  '#FFF0F3',
          100: '#FFD8E0',
          200: '#FFB0C1',
          300: '#FF7A9A',
          400: '#D4395A',
          500: '#8B0A2A',
          600: '#6D0820',
          700: '#520618',
          800: '#3A040F',
          900: '#24020A',
          950: '#120105',
        },
        gold: {
          50:  '#fdf9ed',
          100: '#faf0d0',
          200: '#f5e0a0',
          300: '#eecb65',
          400: '#e6b53a',
          500: '#C9A84C',
          600: '#b08e38',
          700: '#8d6e28',
          800: '#705422',
          900: '#5c4520',
        },
      },
      borderRadius: {
        lg: '4px',
        md: '2px',
        sm: '2px',
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
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
        rotate360: {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        bob: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(8px)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'fade-up':   'fade-up 0.7s cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-in':   'fade-in 0.5s ease forwards',
        marquee:     'marquee 32s linear infinite',
        rotate360:   'rotate360 18s linear infinite',
        bob:         'bob 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config

export default config
