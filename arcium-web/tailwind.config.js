/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // New brand colors
        "brand-orange": "#FF611A",
        "brand-dark": "#262626",
        "brand-darker": "#1a1a1a",
        "brand-darkest": "#121212",

        // Legacy aliases (mapped to new theme)
        "obsidian": "#121212",
        "charcoal": "#1a1a1a",
        "dark-bg": "#121212",
        "card-bg": "#1a1a1a",
        "surface-dark": "#1a1a1a",
        "surface-lighter": "#262626",

        // Primary = orange
        "primary": "#FF611A",
        "primary-glow": "#FF8A50",

        // Accent colors
        "neon-primary": "#FF611A",
        "neon-secondary": "#FF8A50",
        "neon-teal": "#FF611A",
        "electric-purple": "#FF611A",

        // Text
        "text-primary": "#ffffff",
        "text-secondary": "#9ca3af",

        // Glass effects
        "glass-border": "rgba(255, 255, 255, 0.08)",
        "glass-surface": "rgba(255, 255, 255, 0.03)",
      },
      fontFamily: {
        "display": ["Manrope", "sans-serif"]
      },
      boxShadow: {
        'neon': '0 0 10px rgba(255, 97, 26, 0.2), 0 0 20px rgba(255, 97, 26, 0.1)',
        'shield-glow': '0 0 15px rgba(255, 97, 26, 0.15)',
        'glow': '0 0 40px -10px rgba(255, 97, 26, 0.3), 0 0 20px -10px rgba(255, 138, 80, 0.3)',
        'glass-shine': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        'orange-glow': '0 0 30px rgba(255, 97, 26, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      backgroundImage: {
        'mesh-gradient': 'radial-gradient(at 0% 0%, rgba(255, 97, 26, 0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(255, 138, 80, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(255, 97, 26, 0.1) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(255, 138, 80, 0.05) 0px, transparent 50%)',
        'glass-gradient': 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
        'primary-glow-bg': 'linear-gradient(135deg, #FF611A 0%, #FF8A50 100%)',
        'privacy-brand': "url('/privacy.png')",
      }
    },
  },
  plugins: [],
}
