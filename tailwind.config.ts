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
        ivory: "#FFFEF9",
        champagne: "#C9A962",
        "champagne-light": "#E8D5A3",
        blush: "#F5E6E0",
        "blush-deep": "#E8C4B8",
        "rose-gold": "#B76E79",
        charcoal: "#2C2C2C",
        "warm-gray": "#6B6560",
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-outfit)", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.8s ease-out forwards",
        kenburns: "kenburns 14s ease-in-out infinite alternate",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        kenburns: {
          "0%": { transform: "scale(1) translate(0, 0)" },
          "50%": { transform: "scale(1.06) translate(-1%, -0.5%)" },
          "100%": { transform: "scale(1.12) translate(-2%, -1%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
