import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Import RainbowKit styles
import "@rainbow-me/rainbowkit/styles.css";

import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "socialbuzz.me",
  description: "The real-time stock market for culture.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
