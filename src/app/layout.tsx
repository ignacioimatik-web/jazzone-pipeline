import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JazzOne - Curated Library",
  description: "Music pipeline for YouTube to Navidrome ingestion",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A0A0A",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Tailwind CSS CDN + custom config (needed by original HTML) */}
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary-fixed-dim": "#ebb2ff",
        "secondary": "#ddfcff",
        "on-primary-fixed": "#320047",
        "primary-container": "#bc13fe",
        "tertiary": "#c6c6c7",
        "surface-glass": "rgba(255,255,255,0.05)",
        "surface-container": "#201f1f",
        "surface-container-high": "#2a2a2a",
        "on-tertiary-container": "#040506",
        "outline": "#9d8ba0",
        "on-primary-fixed-variant": "#74009f",
        "error-container": "#93000a",
        "background": "#131313",
        "on-secondary-fixed": "#002022",
        "on-tertiary-fixed": "#1a1c1c",
        "on-surface": "#e5e2e1",
        "inverse-on-surface": "#313030",
        "on-secondary-fixed-variant": "#004f54",
        "error": "#ffb4ab",
        "secondary-fixed-dim": "#00dbe7",
        "surface-variant": "#353534",
        "on-error-container": "#ffdad6",
        "primary": "#ebb2ff",
        "tertiary-fixed-dim": "#c6c6c7",
        "secondary-container": "#00f1fe",
        "primary-fixed": "#f8d8ff",
        "on-error": "#690005",
        "neon-purple-glow": "rgba(188,19,254,0.4)",
        "surface-container-lowest": "#0e0e0e",
        "neon-teal-glow": "rgba(0,242,255,0.3)",
        "surface-container-highest": "#353534",
        "on-primary": "#520072",
        "surface-bright": "#3a3939",
        "secondary-fixed": "#74f5ff",
        "inverse-primary": "#9800d0",
        "outline-variant": "#504254",
        "on-tertiary": "#2f3131",
        "on-secondary-container": "#006a70",
        "surface-container-low": "#1c1b1b",
        "on-primary-container": "#ffffff",
        "inverse-surface": "#e5e2e1",
        "on-surface-variant": "#d4c0d7",
        "tertiary-fixed": "#e2e2e2",
        "surface-tint": "#ebb2ff",
        "tertiary-container": "#767777",
        "surface": "#131313",
        "on-tertiary-fixed-variant": "#454747",
        "border-glass": "rgba(255,255,255,0.12)",
        "surface-dim": "#131313",
        "on-secondary": "#00363a"
      },
      borderRadius: { DEFAULT: "0.25rem", lg: "0.5rem", xl: "0.75rem", full: "9999px" },
      spacing: { "stack-sm": "8px", "stack-md": "16px", "gutter": "24px", "margin-mobile": "16px", "container-max": "1440px", "margin-desktop": "48px", "stack-lg": "32px" },
      fontFamily: { "label-caps": ["JetBrains Mono", "monospace"], "body-sm": ["JetBrains Mono", "monospace"], "title-md": ["JetBrains Mono", "monospace"], "headline-lg": ["JetBrains Mono", "monospace"], "headline-lg-mobile": ["JetBrains Mono", "monospace"], "display-lg": ["JetBrains Mono", "monospace"], "headline-xl": ["JetBrains Mono", "monospace"], "body-lg": ["JetBrains Mono", "monospace"] },
      fontSize: { "label-caps": ["12px", { lineHeight: "1", letterSpacing: "0.1em", fontWeight: "700" }], "body-sm": ["14px", { lineHeight: "1.6", fontWeight: "400" }], "title-md": ["18px", { lineHeight: "1.5", fontWeight: "600" }], "headline-lg": ["32px", { lineHeight: "1.2", fontWeight: "700" }], "headline-lg-mobile": ["28px", { lineHeight: "1.2", fontWeight: "700" }], "display-lg": ["56px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "900" }], "headline-xl": ["40px", { lineHeight: "1.2", fontWeight: "700" }], "body-lg": ["16px", { lineHeight: "1.6", fontWeight: "400" }] }
    }
  }
};
`
          }}
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400;0,600;0,700;0,800;1,400;1,700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
