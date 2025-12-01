import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/src/app/**/*.{ts,tsx,mdx}',
    './app/src/components/**/*.{ts,tsx}',
    './app/src/lib/**/*.{ts,tsx}',
    './app/src/hooks/**/*.{ts,tsx}',
    './content/**/*.{mdx,md}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        bitcoin: '#f7931a',
        lightning: '#ffd700',
        nostr: '#9b59b6',
      },
    },
  },
  plugins: [],
};

export default config;
