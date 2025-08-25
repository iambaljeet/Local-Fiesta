import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Local AI Fiesta",
  description: "Your local AI party hub - Connect, chat, and manage multiple AI models simultaneously from LM Studio",
  keywords: ["AI", "LM Studio", "local AI", "multiple models", "chat", "fiesta", "party"],
  authors: [{ name: "Local AI Fiesta" }],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/fiesta-icon.svg', type: 'image/svg+xml' }
    ],
    apple: '/fiesta-icon.svg',
    shortcut: '/favicon.svg',
  },
  manifest: '/manifest.json',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FFE66D',
  colorScheme: 'light',
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
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
