import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Adamos Fresh Eggs | Pasture-Raised Farm Eggs",
  description:
    "Modern farm-fresh egg storefront for pasture-raised eggs, heirloom cartons, and weekly farm-to-table subscriptions.",
  applicationName: "Adamos Inventory",
  icons: {
    icon: "/adamos-fresh-eggs-logo.jpg",
    apple: "/adamos-fresh-eggs-logo.jpg",
  },
};

export const viewport: Viewport = {
  themeColor: "#173b24",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
