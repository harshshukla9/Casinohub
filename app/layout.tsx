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
  title: "Karma Mines - Provable Fair Games on Monad | MON Tokens",
  description: "Play the ultimate provable fair games on Monad Testnet. Mine diamonds, avoid dynamite, and win MON tokens. Built for crypto gamers and developers. Transparent, verifiable, and fair gaming experience.",
  keywords: [
    "mines game",
    "monad network",
    "MON tokens",
    "crypto gaming",
    "provable fair",
    "blockchain game",
    "web3 gaming",
    "decentralized gaming",
    "monad blockchain",
    "crypto miners",
    "fair play gaming",
    "monad testnet",
  ],
  authors: [{ name: "Karma Mines" }],
  creator: "Karma Mines",
  publisher: "Karma Mines",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://karma-mines.vercel.app",
    siteName: "Karma Mines",
    title: "Karma Mines - Provable Fair Games on Monad",
    description: "Mine diamonds, avoid dynamite, and win MON tokens. The ultimate provable fair games built for crypto gamers and developers on Monad.",
    images: [
      {
        url: "https://ox35safakaidjuzg.public.blob.vercel-storage.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Karma Mines - Provable Fair Games on Monad",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Karma Mines - Provable Fair Games on Monad",
    description: "Mine diamonds, avoid dynamite, and win MON tokens. Built for crypto gamers and developers.",
    images: ["https://ox35safakaidjuzg.public.blob.vercel-storage.com/og-image.png"],
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
