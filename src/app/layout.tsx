import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

import { RefreshButton } from "@/components/shared/refresh-button";

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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="border-b">
          <div className="container mx-auto flex items-center justify-between px-6 py-3">
            <Link href="/" className="text-lg font-semibold">
              cc-dash
            </Link>
            <RefreshButton />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
