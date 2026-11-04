/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          gold: '#D4AF37',
          'gold-light': '#F3E5AB',
          'gold-accent': '#C59A3F',
          'gold-dark': '#8E6B23',
          dark: '#0e0b09',
          darker: '#080605',
          surface: '#181412',
          cream: '#FAF7F2',
          'cream-light': '#FDFCFA',
          'cream-card': '#FFFDFB',
          'cream-muted': '#EFE8DE'
        },
        primary: {
          DEFAULT: "#775a00",
          container: "#c59b27",
          fixed: "#ffdf98",
          'fixed-dim': "#eec14b",
        },
        'on-primary': {
          DEFAULT: "#ffffff",
          container: "#473500",
          fixed: "#251a00",
          'fixed-variant': "#5a4300",
        },
        secondary: {
          DEFAULT: "#605e5c",
          container: "#e3dfdc",
          fixed: "#e6e1df",
          'fixed-dim': "#cac6c3",
        },
        'on-secondary': {
          DEFAULT: "#ffffff",
          container: "#656260",
          fixed: "#1d1b1a",
          'fixed-variant': "#484645",
        },
        tertiary: {
          DEFAULT: "#745b1a",
          container: "#bc9d56",
          fixed: "#ffdf9b",
          'fixed-dim': "#e4c277",
        },
        'on-tertiary': {
          DEFAULT: "#ffffff",
          container: "#483500",
          fixed: "#251a00",
          'fixed-variant': "#5a4302",
        },
        surface: {
          DEFAULT: "#fcf9f4",
          bright: "#fcf9f4",
          dim: "#dcdad5",
          variant: "#e5e2dd",
          container: "#f0ede9",
          'container-lowest': "#ffffff",
          'container-low': "#f6f3ee",
          'container-high': "#ebe8e3",
          'container-highest': "#e5e2dd",
        },
        'inverse-surface': "#31302d",
        'inverse-on-surface': "#f3f0eb",
        'on-surface': {
          DEFAULT: "#1c1c19",
          variant: "#4e4635",
        },
        outline: {
          DEFAULT: "#807663",
          variant: "#d1c5af",
        },
        error: {
          DEFAULT: "#ba1a1a",
          container: "#ffdad6",
        },
        'on-error': {
          DEFAULT: "#ffffff",
          container: "#93000a",
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Playfair Display"', 'Georgia', 'serif'],
        playfair: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      }
    },
  },
  plugins: [],
};

