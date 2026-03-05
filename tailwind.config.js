var config = {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                bg: "#09090b",
                accent: "#EAB308",
            },
            fontFamily: {
                sans: ["var(--font-sans)"],
                serif: ["var(--font-serif)"],
                mono: ["var(--font-mono)"],
            },
            boxShadow: {
                glass: "0 24px 60px rgba(0, 0, 0, 0.45)",
            },
        },
    },
    plugins: [],
};
export default config;
