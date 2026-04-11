import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // shadcn/ui CSS variable colors
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: { DEFAULT: "var(--card)", foreground: "var(--card-foreground)" },
        popover: { DEFAULT: "var(--popover)", foreground: "var(--popover-foreground)" },
        muted: { DEFAULT: "var(--muted)", foreground: "var(--muted-foreground)" },
        accent: { DEFAULT: "var(--accent)", foreground: "var(--accent-foreground)" },
        destructive: { DEFAULT: "var(--destructive)" },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",

        // TenantPorch — Editorial Estate design tokens
        "primary": "#041534",
        "primary-container": "#1b2a4a",
        "on-primary": "#ffffff",
        "on-primary-container": "#8392b7",
        "primary-fixed": "#d9e2ff",
        "primary-fixed-dim": "#b7c6ee",
        "on-primary-fixed": "#0a1a3a",
        "on-primary-fixed-variant": "#384668",
        "inverse-primary": "#b7c6ee",

        "secondary": "#7b5804",
        "secondary-container": "#fdcd74",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#785601",
        "secondary-fixed": "#ffdea6",
        "secondary-fixed-dim": "#eec068",
        "on-secondary-fixed": "#271900",
        "on-secondary-fixed-variant": "#5d4200",

        "tertiary": "#001c07",
        "tertiary-container": "#003312",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#00a94c",
        "tertiary-fixed": "#6bff8f",
        "tertiary-fixed-dim": "#4ae176",
        "on-tertiary-fixed": "#002109",
        "on-tertiary-fixed-variant": "#005321",

        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",

        "surface": "#f8f9fd",
        "surface-dim": "#d9dade",
        "surface-bright": "#f8f9fd",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f2f3f7",
        "surface-container": "#edeef2",
        "surface-container-high": "#e7e8ec",
        "surface-container-highest": "#e1e2e6",
        "surface-variant": "#e1e2e6",
        "surface-tint": "#4f5e81",
        "on-surface": "#191c1f",
        "on-surface-variant": "#45464e",
        "on-background": "#191c1f",

        "outline": "#75777f",
        "outline-variant": "#c5c6cf",

        "inverse-surface": "#2e3134",
        "inverse-on-surface": "#eff1f5",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        full: "9999px",
      },
      fontFamily: {
        headline: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Inter", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        "ambient-sm": "0 2px 24px rgba(4, 21, 52, 0.06)",
        "ambient": "0 4px 32px rgba(4, 21, 52, 0.06)",
        "ambient-lg": "0 8px 48px rgba(4, 21, 52, 0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
