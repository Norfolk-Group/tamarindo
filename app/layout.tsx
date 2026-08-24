import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AuthKitProvider } from "@workos-inc/authkit-nextjs/components";
import { workosConfigState } from "@/lib/auth/env";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nico — Tamarindo",
  description: "Tamarindo's AI consultant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        {workosConfigState() === "ready" ? (
          <AuthKitProvider>{children}</AuthKitProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
