import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Krea-inspired color palette
        krea: {
          black: "#050505", // Main canvas background
          dark: "#0A0A0A",  // Sidebar and header background
          gray: "#111111",  // Card and node background
          border: "rgba(255, 255, 255, 0.08)", // Subtle glass border
          muted: "#888888",
        },
        accent: {
          blue: "#3B82F6",
          purple: "#8B5CF6",
        }
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      boxShadow: {
        // Glowing effect for nodes and buttons
        'glow': '0 0 20px -5px rgba(59, 130, 246, 0.5)',
        'purple-glow': '0 0 20px -5px rgba(139, 92, 246, 0.5)',
      }
    },
  },
  plugins: [],
};

export default config;
