import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        serif: ['"Playfair Display"', 'serif'],
      },
      colors: {
        void: {
          DEFAULT: '#020205',
          surface: '#08080c',
          elevated: '#12121a',
        },
        gold: {
          light: '#E6C892',
          DEFAULT: '#C5A059',
          dark: '#8B6B32',
          accent: '#c9a84c',
        },
        glass: {
          white: 'rgba(255, 255, 255, 0.03)',
          border: 'rgba(255, 255, 255, 0.06)',
          highlight: 'rgba(255, 255, 255, 0.12)',
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        'luxury-sm': '8px',
        'luxury-md': '16px',
        'luxury-lg': '24px',
      },
      boxShadow: {
        'glass-glow': '0 8px 32px 0 rgba(0, 0, 0, 0.8)',
        'gold-glow': '0 0 15px rgba(197, 160, 89, 0.3)',
        'inner-glass': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)',
        'velvet-ambient': '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
        'velvet-elevated': '0 24px 64px -16px rgba(0, 0, 0, 0.7)',
        'gold-aura': '0 0 25px rgba(197, 160, 89, 0.15)',
        'indigo-glow': '0 0 35px rgba(83, 58, 253, 0.12)',
      },
      backdropBlur: {
        'luxury': '24px',
        'heavy': '40px',
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-12px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-dot": {
          "0%, 80%, 100%": { opacity: "0.3", transform: "scale(0.8)" },
          "40%": { opacity: "1", transform: "scale(1)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "shimmer": {
          "100%": { transform: "translateX(100%)" }
        },
        "border-glow": {
          "0%, 100%": { "border-color": "rgba(197, 160, 89, 0.2)" },
          "50%": { "border-color": "rgba(197, 160, 89, 0.6)" }
        }
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "fade-up": "fade-up 0.3s ease-out forwards",
        "slide-in-left": "slide-in-left 0.3s ease-out forwards",
        "pulse-dot": "pulse-dot 1.4s infinite ease-in-out",
        "spin-slow": "spin-slow 3s linear infinite",
        "shimmer": "shimmer 2s infinite",
        "border-glow": "border-glow 4s infinite ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;
