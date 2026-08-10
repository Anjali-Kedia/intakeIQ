import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#f4f0e8",
        paper: "#fffaf1",
        ink: "#1f2933",
        muted: "#687384",
        line: "#e3d8c6",
        brand: "#245b49",
        amber: "#d97706"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(31, 41, 51, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
