import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        "bg-deep": "#0a0a0f",
        "bg-base": "#12121a",
        "bg-card": "#1a1a2e",
        "bg-card-hover": "#22223a",
        // Borders
        "border-base": "#2a2a3e",
        "border-strong": "#3a3a5e",
        // Text
        "text-primary": "#e0e0e0",
        "text-secondary": "#888899",
        "text-muted": "#5a5a6e",
        // Accents
        "neon-cyan": "#00d4ff",
        "neon-cyan-dim": "#0099bb",
        "neon-orange": "#ff6b35",
        "luck-gold": "#ffd700",
        "luck-gold-dim": "#bb9900",
        "success-green": "#00ff88",
        "danger-red": "#ff3366",
      },
      fontFamily: {
        display: ["var(--font-cinzel)", "serif"],
        body: ["var(--font-jetbrains)", "monospace"],
        numeric: ["var(--font-orbitron)", "sans-serif"],
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(0, 212, 255, 0.3)",
          },
          "50%": {
            boxShadow: "0 0 40px rgba(0, 212, 255, 0.6)",
          },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
