import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { AssistantView } from "@/components/assistant";

export const metadata: Metadata = {
  title: "Assistant · PAIDEIA",
  description:
    "Ask about your own reading — summaries, notes, quotations and reflections. The assistant sees nothing but your library.",
};

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ book?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = params.book;
  const bookId = Array.isArray(raw) ? raw[0] : raw;

  return (
    <AppShell>
      <AssistantView bookId={bookId} />
    </AppShell>
  );
}
