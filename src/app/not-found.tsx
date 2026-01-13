"use client"

import { Button } from "@/components/ui/button"
import { BrandLogo } from "@/components/brand-logo"
import Link from "next/link"
import { Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center p-6 md:p-10 bg-background">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-8">
          <BrandLogo size="lg" href="/" />
        </div>
        
        {/* 404 Illustration */}
        <div className="relative mb-8">
          <div className="text-[10rem] font-bold leading-none text-primary/10 select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl">📚</div>
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-2">
          Page not found
        </h1>
        <p className="text-muted-foreground mb-8">
          Oops! This page seems to have wandered off like an unfamiliar kanji. 
          Let&apos;s get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/">
              <Home className="h-4 w-4" />
              Go to Dictionary
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3">
            Looking for something specific?
          </p>
          <div className="flex flex-wrap gap-2 justify-center text-sm">
            <Link 
              href="/dictionary" 
              className="text-primary hover:underline underline-offset-4"
            >
              Dictionary
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link 
              href="/flashcards" 
              className="text-primary hover:underline underline-offset-4"
            >
              Flashcards
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link 
              href="/profile" 
              className="text-primary hover:underline underline-offset-4"
            >
              Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
