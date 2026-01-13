"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { WordCategory } from "@/lib/types"

interface CategoryFilterProps {
  selectedCategory: WordCategory | "all"
  onCategoryChange: (category: WordCategory | "all") => void
  categoryCounts: Record<string, number>
}

const categories: { value: WordCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "verb", label: "Verbs" },
  { value: "noun", label: "Nouns" },
  { value: "adjective-i", label: "い-Adj" },
  { value: "adjective-na", label: "な-Adj" },
  { value: "adverb", label: "Adverbs" },
  { value: "particle", label: "Particles" },
  { value: "expression", label: "Expressions" },
  { value: "other", label: "Other" },
]

export function CategoryFilter({ selectedCategory, onCategoryChange, categoryCounts }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map(({ value, label }) => {
        const count =
          value === "all" ? Object.values(categoryCounts).reduce((a, b) => a + b, 0) : categoryCounts[value] || 0

        if (value !== "all" && count === 0) return null

        return (
          <Button
            key={value}
            variant={selectedCategory === value ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryChange(value)}
            className="gap-2"
          >
            {label}
            <Badge variant={selectedCategory === value ? "secondary" : "outline"} className="text-xs px-1.5">
              {count}
            </Badge>
          </Button>
        )
      })}
    </div>
  )
}
