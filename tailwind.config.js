/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'bg-base': 'var(--bg-base)',
        'bg-surface': 'var(--bg-surface)',
        'bg-elevated': 'var(--bg-elevated)',
        border: 'var(--border)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-mono': 'var(--text-mono)',
        'accent-hot': 'var(--accent-hot)',
        'accent-cold': 'var(--accent-cold)',
        'accent-green': 'var(--accent-green)',
        'accent-red': 'var(--accent-red)',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      letterSpacing: {
        label: '0.08em',
      },
    },
  },
  plugins: [],
};
