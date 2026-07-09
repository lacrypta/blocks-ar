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

const siteTitle = "Blocks.AR — Bitcoin y sats en pesos argentinos";
const siteDescription =
  "Precio de Bitcoin y satoshis en pesos argentinos, con brokers locales, dólar, mempool, Bitstamp y Lightning en tiempo real.";
const siteUrl = "https://www.blocks.ar";
const socialImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Blocks.AR muestra el precio de 1 satoshi en pesos argentinos",
};
const themeIntroBootScript = `
(() => {
  try {
    const system = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const opposite = system === "dark" ? "light" : "dark";
    const root = document.documentElement;

    root.classList.remove("light", "dark");
    root.classList.add(opposite);
    root.style.colorScheme = opposite;
    localStorage.setItem("theme", opposite);
  } catch {}
})();
`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  applicationName: "Blocks.AR",
  authors: [{ name: "Agustin Kassis", url: "https://github.com/agustinkassis" }],
  creator: "Agustin Kassis",
  publisher: "La Crypta",
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "/",
    siteName: "Blocks.AR",
    locale: "es_AR",
    type: "website",
    images: [socialImage],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [socialImage],
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
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: themeIntroBootScript }}
        />
      </body>
    </html>
  );
}
