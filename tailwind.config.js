/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                background: '#0f172a', // Slate 900
                surface: '#1e293b',    // Slate 800
                primary: '#3b82f6',    // Blue 500
                secondary: '#64748b',  // Slate 500
                accent: '#8b5cf6',     // Violet 500
                success: '#10b981',    // Emerald 500
                warning: '#f59e0b',    // Amber 500
                error: '#ef4444',      // Red 500
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
