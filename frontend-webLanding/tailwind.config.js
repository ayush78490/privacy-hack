/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'privy': '#FF611A',
        'privy-light': '#ff854d', // Lighter shade for hovers
        'emerald-custom': {
          400: '#FF611A',
          500: '#FF611A',
          950: '#331203',
        }
      },
      fontFamily: {
        sans: ['Orbitron', 'sans-serif'],
        orbitron: ['Orbitron', 'sans-serif'],
        pixelify: ['"Pixelify Sans"', 'sans-serif'],
      },
      selection: {
        backgroundColor: '#FF611A',
        color: '#000000',
      }
    },
  },
  plugins: [],
}
