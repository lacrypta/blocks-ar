import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FeedsManager } from "@/components/exchanges/FeedsManager";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteTitle = "Blocks.AR — Sats argentos";
const siteDescription =
  "Precio del Bitcoin en pesos argentinos en tiempo real: paridad 1 SAT = 1 ARS, brokers, dólares y exchanges con Lightning.";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://blocks.ar";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  applicationName: "Blocks.AR",
  authors: [{ name: "Agustin Kassis", url: "https://github.com/agustinkassis" }],
  creator: "Agustin Kassis",
  publisher: "La Crypta",
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    siteName: "Blocks.AR",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es-AR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-fg">
        <Providers>
          <FeedsManager />
          <Header />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
