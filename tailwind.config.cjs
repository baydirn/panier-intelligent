module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#374151',
        muted: '#6b7280',
        accent: '#10b981'
      },
      borderRadius: {
        DEFAULT: '0.5rem'
      }
    }
  },
  plugins: []
};
