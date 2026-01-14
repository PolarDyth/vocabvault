import type React from "react"
import type { Metadata } from "next"
import { Inter, Geist_Mono, Noto_Sans_JP } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { AlphaBanner } from "@/components/alpha-banner"
import "./globals.css"


export const metadata: Metadata = {
  title: "VocabVault - Your Words, Your Way",
  description:
    "Build, organize, and master your Japanese vocabulary with intelligent flashcards and AI-powered learning assistance",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AlphaBanner />
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
