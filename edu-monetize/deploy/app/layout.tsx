import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import RegisterSW from "@/app/components/RegisterSW";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tiwane School",
  description: "Tiwane School – Lessons with video, notes, and presentations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const adsEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";
  return (
    <html lang="en">
      <head>
        {adsEnabled && adClient && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}
