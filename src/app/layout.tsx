import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Fraunces,
  Instrument_Sans,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";

import { SidebarProvider } from "@/components/layout/sidebar-context";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { TopBar } from "@/components/layout/top-bar";
import { BottomDockServer } from "@/components/layout/bottom-dock-server";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { AutoRefreshProvider } from "@/components/shared/auto-refresh-provider";
import { getProjectNav } from "@/lib/projects/get-project-nav";
import { getProjectCards } from "@/lib/projects/get-projects";

const instrumentSans = Instrument_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "cc-dash",
  description: "Claude Code Project Dashboard",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [projects, projectCards] = await Promise.all([
    getProjectNav(),
    getProjectCards(),
  ]);

  // Calculate stats for the top bar
  const projectCount = projectCards.length;
  const activeSessionCount = projectCards.filter(
    (p) => p.hasActiveSession,
  ).length;
  const totalDone = projectCards.reduce((sum, p) => sum + p.doneCount, 0);
  const totalTasks = projectCards.reduce((sum, p) => sum + p.totalCount, 0);
  const completionPercent =
    totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${instrumentSans.variable} ${jetbrainsMono.variable} ${fraunces.variable} ${cormorant.variable} antialiased`}
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
        <SidebarProvider>
          <AutoRefreshProvider>
            <CommandPalette projects={projects} />
            <div className="flex min-h-screen flex-col">
              {/* Top bar - hidden on mobile */}
              <div className="hidden lg:block">
                <TopBar
                  projectCount={projectCount}
                  activeSessionCount={activeSessionCount}
                  completionPercent={completionPercent}
                />
              </div>

              <div className="flex flex-1 min-h-0">
                <AppSidebar projects={projects} />
                <div className="flex-1 flex flex-col min-w-0">
                  <MobileHeader />
                  <main className="flex-1 flex flex-col overflow-hidden">
                    {children}
                  </main>
                  <BottomDockServer />
                </div>
              </div>
            </div>
          </AutoRefreshProvider>
        </SidebarProvider>
      </body>
    </html>
  );
}
