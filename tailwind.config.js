/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/pages/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}", "./src/app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        "brand-white": "#F1F6F9",
        "brand-blue-600": "#394867",
        "brand-blue-800": "#212A3E",
        "brand-purple-100": "#E5D0FB",
        "brand-purple-200": "#D7BBF5",
        "brand-indigo-200": "#a684f7",
        "brand-indigo-300": "#9288F8",
        "brand-indigo-400": "#826cb7",
        "brand-indigo-800": "#6528F7",
      },
    },
  },
  plugins: [],
};
