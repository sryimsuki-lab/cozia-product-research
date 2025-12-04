import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                cream: {
                    DEFAULT: "var(--cream)",
                    dark: "var(--cream-dark)",
                },
                charcoal: {
                    DEFAULT: "var(--charcoal)",
                    light: "var(--charcoal-light)",
                },
                sage: {
                    DEFAULT: "var(--sage)",
                    dark: "var(--sage-dark)",
                    light: "var(--sage-light)",
                },
                gold: {
                    DEFAULT: "var(--gold)",
                    light: "var(--gold-light)",
                },
                success: "#22C55E",
                warning: "#EAB308",
                error: "#EF4444",
            },
            padding: {
                'safe': 'env(safe-area-inset-bottom)',
            },
        },
    },
    plugins: [],
};
export default config;
