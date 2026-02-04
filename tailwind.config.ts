import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // Scans everything in src
    "./app/**/*.{js,ts,jsx,tsx,mdx}", // Scans if you don't use src
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [], // Removed plugins to prevent build errors
};
export default config;