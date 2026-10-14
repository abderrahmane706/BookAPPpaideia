import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { InsightsView } from "@/components/insights";

export const metadata: Metadata = {
  title: "Reading Insights — Paideia",
  description:
    "A data-driven account of your reading: completion, activity, streaks and composition.",
};

export default function InsightsPage() {
  return (
    <AppShell>
      <InsightsView />
    </AppShell>
  );
}
