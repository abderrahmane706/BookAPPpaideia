export interface NavItem {
  label: string;
  href: string;
  description: string;
}

/** Primary top-level navigation areas. */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", description: "Your reading workspace" },
  { label: "Library", href: "/library", description: "Your books" },
];
