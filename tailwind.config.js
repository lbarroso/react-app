/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#691c32',
        'secondary': '#bc955c',
        'green-accent': '#235b4e',
        'green-light': '#9f2241',
        'gray-dark': '#691c32',
        'gray-medium': '#gf7272',
        'gray-light': '#98989a',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
} 