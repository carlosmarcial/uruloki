import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/global.css";  // Updated import path
import SolanaProvider from "./components/SolanaProvider";
import { Providers } from "./providers";
import Script from 'next/script';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Uruloki",
  description: "AI-powered on-chain dex aggregator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script src="/tradingview-screenshot.js" strategy="afterInteractive" />
      </head>
      <body className={`${inter.className}`}>
        <Providers>
          <SolanaProvider>{children}</SolanaProvider>
        </Providers>
      </body>
    </html>
  );
}
