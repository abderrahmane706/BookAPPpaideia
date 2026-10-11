import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { MindMapScreen } from "@/components/mind-map";

export const metadata: Metadata = {
  title: "Mind map — Paideia",
  description: "Map a book's ideas, arguments and structure as connected nodes.",
};

export default async function MindMapPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ map?: string }>;
}) {
  const { id } = await params;
  const { map } = await searchParams;

  return (
    <AppShell>
      <MindMapScreen bookId={id} initialMapId={map} />
    </AppShell>
  );
}
