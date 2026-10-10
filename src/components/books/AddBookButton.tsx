"use client";

import { useState } from "react";
import type { Book } from "@/lib/types/book";
import { Button } from "@/components/ui/Button";
import { BookFormModal } from "./BookFormModal";

export interface AddBookButtonProps {
  label?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  onCreated?: (book: Book) => void;
}

/** "Add Book" action that opens the create-book modal. */
export function AddBookButton({
  label = "+ Add a book",
  variant = "primary",
  size = "md",
  className,
  onCreated,
}: AddBookButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      <BookFormModal
        key={open ? "create-open" : "create-closed"}
        open={open}
        onClose={() => setOpen(false)}
        onSaved={onCreated}
      />
    </>
  );
}
