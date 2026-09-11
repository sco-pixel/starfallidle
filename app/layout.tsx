import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Starfall Idle",
  description: "Train fourteen sci-fi skills, command an Aethelgard cruiser, explore hostile sectors, and build a persistent deep-space career.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
