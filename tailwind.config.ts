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
        sans: ["'Cormorant Garamond'", "serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
        cinzel: ["'Cinzel'", "serif"],
      },

      /* ─── Color tokens (mapped to CSS variables) ─── */
      colors: {
        border: "hsl(var(--border))",
        input:  "hsl(var(--input))",
        ring:   "hsl(var(--ring))",

        background: "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",

        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        /* Semantic surface tokens */
        surface: {
          "0": "hsl(var(--surface-0))",
          "1": "hsl(var(--surface-1))",
          "2": "hsl(var(--surface-2))",
        },
      },

      /* ─── Border radius ─── */
      borderRadius: {
        sm:  "6px",
        md:  "8px",
        lg:  "12px",
        xl:  "16px",
        "2xl": "20px",
        full: "9999px",
      },

      /* ─── Spacing extras ─── */
      spacing: {
        "4.5": "1.125rem",
        "13":  "3.25rem",
        "15":  "3.75rem",
        "18":  "4.5rem",
      },

      /* ─── Box shadows ─── */
      boxShadow: {
        "sm-dark": "0 1px 2px rgba(0,0,0,0.3)",
        "md-dark": "0 4px 12px rgba(0,0,0,0.4)",
        "lg-dark": "0 8px 24px rgba(0,0,0,0.5)",
        "glow":    "0 0 0 1px rgba(168,124,62,0.3), 0 0 16px rgba(168,124,62,0.1)",
        "glow-lg": "0 0 0 2px rgba(168,124,62,0.35), 0 0 24px rgba(168,124,62,0.15)",
        /* Legacy compat */
        "stripe-ambient":  "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)",
        "stripe-elevated": "0 4px 16px rgba(0,0,0,0.16), 0 2px 6px rgba(0,0,0,0.1)",
        "stripe-deep":     "0 8px 24px rgba(0,0,0,0.2)",
        "stripe-focus":    "0 0 0 2px rgba(168,124,62,0.4)",
      },

      /* ─── Backdrop blur ─── */
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "16px",
      },

      /* ─── Keyframes ─── */
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition:  "200% 0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-12px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-dot": {
          "0%, 80%, 100%": { opacity: "0.3", transform: "scale(0.75)" },
          "40%":           { opacity: "1",   transform: "scale(1)"    },
        },
        "thinking-dot": {
          "0%, 100%": { opacity: "0.25", transform: "scale(0.7)" },
          "50%":      { opacity: "0.7",  transform: "scale(1)"   },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to:   { transform: "rotate(360deg)" },
        },
        "border-pulse": {
          "0%, 100%": { borderColor: "hsl(var(--border))" },
          "50%":      { borderColor: "hsl(var(--primary) / 0.4)" },
        },
      },

      /* ─── Animation utilities ─── */
      animation: {
        "shimmer":        "shimmer 1.6s ease-in-out infinite",
        "fade-in":        "fade-in 0.3s ease-out",
        "fade-up":        "fade-up 0.35s ease-out forwards",
        "slide-in-left":  "slide-in-left 0.3s ease-out forwards",
        "pulse-dot":      "pulse-dot 1.4s infinite ease-in-out",
        "thinking-dot":   "thinking-dot 1.2s ease-in-out infinite",
        "spin-slow":      "spin-slow 3s linear infinite",
        "border-pulse":   "border-pulse 2s ease-in-out infinite",
      },

      /* ─── Typography extras ─── */
      letterSpacing: {
        tightest: "-0.04em",
        tighter:  "-0.025em",
        tight:    "-0.015em",
        normal:   "-0.005em",
        wide:     "0.02em",
        wider:    "0.05em",
        widest:   "0.08em",
      },

      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
        "xs":  ["0.75rem",  { lineHeight: "1rem"     }],
        "sm":  ["0.8125rem",{ lineHeight: "1.25rem"  }],
        "base":["0.9375rem",{ lineHeight: "1.5rem"   }],
        "lg":  ["1.0625rem",{ lineHeight: "1.625rem" }],
        "xl":  ["1.1875rem",{ lineHeight: "1.75rem"  }],
        "2xl": ["1.375rem", { lineHeight: "1.875rem" }],
        "3xl": ["1.75rem",  { lineHeight: "2.25rem"  }],
        "4xl": ["2.25rem",  { lineHeight: "2.75rem"  }],
        "5xl": ["3rem",     { lineHeight: "1.1"      }],
        "6xl": ["3.75rem",  { lineHeight: "1.05"     }],
      },
    },
  },
  plugins: [],
};

export default config;
