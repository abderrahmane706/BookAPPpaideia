import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { BookWorkspace } from "@/components/workspace";

export const metadata: Metadata = {
  title: "Book — Paideia",
  description: "Read, summarise and reflect — your personal reading workspace.",
};

export default async function BookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell>
      <BookWorkspace bookId={id} />
    </AppShell>
  );
}
