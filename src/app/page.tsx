import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard/Dashboard";

export const metadata: Metadata = {
  title: "Paideia — A Reader's Library",
  description:
    "Your reading dashboard: continue where you paused, browse your library, and see the shape of your reading life.",
};

export default function DashboardPage() {
  return <Dashboard />;
}
