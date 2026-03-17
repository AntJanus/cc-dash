import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Lightbulb, Settings } from "lucide-react";
import "./globals.css";

import { RefreshButton } from "@/components/shared/refresh-button";
import { Button } from "@/components/ui/button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "cc-dash",
  description: "Claude Code Project Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
  (function() {
    try {
      var theme = JSON.parse(localStorage.getItem('cc-dash-theme') || '"light"');
      if (theme === 'system') {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      if (theme === 'dark') document.documentElement.classList.add('dark');
    } catch(e) {}
  })();
`,
          }}
        />
        <header className="border-b">
          <div className="container mx-auto flex items-center justify-between px-6 py-3">
            <Link href="/" className="text-lg font-semibold">
              cc-dash
            </Link>
            <div className="flex items-center gap-1">
              <Link href="/ideas">
                <Button variant="ghost" size="icon" aria-label="Ideas">
                  <Lightbulb className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="ghost" size="icon" aria-label="Settings">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
              <RefreshButton />
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
