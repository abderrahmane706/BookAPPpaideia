export interface ChapterArtworkConfig {
  /** Path to a PAIDEIA engraving asset (under /images/paideia). */
  src?: string;
  /** Which side the artwork sits on for the two-column composition. */
  position?: "left" | "right";
  /** Natural aspect ratio of the asset, e.g. "1774/887". */
  aspect?: string;
}

export interface Chapter {
  /** Roman numeral rendered as the chapter plate. */
  numeral: string;
  /** Two-digit chapter index, e.g. "01". */
  index: string;
  label: string;
  title: string;
  description?: string;
  /** Optional engraving for this chapter. */
  artwork?: ChapterArtworkConfig;
}
