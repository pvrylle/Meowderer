import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

import { APP_NAME, APP_TAGLINE, BRAND_ICON, BRAND_ICON_PNG } from "@/lib/brand";
import { MobileExperienceHost } from "@/components/mobile-experience-host";
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
    icon: [
      { url: BRAND_ICON_PNG, sizes: "2000x2000", type: "image/png" },
      { url: BRAND_ICON, type: "image/svg+xml" },
    ],
    apple: [{ url: BRAND_ICON_PNG, type: "image/png" }],
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
        <MobileExperienceHost />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
