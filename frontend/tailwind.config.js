/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Bu satır hayati önem taşıyor!
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('tailwindcss-animated')
  ],
}