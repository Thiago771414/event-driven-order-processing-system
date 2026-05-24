/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        trust: {
          ink: '#080b10',
          panel: '#0d121c',
          line: '#243044',
          mint: '#38d6a0',
          blue: '#7dd3fc',
          amber: '#f5c451',
          rose: '#ff6b7a',
        },
      },
      boxShadow: {
        trust: '0 18px 70px rgba(0, 0, 0, 0.34)',
        glow: '0 0 28px rgba(56, 214, 160, 0.16)',
      },
    },
  },
  plugins: [],
};
