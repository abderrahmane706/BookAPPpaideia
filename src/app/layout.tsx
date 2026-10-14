import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThresholdGate } from "@/components/threshold";

// All application fonts are self-hosted (next/font/local) so the production
// build never depends on downloading fonts from Google at build time — the
// Turbopack `next/font/google` loader is what broke the Vercel build. The
// families, weights, and CSS variables are unchanged from the previous
// `next/font/google` configuration, so the typographic identity is preserved.

// Classical Greek display typeface — used for H1, chapter titles, and major
// section headings only. GFS Didot ships a single static 400 cut; the file
// bundles Greek + Latin so the "Π" mark and any Greek text stay in-face.
const display = localFont({
  src: "./fonts/gfs-didot-regular.ttf",
  variable: "--font-display",
  weight: "400",
  style: "normal",
  display: "swap",
});

// Classical editorial serif — used for editorial titles (section leads, book
// titles, card headings) where Didot would be too austere. Variable weight
// (300–700) with a real italic.
const editorial = localFont({
  src: [
    {
      path: "./fonts/cormorant-garamond.woff2",
      weight: "300 700",
      style: "normal",
    },
    {
      path: "./fonts/cormorant-garamond-italic.woff2",
      weight: "300 700",
      style: "italic",
    },
  ],
  variable: "--font-editorial",
  display: "swap",
});

// "Mesures" — a set of 26 decorative dingbats mapped to a–z, used as sparse
// ornamental flourishes (divider strokes, corner marks) rather than UI icons.
const ornament = localFont({
  src: "./fonts/mesures.ttf",
  variable: "--font-ornament",
  display: "swap",
});

// Literary / supporting text. Variable weight (200–900) with a real italic.
const body = localFont({
  src: [
    {
      path: "./fonts/source-serif-4.woff2",
      weight: "200 900",
      style: "normal",
    },
    {
      path: "./fonts/source-serif-4-italic.woff2",
      weight: "200 900",
      style: "italic",
    },
  ],
  variable: "--font-body",
  display: "swap",
});

// Functional UI — letterspaced editorial labels, small caps, micro-text.
// Variable weight (100–900).
const utility = localFont({
  src: "./fonts/public-sans.woff2",
  variable: "--font-utility",
  weight: "100 900",
  style: "normal",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Paideia — A Reader's Library",
    template: "%s · Paideia",
  },
  description:
    "Paideia is a personal digital library and scholar's workspace — turning books into structured knowledge through progress, notes, summaries, mind maps and reading intelligence.",
};

// Explicit mobile-friendly viewport.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${utility.variable} ${ornament.variable} ${editorial.variable} ${body.className} h-full`}
    >
      <head>
        {/* Resolve the theme before first paint to avoid a flash of the wrong
            theme. Reads the saved choice; falls back to the system preference
            only when the user has not chosen explicitly. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('paideia-theme');if(t!=='dark'&&t!=='light'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}var e=document.documentElement;e.dataset.theme=t;e.style.colorScheme=t;}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full">
        <ThresholdGate>{children}</ThresholdGate>
      </body>
    </html>
  );
}
