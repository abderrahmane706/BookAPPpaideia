import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { AgoraView } from "@/components/agora";

export const metadata: Metadata = {
  title: "Agora — Paideia",
  description:
    "Daily recall and reflection on what you have read, drawn from your own notes, quotations and reflections.",
};

export default function AgoraPage() {
  return (
    <AppShell>
      <AgoraView />
    </AppShell>
  );
}
