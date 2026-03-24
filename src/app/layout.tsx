import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { SidebarProvider } from "@/components/layout/sidebar-context";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { TopBar } from "@/components/layout/top-bar";
import { getProjectNav } from "@/lib/projects/get-project-nav";
import { getProjectCards } from "@/lib/projects/get-projects";

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
        <SidebarProvider>
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
              </div>
            </div>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
