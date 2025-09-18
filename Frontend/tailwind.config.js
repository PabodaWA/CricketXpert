/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#072679',
        'secondary': '#42ADF5',
        'secondary-hover': '#2C8ED1',
        'accent': '#D88717',
        'text-heading': '#000000',
        'text-body': '#36516C',
        'background': '#F1F2F7',
        'surface': '#FFFFFF',
        'text-on-dark': '#F1F2F7',
      }
    },
  },
  plugins: [],
}
