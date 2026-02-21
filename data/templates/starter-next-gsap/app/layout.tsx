import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Superhero Workspace",
  description: "Local workspace preview",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
