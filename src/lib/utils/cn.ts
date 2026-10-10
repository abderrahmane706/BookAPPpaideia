export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | ClassValue[];

/**
 * Minimal class-name joiner (avoids extra dependencies).
 * Filters falsy values and flattens arrays.
 */
export function cn(...values: ClassValue[]): string {
  const parts: string[] = [];
  for (const value of values) {
    if (!value) continue;
    if (Array.isArray(value)) {
      parts.push(cn(...value));
    } else if (typeof value === "string") {
      parts.push(value);
    }
  }
  return parts.join(" ").trim();
}
