import type { Metadata } from "next";
import { Cormorant_Garamond, Cinzel, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/context/theme-context";
import { ChatProvider } from "@/context/chat-context";
import "./globals.css";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://clavis.lundstromslogiska.se");

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  variable: "--font-cormorant",
  display: "swap",
  preload: false,
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-cinzel",
  display: "swap",
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-geist-mono",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Clavis | AI Academic Tutor & Socratic Teaching Assistant",
    template: "%s | Clavis",
  },
  description:
    "A patient, precise academic teaching assistant. Master complex topics through structured Socratic questioning, Canvas & Studium LMS integration, and deep lecture slide analysis.",
  keywords: [
    "Clavis",
    "AI tutor",
    "academic assistant",
    "Socratic AI",
    "Canvas LMS AI",
    "Studium AI",
    "Uppsala University AI",
    "lecture slides AI",
    "study assistant",
    "dark luxury AI",
  ],
  authors: [{ name: "Clavis" }],
  openGraph: {
    title: "Clavis | AI Academic Tutor & Socratic Teaching Assistant",
    description:
      "A patient, precise academic teaching assistant. Master complex topics through structured Socratic questioning, Canvas & Studium LMS integration, and deep lecture slide analysis.",
    url: BASE_URL,
    siteName: "Clavis",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clavis | AI Academic Tutor",
    description:
      "A patient, precise academic teaching assistant. Master complex topics through structured Socratic questioning, Canvas & Studium LMS integration, and deep lecture slide analysis.",
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
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "Clavis",
      url: BASE_URL,
      logo: `${BASE_URL}/icon-512.png`,
      description:
        "Clavis - The Dark Luxury AI Academic Tutor & Socratic Assistant.",
    },
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      url: BASE_URL,
      name: "Clavis",
      description: "AI Academic Tutor & Socratic Teaching Assistant",
      publisher: {
        "@id": `${BASE_URL}/#organization`,
      },
    },
    {
      "@type": ["WebApplication", "EducationalApplication"],
      "@id": `${BASE_URL}/#application`,
      name: "Clavis",
      url: BASE_URL,
      applicationCategory: "EducationalApplication",
      operatingSystem: "All",
      browserRequirements: "Requires JavaScript. Requires HTML5.",
      description:
        "A patient, precise academic teaching assistant. Master complex topics through structured Socratic questioning, Canvas & Studium LMS integration, and deep lecture slide analysis.",
      creator: {
        "@id": `${BASE_URL}/#organization`,
      },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${cormorantGaramond.variable} ${cinzel.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen font-light`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider>
          <ChatProvider>
            {children}
          </ChatProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
