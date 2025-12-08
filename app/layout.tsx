import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from '@/components/providers'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Status Mines - Provable Fair Mines Game on Status Network | STT Tokens",
  description: "Play the ultimate provable fair mines game on Status Network. Mine diamonds, avoid dynamite, and win STT tokens. Built for crypto gamers and developers. Transparent, verifiable, and fair gaming experience.",
  keywords: [
    "mines game",
    "status network",
    "STT tokens",
    "crypto gaming",
    "provable fair",
    "blockchain game",
    "web3 gaming",
    "decentralized gaming",
    "status blockchain",
    "crypto miners",
    "fair play gaming",
  ],
  authors: [{ name: "Status Network" }],
  creator: "Status Network",
  publisher: "Status Network",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://karma-mines.status.network",
    siteName: "Status Mines",
    title: "Status Mines - Provable Fair Mines Game on Status Network",
    description: "Mine diamonds, avoid dynamite, and win STT tokens. The ultimate provable fair mines game built for crypto gamers and developers on Status Network.",
    images: [
      {
        url: "https://ox35safakaidjuzg.public.blob.vercel-storage.com/OGG.png",
        width: 1200,
        height: 630, // WhatsApp recommended ratio is 1.91:1 (1200x630)
        alt: "Status Mines - Provable Fair Mines Game on Status Network",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Status Mines - Provable Fair Mines Game on Status Network",
    description: "Mine diamonds, avoid dynamite, and win STT tokens. Built for crypto gamers and developers.",
    images: ["https://ox35safakaidjuzg.public.blob.vercel-storage.com/OGG.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add verification codes if available
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
