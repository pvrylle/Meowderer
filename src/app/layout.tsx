import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

import { PhoneFrame } from "@/components/phone-frame";
import { Toaster } from "@/components/ui/sonner";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CatDex",
  description: "Catch, collect, and map the stray cats around you.",
  applicationName: "CatDex",
  manifest: "/manifest.json",
  icons: {
    icon: "/assets/iconnotext.svg",
    apple: "/assets/iconnotext.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CatDex",
  },
};

export const viewport: Viewport = {
  themeColor: "#9B7EDE",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} antialiased`}>
      <body className="font-sans">
        <PhoneFrame>{children}</PhoneFrame>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
