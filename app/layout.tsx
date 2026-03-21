import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IntelliCredit — AI Credit Decisioning Engine",
  description: "AI-powered end-to-end corporate credit appraisal. From documents to decision in minutes, not weeks.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
