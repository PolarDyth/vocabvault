"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Volume2, ChevronRight } from "lucide-react"
import { Word } from "@/lib/types"

interface WordCardProps {
  word: Word
  onEdit?: (word: Word) => void
  onDelete?: (word: Word) => void
  onViewDetails?: (word: Word) => void
  showActions?: boolean
}

const categoryColors: Record<string, string> = {
  verb: "bg-blue-500/10 text-blue-600 border-blue-200",
  noun: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  "adjective-i": "bg-amber-500/10 text-amber-600 border-amber-200",
  "adjective-na": "bg-orange-500/10 text-orange-600 border-orange-200",
  adverb: "bg-purple-500/10 text-purple-600 border-purple-200",
  particle: "bg-pink-500/10 text-pink-600 border-pink-200",
  expression: "bg-cyan-500/10 text-cyan-600 border-cyan-200",
  counter: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
  other: "bg-gray-500/10 text-gray-600 border-gray-200",
}

const categoryLabels: Record<string, string> = {
  verb: "Verb",
  noun: "Noun",
  "adjective-i": "い-Adj",
  "adjective-na": "な-Adj",
  adverb: "Adverb",
  particle: "Particle",
  expression: "Expr",
  counter: "Counter",
  other: "Other",
}

export function WordCard({ word, onEdit, onDelete, onViewDetails, showActions = true }: WordCardProps) {
  const speakWord = () => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word.hiragana)
      utterance.lang = "ja-JP"
      utterance.rate = 0.8
      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <Card
      className="group hover:border-primary/20 transition-colors cursor-pointer"
      onClick={() => onViewDetails?.(word)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={`text-xs ${categoryColors[word.category] || categoryColors.other}`}>
                {categoryLabels[word.category] || "Other"}
              </Badge>
              {word.verb_type && (
                <Badge variant="outline" className="text-xs">
                  {word.verb_type}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 mb-2">
              {word.kanji && <span className="text-3xl font-light text-foreground japanese-text">{word.kanji}</span>}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  speakWord()
                }}
              >
                <Volume2 className="h-4 w-4" />
                <span className="sr-only">Pronounce</span>
              </Button>
            </div>
            <p className="text-lg text-muted-foreground japanese-text mb-1">{word.hiragana}</p>
            {word.romaji && <p className="text-sm text-muted-foreground/70 italic mb-3">{word.romaji}</p>}
            <p className="text-foreground line-clamp-2">{word.definition}</p>
            {word.tags && word.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {word.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {word.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{word.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            {showActions && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(word)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(word)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                )}
              </div>
            )}
            <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
