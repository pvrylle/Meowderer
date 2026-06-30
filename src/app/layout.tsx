import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { Toaster } from "@/components/ui/sonner";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_TAGLINE,
  applicationName: APP_NAME,
  manifest: "/manifest.json",
  icons: {
    icon: "/assets/iconnotext.svg",
    apple: "/assets/iconnotext.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
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
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
