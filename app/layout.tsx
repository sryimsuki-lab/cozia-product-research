import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider, LanguageToggle } from "@/components/LanguageToggle";
import { Navigation } from "@/components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "COZIA Product Research",
    description: "Internal tool for COZIA dropshipping team",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.className} min-h-screen`} suppressHydrationWarning={true}>
                <LanguageProvider>
                    <div className="flex min-h-screen bg-[var(--bg-main)]">
                        {/* Sidebar Navigation */}
                        <Navigation />

                        {/* Main Content */}
                        <main className="flex-1 p-8 overflow-y-auto h-screen">
                            <div className="flex justify-end mb-6">
                                <LanguageToggle />
                            </div>

                            <div className="max-w-7xl mx-auto">
                                {children}
                            </div>
                        </main>
                    </div>
                </LanguageProvider>
            </body>
        </html>
    );
}
