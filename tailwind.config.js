/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./Resources/Views/**/*.leaf",
    "./Resources/Views/**/*.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui'],
        'mono': ['JetBrains Mono', 'ui-monospace', 'monospace']
      },
      colors: {
        'bitcoin': '#f7931a',
        'lightning': '#ffd700',
        'nostr': '#9b59b6'
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography')
  ]
}