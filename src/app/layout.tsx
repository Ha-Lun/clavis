import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  variable: "--font-cormorant",
});

export const metadata: Metadata = {
  title: "Flux — AI Chat",
  description:
    "Your personal AI productivity app. Chat with multiple AI models, organize conversations into projects, and boost your workflow.",
  keywords: ["AI", "chat", "productivity", "assistant"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${cormorant.variable} font-sans antialiased min-h-screen font-light`}
      >
        {children}
      </body>
    </html>
  );
}
