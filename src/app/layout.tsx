import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "MobileAckBar · Laelaps prototype",
  description: "Acknowledge a Laelaps alert one-handed on a 390px phone.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

// Dark by default: the scenario is a night-shift operator at 03:00.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
