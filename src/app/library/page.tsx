import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { LibraryView } from "@/components/library/LibraryView";

export const metadata: Metadata = {
  title: "Library — Paideia",
  description: "Your personal reading library.",
};

export default function LibraryPage() {
  return (
    <AppShell>
      <LibraryView />
    </AppShell>
  );
}
