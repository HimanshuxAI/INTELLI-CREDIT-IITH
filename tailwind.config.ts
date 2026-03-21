import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Instrument Serif", "Georgia", "serif"],
        sans: ["Geist", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "monospace"],
      },
      colors: {
        ink: {
          DEFAULT: "#0C0B09",
          2: "#1E1C18",
          3: "#3A3830",
        },
        muted: "#6B6760",
        faint: "#9E9B94",
        surface: {
          DEFAULT: "#FFFFFF",
          2: "#FAFAF8",
          3: "#F0EFEB",
        },
        border: {
          DEFAULT: "#E8E6E0",
          2: "#D8D5CE",
          3: "#C4C0B6",
        },
        bg: "#F6F5F2",
        brand: {
          blue: "#0066CC",
          "blue-lt": "#EBF3FF",
          "blue-md": "#C5DCFF",
          green: "#157A45",
          "green-lt": "#EDFAF3",
          "green-md": "#B3EDCC",
          amber: "#96500A",
          "amber-lt": "#FFF5EB",
          "amber-md": "#FAD09A",
          red: "#B01225",
          "red-lt": "#FFF0F2",
          "red-md": "#FFBEC8",
          purple: "#6428C8",
          "purple-lt": "#F2EEFF",
          "purple-md": "#D4C0FF",
          "blue-dk": "#004C99",
          "green-dk": "#0E5C33",
        },
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease both",
        "fade-in": "fadeIn 0.3s ease both",
        "slide-in": "slideIn 0.3s ease both",
        "pulse-dot": "pulseDot 2s infinite",
        "spin-slow": "spin 1.5s linear infinite",
        "count-up": "countUp 1s ease both",
        shimmer: "shimmer 2s infinite",
        wiggle: "wiggle 0.6s ease-in-out",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "none" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideIn: {
          from: { opacity: "0", transform: "translateX(-8px)" },
          to: { opacity: "1", transform: "none" },
        },
        pulseDot: {
          "0%": { boxShadow: "0 0 0 0 rgba(21,122,69,.5)" },
          "70%": { boxShadow: "0 0 0 8px rgba(21,122,69,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(21,122,69,0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "15%": { transform: "rotate(12deg)" },
          "30%": { transform: "rotate(-10deg)" },
          "45%": { transform: "rotate(8deg)" },
          "60%": { transform: "rotate(-6deg)" },
          "75%": { transform: "rotate(3deg)" },
        },
      },
      boxShadow: {
        sm: "0 1px 3px rgba(0,0,0,.05), 0 1px 2px rgba(0,0,0,.04)",
        md: "0 4px 16px rgba(0,0,0,.07), 0 2px 6px rgba(0,0,0,.04)",
        lg: "0 12px 40px rgba(0,0,0,.10), 0 4px 12px rgba(0,0,0,.05)",
        xl: "0 24px 80px rgba(0,0,0,.14), 0 8px 24px rgba(0,0,0,.07)",
        "glow-blue": "0 0 0 3px rgba(0,102,204,.15)",
        "glow-green": "0 0 0 3px rgba(21,122,69,.15)",
      },
    },
  },
  plugins: [],
};

export default config;
