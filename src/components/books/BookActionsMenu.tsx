"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface BookActionsMenuProps {
  onOpen?: () => void;
  onEdit?: () => void;
  onExport?: () => void;
  onDelete?: () => void;
  label?: string;
}

/**
 * Contextual menu for a book card. Keyboard- and pointer-accessible: opens on
 * click, closes on outside click, Escape, or after choosing an action. Stops
 * propagation so it never triggers the card's own navigation.
 */
export function BookActionsMenu({
  onOpen,
  onEdit,
  onExport,
  onDelete,
  label = "Book actions",
}: BookActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
        className="btn-press flex h-8 w-8 items-center justify-center rounded-radius-sm border border-line bg-surface/90 font-utility text-base leading-none text-ink-soft backdrop-blur-sm transition-colors hover:border-engraving hover:text-engraving-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-engraving"
      >
        <span aria-hidden>⋯</span>
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={label}
          className="absolute right-0 top-full z-20 mt-1 w-44 border border-line bg-surface-raised py-1 shadow-card-hover"
        >
          {onOpen ? (
            <MenuItem
              onClick={() => {
                setOpen(false);
                onOpen();
              }}
            >
              Open workspace
            </MenuItem>
          ) : null}
          {onEdit ? (
            <MenuItem
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
            >
              Edit details
            </MenuItem>
          ) : null}
          {onExport ? (
            <MenuItem
              onClick={() => {
                setOpen(false);
                onExport();
              }}
            >
              Export
            </MenuItem>
          ) : null}
          {onDelete ? (
            <MenuItem
              danger
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
            >
              Delete
            </MenuItem>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "block w-full px-3 py-2 text-left font-utility text-sm transition-colors",
        "focus:outline-none focus-visible:bg-engraving/10",
        danger
          ? "text-danger hover:bg-danger/10"
          : "text-ink-soft hover:bg-engraving/10 hover:text-engraving-deep",
      )}
    >
      {children}
    </button>
  );
}
