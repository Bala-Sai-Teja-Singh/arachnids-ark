import type { Metadata } from "next";
import { Outfit, Syne } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { AppProvider } from "@/providers/app-provider";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ArachnidsArk | Premium Tarantula Collection & Care",
  description: "Discover rare and exotic tarantula species, expert care courses, and professional consultation services. Your premier destination for arachnid enthusiasts.",
  keywords: ["tarantula", "exotic pets", "arachnid", "spider", "pet care", "courses"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${syne.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <ThemeProvider>
          <TooltipProvider>
            <AppProvider>
              {children}
              <Toaster
                position="top-right"
                richColors
                closeButton
                theme="system"
                toastOptions={{
                  style: {
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                    opacity: 1,
                  },
                }}
              />
            </AppProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
