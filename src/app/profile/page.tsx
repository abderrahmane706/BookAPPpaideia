import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { ProfileView } from "@/components/profile";

export const metadata: Metadata = {
  title: "Reader Profile — Paideia",
  description:
    "Your reading identity — name, portrait, goal and preferences, stored on this device only.",
};

export default function ProfilePage() {
  return (
    <AppShell>
      <ProfileView />
    </AppShell>
  );
}
