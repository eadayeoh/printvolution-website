import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // PrintVolution brand
        pink: {
          DEFAULT: '#E91E8C',
          dark: '#C4157A',
          50: '#FFF0F8',
          100: '#FFD6EC',
          500: '#E91E8C',
          600: '#C4157A',
          700: '#9F1163',
        },
        ink: {
          DEFAULT: '#0D0D0D',
          2: '#1a1a1a',
        },
        cyan: {
          brand: '#00B8D9',
        },
        yellow: {
          brand: '#FFD100',
        },
        muted: '#6b7280',
        border: '#e5e5e5',
        surface: '#fafafa',
        // shadcn/ui tokens (override via CSS vars)
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
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
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      fontFamily: {
        // Default body font is now Archivo to match the v4/v6 brutalist
        // redesign (about, contact, homepage, product page). Plus Jakarta
        // Sans is still loaded in app/layout.tsx as a fallback for any
        // legacy screens that rely on it.
        sans: ['Archivo', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
        display: ['"Archivo Black"', 'Archivo', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '6px',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'brand': '3px 3px 0 #E91E8C',
        'brand-lg': '5px 5px 0 #E91E8C',
        'brand-hover': '9px 9px 0 #E91E8C',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee 25s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
