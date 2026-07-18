import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "WarpShare | P2P File Sharing",
  description: "Offline-capable peer-to-peer file and text sharing for academic study groups.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // Prevents iOS input zoom
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased h-full`} suppressHydrationWarning>
      <body className="h-full bg-[var(--background)] text-[var(--foreground)] font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
