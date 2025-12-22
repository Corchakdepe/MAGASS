import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // San Francisco stack for Apple‑like look; falls back gracefully on non‑macOS
        body: [
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "Inter",
          "sans-serif",
        ],
        headline: [
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "Inter",
          "sans-serif",
        ],
        code: ["SF Mono", "Menlo", "Monaco", "ui-monospace", "monospace"],
      },
      colors: {
        // System‑like neutrals (macOS light appearance)
        // Background layers inspired by systemGray levels
        surface: {
          0: "#F5F5F7", // window background
          1: "#FFFFFF", // card / panel
          2: "#E5E5EA", // subtle elevated
          3: "#D1D1D6", // separators, strokes
        },

        // Accent blue similar to systemBlue
        accent: {
          DEFAULT: "rgba(0,122,255,1)", // primary interactive color
          hover: "rgba(0,112,245,1)",
          soft: "rgba(0,122,255,0.08)", // subtle fills
        },

        // Status colors based on Apple tints
        success: {
          DEFAULT: "rgba(52,199,89,1)",
          soft: "rgba(52,199,89,0.08)",
        },
        warning: {
          DEFAULT: "rgba(255,149,0,1)",
          soft: "rgba(255,149,0,0.08)",
        },
        danger: {
          DEFAULT: "rgba(255,59,48,1)",
          soft: "rgba(255,59,48,0.08)",
        },

        // Text colors
        text: {
          primary: "rgba(0,0,0,0.85)", // primary labels
          secondary: "rgba(60,60,67,0.6)", // secondary labels
          tertiary: "rgba(60,60,67,0.3)", // placeholders
          inverted: "#FFFFFF",
        },

        // Existing shadcn tokens kept for compatibility
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },

      // Softer, macOS‑like corner radius
      borderRadius: {
        lg: "10px",
        md: "8px",
        sm: "6px",
      },

      // Subtle elevation for desktop panels
      boxShadow: {
        "mac-window":
          "0 0 0 1px rgba(0,0,0,0.04), 0 6px 18px rgba(0,0,0,0.08)",
        "mac-panel":
          "0 0 0 1px rgba(0,0,0,0.06), 0 3px 10px rgba(0,0,0,0.06)",
        "mac-toolbar":
          "0 1px 0 rgba(0,0,0,0.06), 0 0 0 1px rgba(255,255,255,0.85)",
      },

      // Keep your existing animations
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
