export interface NavItem {
  label: string;
  href: string;
  description: string;
}

/** Primary top-level navigation areas. */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", description: "Your reading workspace" },
  { label: "Library", href: "/library", description: "Your books" },
  { label: "Agora", href: "/agora", description: "Daily recall & reflection" },
  {
    label: "Assistant",
    href: "/agora/assistant",
    description: "Ask about your reading",
  },
  { label: "Insights", href: "/insights", description: "Your reading patterns" },
  { label: "Profile", href: "/profile", description: "Your reading identity" },
];
