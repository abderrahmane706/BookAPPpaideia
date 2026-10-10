import type { ReactNode } from "react";
import { FeedbackViewport } from "@/components/ui/feedback";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export interface AppShellProps {
  children: ReactNode;
  /** When false, hides the fixed header + sidebar (e.g. focused workspaces). */
  withChrome?: boolean;
}

/**
 * Main application shell — the scholarly editorial workspace.
 * Composes the persistent left Sidebar, the restrained top Header, and the main
 * scrolling content column. On large screens the sidebar sits as a permanent
 * left rail; on small screens it collapses to a compact horizontal strip.
 */
export function AppShell({ children, withChrome = true }: AppShellProps) {
  if (!withChrome) {
    return (
      <main>
        {children}
        <FeedbackViewport />
      </main>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />

      <div className="flex w-full flex-col gap-6 px-[clamp(1rem,4vw,2rem)] py-8 lg:flex-row lg:gap-0 lg:py-0">
        <Sidebar className="lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-64" />

        <main className="flex-1 pb-20 lg:pl-10">{children}</main>
      </div>

      <FeedbackViewport />
    </div>
  );
}
