"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Search, Sparkles, Check, AlertCircle, Volume2 } from "lucide-react"
import { Word, WordCategory } from "@/lib/types"
import { DictionaryResult } from "@/app/api/dictionary/lookup/route"
import { detectVerbType } from "@/lib/configuration"

interface WordFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: WordFormData) => Promise<void>
  initialData?: Word | null
  isLoading?: boolean
}

export interface WordFormData {
  kanji: string
  hiragana: string
  romaji: string
  definition: string
  notes: string
  tags: string
  category: WordCategory
  verbType: string | null
}

export function WordForm({ open, onOpenChange, onSubmit, initialData, isLoading }: WordFormProps) {
  const [formData, setFormData] = useState<WordFormData>({
    kanji: initialData?.kanji || "",
    hiragana: initialData?.hiragana || "",
    romaji: initialData?.romaji || "",
    definition: initialData?.definition || "",
    notes: initialData?.notes || "",
    tags: initialData?.tags?.join(", ") || "",
    category: initialData?.category || "other",
    verbType: initialData?.verb_type || null,
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [lookupResults, setLookupResults] = useState<DictionaryResult[]>([])
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [selectedResult, setSelectedResult] = useState<number | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        kanji: initialData.kanji || "",
        hiragana: initialData.hiragana || "",
        romaji: initialData.romaji || "",
        definition: initialData.definition || "",
        notes: initialData.notes || "",
        tags: initialData.tags?.join(", ") || "",
        category: initialData.category || "other",
        verbType: initialData.verb_type || null,
      })
    }
  }, [initialData])

  // Reset search state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("")
      setLookupResults([])
      setLookupError(null)
      setSelectedResult(null)
      setHasSearched(false)
      if (!initialData) {
        setFormData({
          kanji: "",
          hiragana: "",
          romaji: "",
          definition: "",
          notes: "",
          tags: "",
          category: "other",
          verbType: null,
        })
      }
    }
  }, [open, initialData])

  const lookupWord = useCallback(async (query: string) => {
    if (!query.trim()) return

    setIsLookingUp(true)
    setLookupError(null)
    setSelectedResult(null)
    setHasSearched(true)

    try {
      const response = await fetch(`/api/dictionary/lookup?q=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to lookup word")
      }

      setLookupResults(data.results || [])

      // Auto-select the first result if available
      if (data.results && data.results.length > 0) {
        selectResult(data.results[0], 0)
      }
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : "Lookup failed")
      setLookupResults([])
    } finally {
      setIsLookingUp(false)
    }
  }, [])

  const selectResult = (result: DictionaryResult, index: number) => {
    setSelectedResult(index)

    // Use category from API result if available, otherwise detect it
    let category: WordCategory = result.category || "other"
    let verbType: string | null = result.verbType || null

    // If category wasn't provided by API, detect it from parts of speech
    if (!result.category || result.category === "other") {
      const pos = result.partsOfSpeech?.join(" ").toLowerCase() || ""
      const tags = result.tags || []

      // Check for specific categories in order of specificity (most specific first)
      if (pos.includes("counter")) {
        category = "counter"
      } else if (pos.includes("adverb") || pos.includes("adv")) {
        category = "adverb"
      } else if (pos.includes("particle")) {
        category = "particle"
      } else if (pos.includes("expression") || pos.includes("exp")) {
        category = "expression"
      } else if (pos.includes("i-adjective") || pos.includes("adj-i")) {
        category = "adjective-i"
      } else if (pos.includes("na-adjective") || pos.includes("adj-na")) {
        category = "adjective-na"
      } else if (pos.includes("verb") || pos.includes("v1") || pos.includes("v5") || pos.includes("vs")) {
        category = "verb"
        if (!verbType) {
          verbType = detectVerbType(result.hiragana, [...(result.partsOfSpeech || []), ...tags])
        }
      } else if (pos.includes("noun") || pos.includes("n ")) {
        category = "noun"
      }
    }

    // If verb type wasn't provided and category is verb, detect it
    if (category === "verb" && !verbType) {
      const tags = result.tags || []
      verbType = detectVerbType(result.hiragana, [...(result.partsOfSpeech || []), ...tags])
    }

    setFormData({
      ...formData,
      kanji: result.kanji || "",
      hiragana: result.hiragana,
      romaji: result.romaji,
      definition: result.definition,
      tags: (result.tags || []).join(", "),
      category,
      verbType,
    })
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      lookupWord(searchQuery)
    }
  }

  const speakWord = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "ja-JP"
      utterance.rate = 0.8
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
    if (!initialData) {
      setFormData({
        kanji: "",
        hiragana: "",
        romaji: "",
        definition: "",
        notes: "",
        tags: "",
        category: "other",
        verbType: null,
      })
      setSearchQuery("")
      setLookupResults([])
      setHasSearched(false)
    }
  }

  const handleCategoryChange = (value: WordCategory) => {
    let verbType = formData.verbType
    if (value === "verb" && !verbType && formData.hiragana) {
      verbType = detectVerbType(
        formData.hiragana,
        formData.tags.split(",").map((t) => t.trim()),
      )
    } else if (value !== "verb") {
      verbType = null
    }
    setFormData({ ...formData, category: value, verbType })
  }

  const isEditMode = !!initialData

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Word" : "Add New Word"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the word details below"
              : "Search for a Japanese word to auto-fill details, or enter manually"}
          </DialogDescription>
        </DialogHeader>

        {!isEditMode && (
          <div className="border-b pb-4 mb-4">
            <Label htmlFor="search" className="text-sm font-medium flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Auto-Lookup Dictionary
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Enter Japanese or English word (e.g., 食べる, taberu, eat)"
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
              </div>
              <Button
                type="button"
                onClick={() => lookupWord(searchQuery)}
                disabled={isLookingUp || !searchQuery.trim()}
              >
                {isLookingUp ? "Searching..." : "Search"}
              </Button>
            </div>

            {/* Lookup Results */}
            {isLookingUp && (
              <div className="mt-4 space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            )}

            {lookupError && (
              <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {lookupError}
              </div>
            )}

            {hasSearched && !isLookingUp && lookupResults.length === 0 && !lookupError && (
              <div className="mt-4 p-4 bg-muted/50 rounded-md text-center text-muted-foreground">
                <p>No results found. You can enter the word details manually below.</p>
              </div>
            )}

            {lookupResults.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Found {lookupResults.length} result{lookupResults.length > 1 ? "s" : ""}. Click to select:
                </p>
                <div className="grid gap-2 max-h-48 overflow-y-auto">
                  {lookupResults.map((result, index) => (
                    <div
                      key={index}
                      onClick={() => selectResult(result, index)}
                      className={`p-3 rounded-md border text-left transition-colors hover:bg-accent cursor-pointer ${
                        selectedResult === index ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {result.kanji && <span className="text-xl font-light japanese-text">{result.kanji}</span>}
                          <span className="text-muted-foreground japanese-text">{result.hiragana}</span>
                          <span className="text-sm text-muted-foreground/70 italic">{result.romaji}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation()
                              speakWord(result.hiragana)
                            }}
                          >
                            <Volume2 className="h-3 w-3" />
                          </Button>
                        </div>
                        {selectedResult === index && <Check className="h-4 w-4 text-primary" />}
                      </div>
                      <p className="text-sm mt-1 line-clamp-2">{result.definition}</p>
                      {result.partsOfSpeech && result.partsOfSpeech.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {result.partsOfSpeech.slice(0, 3).map((pos) => (
                            <Badge key={pos} variant="secondary" className="text-xs">
                              {pos}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleCategoryChange(value as WordCategory)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verb">Verb</SelectItem>
                    <SelectItem value="noun">Noun</SelectItem>
                    <SelectItem value="adjective-i">い-Adjective</SelectItem>
                    <SelectItem value="adjective-na">な-Adjective</SelectItem>
                    <SelectItem value="adverb">Adverb</SelectItem>
                    <SelectItem value="particle">Particle</SelectItem>
                    <SelectItem value="expression">Expression</SelectItem>
                    <SelectItem value="counter">Counter</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.category === "verb" && (
                <div className="grid gap-2">
                  <Label htmlFor="verbType">Verb Type</Label>
                  <Select
                    value={formData.verbType || ""}
                    onValueChange={(value) => setFormData({ ...formData, verbType: value || null })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ichidan">Ichidan (る-verb)</SelectItem>
                      <SelectItem value="godan">Godan (う-verb)</SelectItem>
                      <SelectItem value="suru">する verb</SelectItem>
                      <SelectItem value="kuru">くる verb</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="kanji">Kanji (optional)</Label>
                <Input
                  id="kanji"
                  placeholder="言葉"
                  className="text-xl japanese-text"
                  value={formData.kanji}
                  onChange={(e) => setFormData({ ...formData, kanji: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hiragana">Hiragana *</Label>
                <Input
                  id="hiragana"
                  placeholder="ことば"
                  className="text-lg japanese-text"
                  required
                  value={formData.hiragana}
                  onChange={(e) => setFormData({ ...formData, hiragana: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="romaji">Romaji (optional)</Label>
              <Input
                id="romaji"
                placeholder="kotoba"
                value={formData.romaji}
                onChange={(e) => setFormData({ ...formData, romaji: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="definition">Definition *</Label>
              <Textarea
                id="definition"
                placeholder="word; language; speech"
                required
                className="min-h-20"
                value={formData.definition}
                onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes, example sentences, memory aids..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (optional, comma-separated)</Label>
              <Input
                id="tags"
                placeholder="JLPT N5, common"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.hiragana || !formData.definition}>
              {isLoading ? "Saving..." : isEditMode ? "Update Word" : "Add Word"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
