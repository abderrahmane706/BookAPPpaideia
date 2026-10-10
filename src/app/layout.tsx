import type { Metadata, Viewport } from "next";
import {
  GFS_Didot,
  Public_Sans,
  Source_Serif_4,
} from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Classical Greek display typeface — used for H1, chapter titles, and major
// section headings only. Weight 400 is the only cut GFS Didot ships; Didot's
// high contrast reads beautifully at display sizes without artificial bolding.
const display = GFS_Didot({
  variable: "--font-display",
  subsets: ["greek", "latin"],
  weight: "400",
  style: "normal",
  display: "swap",
});

// "Mesures" — a set of 26 decorative dingbats mapped to a–z, used as sparse
// ornamental flourishes (divider strokes, corner marks) rather than UI icons.
const ornament = localFont({
  src: "./fonts/mesures.ttf",
  variable: "--font-ornament",
  display: "swap",
});

// Literary / supporting text.
const body = Source_Serif_4({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

// Functional UI — letterspaced editorial labels, small caps, micro-text.
const utility = Public_Sans({
  variable: "--font-utility",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
      className={`${display.variable} ${body.variable} ${utility.variable} ${ornament.variable} ${body.className} h-full`}
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
      <body className="min-h-full">{children}</body>
    </html>
  );
}
