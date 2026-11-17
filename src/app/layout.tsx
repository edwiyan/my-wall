import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wall",
  description: "A 2008-style wall: write a message, press Share, and see it live. Built with Next.js and Supabase.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
