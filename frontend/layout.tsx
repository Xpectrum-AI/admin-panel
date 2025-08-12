import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import CacheBuster from "./components/CacheBuster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Admin Panel for Xpectrum AI",
  // Add cache-busting meta tags
  other: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Force cache refresh */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        {/* Add build timestamp for cache busting */}
        <meta name="build-timestamp" content={process.env.NEXT_PUBLIC_BUILD_TIMESTAMP || Date.now().toString()} />
      </head>
      <body className={inter.className}>
        <CacheBuster>
          {children}
        </CacheBuster>
      </body>
    </html>
  );
}
