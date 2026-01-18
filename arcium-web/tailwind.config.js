/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "obsidian": "#050505",
        "charcoal": "#121214",
        "electric-purple": "#a855f7",
        "neon-teal": "#2dd4bf",
        "dark-bg": "#050505",
        "card-bg": "#0f0f11",
        "neon-primary": "#22d3ee",
        "neon-secondary": "#34d399",
        "text-primary": "#ffffff",
        "text-secondary": "#9ca3af",
        "primary": "#3b82f6",
        "primary-glow": "#60a5fa",
        "surface-dark": "#0f131a",
        "surface-lighter": "#1c2230",
        "glass-border": "rgba(255, 255, 255, 0.08)",
        "glass-surface": "rgba(255, 255, 255, 0.03)",
      },
      fontFamily: {
        "display": ["Manrope", "sans-serif"]
      },
      boxShadow: {
        'neon': '0 0 10px rgba(34, 211, 238, 0.2), 0 0 20px rgba(34, 211, 238, 0.1)',
        'shield-glow': '0 0 15px rgba(52, 211, 153, 0.15)',
        'glow': '0 0 40px -10px rgba(168, 85, 247, 0.3), 0 0 20px -10px rgba(45, 212, 191, 0.3)',
        'glass-shine': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      backgroundImage: {
        'mesh-gradient': 'radial-gradient(at 0% 0%, rgba(168, 85, 247, 0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(45, 212, 191, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(168, 85, 247, 0.1) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(45, 212, 191, 0.05) 0px, transparent 50%)',
        'glass-gradient': 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
        'primary-glow-bg': 'linear-gradient(135deg, #a855f7 0%, #2dd4bf 100%)',
        'privacy-brand': "url('/privacy.png')",
      }
    },
  },
  plugins: [],
}

