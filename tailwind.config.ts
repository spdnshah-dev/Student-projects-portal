import type { Config } from "tailwindcss";

/**
 * Learnbay Projects design tokens.
 *
 * These values are lifted directly from the frozen design canvas so that every
 * screen sits inside one consistent brand shell. Prefer these semantic tokens
 * (brand.ink, brand.muted, surface, …) over raw hex values in components.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Accent — primary action colour. The design offers alternates
          // (#0B7A75 teal, #C2410C orange, #6D28D9 purple); #1554D1 is default.
          DEFAULT: "#1554D1",
          accent: "#1554D1",
          "accent-hover": "#1246B0",
          ink: "#10182B", // primary text / dark navy
          "ink-soft": "#2A3347", // body text on cards
          muted: "#4B5568", // secondary text
          faint: "#9AA3B2", // tertiary / icon grey
          "on-dark": "#C5CCDA", // muted text on dark surfaces
        },
        surface: {
          DEFAULT: "#FFFFFF", // cards, panels
          canvas: "#F7F8FA", // page background
          sunken: "#EEF1F6", // segmented controls, wells
          chip: "#E6EAF1", // tag / pill backgrounds
        },
        line: {
          DEFAULT: "#E1E5EC", // default hairline border
          strong: "#D3D8E1", // medium border
          input: "#C4CAD6", // input borders
        },
        // Dark gradient card stops (featured "Project of the week" cards).
        night: {
          from: "#1C2947",
          to: "#10182B",
          chip: "#2A3550",
        },
        // Review / state-machine status accents.
        state: {
          draft: "#4B5568",
          review: "#C2410C",
          published: "#0B7A75",
          sentback: "#B4232F",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-instrument-sans)",
          "Instrument Sans",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        card: "14px",
        pill: "999px",
        field: "8px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 43, 0.05)",
        feature: "0 6px 18px rgba(16, 24, 43, 0.14)",
        sheet: "0 12px 32px rgba(16, 24, 43, 0.18)",
      },
      maxWidth: {
        shell: "1440px",
      },
    },
  },
  plugins: [],
};

export default config;
