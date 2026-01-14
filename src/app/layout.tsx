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
