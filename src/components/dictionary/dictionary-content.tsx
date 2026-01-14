"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { WordCard } from "@/components/dictionary/word-card"
import { Plus, Search, BookOpen } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { Word, WordCategory } from "@/lib/types"
import { WordForm, WordFormData } from "./word-form"
import { EmptyState } from "../empty-state"
import { WordDetailDialog } from "./word-detail-dialog"
import { DeleteConfirmDialog } from "../delete-confirm-dialog"
import { CategoryFilter } from "./category-filter"

interface DictionaryContentProps {
  initialWords: Word[]
  userId: string
}

const fetcher = async (userId: string): Promise<Word[]> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("words")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export function DictionaryContent({ initialWords, userId }: DictionaryContentProps) {
  const { data: words = initialWords } = useSWR(["words", userId], () => fetcher(userId), {
    fallbackData: initialWords,
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<WordCategory | "all">("all")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingWord, setEditingWord] = useState<Word | null>(null)
  const [deletingWord, setDeletingWord] = useState<Word | null>(null)
  const [viewingWord, setViewingWord] = useState<Word | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingExamples, setIsGeneratingExamples] = useState(false)

  const categoryCounts = words.reduce<Record<string, number>>((acc, word) => {
    const cat = word.category || "other"
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {})

  const filteredWords = words.filter((word) => {
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      word.kanji?.toLowerCase().includes(query) ||
      word.hiragana.toLowerCase().includes(query) ||
      word.romaji?.toLowerCase().includes(query) ||
      word.definition.toLowerCase().includes(query) ||
      word.tags?.some((tag) => tag.toLowerCase().includes(query))

    const matchesCategory = selectedCategory === "all" || word.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const handleAddWord = async (formData: WordFormData) => {
    setIsLoading(true)
    const supabase = createClient()

    const tags = formData.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

    const { error } = await supabase.from("words").insert({
      user_id: userId,
      kanji: formData.kanji || null,
      hiragana: formData.hiragana,
      romaji: formData.romaji || null,
      definition: formData.definition,
      notes: formData.notes || null,
      tags: tags.length > 0 ? tags : null,
      category: formData.category,
      verb_type: formData.verbType,
      example_sentences: [],
      grammatical_info: {},
    })

    if (!error) {
      mutate(["words", userId])
      setIsFormOpen(false)
    }
    setIsLoading(false)
  }

  const handleEditWord = async (formData: WordFormData) => {
    if (!editingWord) return
    setIsLoading(true)
    const supabase = createClient()

    const tags = formData.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

    // Defense-in-depth: verify both id AND user_id to prevent unauthorized access
    const { error } = await supabase
      .from("words")
      .update({
        kanji: formData.kanji || null,
        hiragana: formData.hiragana,
        romaji: formData.romaji || null,
        definition: formData.definition,
        notes: formData.notes || null,
        tags: tags.length > 0 ? tags : null,
        category: formData.category,
        verb_type: formData.verbType,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingWord.id)
      .eq("user_id", userId)

    if (!error) {
      mutate(["words", userId])
      setEditingWord(null)
    }
    setIsLoading(false)
  }

  const handleDeleteWord = async () => {
    if (!deletingWord) return
    setIsLoading(true)
    const supabase = createClient()

    // Defense-in-depth: verify both id AND user_id to prevent unauthorized access
    const { error } = await supabase
      .from("words")
      .delete()
      .eq("id", deletingWord.id)
      .eq("user_id", userId)

    if (!error) {
      mutate(["words", userId])
      setDeletingWord(null)
    }
    setIsLoading(false)
  }

  const handleGenerateExamples = async (word: Word) => {
    setIsGeneratingExamples(true)
    try {
      const response = await fetch("/api/ai/examples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: word.kanji || word.hiragana,
          hiragana: word.hiragana,
          definition: word.definition,
          category: word.category,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate examples")

      const { examples } = await response.json()

      // Update word with new examples
      // Defense-in-depth: verify both id AND user_id to prevent unauthorized access
      const supabase = createClient()
      await supabase
        .from("words")
        .update({ example_sentences: examples })
        .eq("id", word.id)
        .eq("user_id", userId)

      mutate(["words", userId])

      // Update viewing word with new examples
      setViewingWord({ ...word, example_sentences: examples })
    } catch (error) {
      console.error("Failed to generate examples:", error)
    } finally {
      setIsGeneratingExamples(false)
    }
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">My Dictionary</h1>
          <p className="text-muted-foreground">
            {words.length} {words.length === 1 ? "word" : "words"} in your vocabulary
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Word
        </Button>
      </div>

      {words.length > 0 && (
        <div className="space-y-4 mb-6">
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categoryCounts={categoryCounts}
          />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by kanji, hiragana, romaji, definition, or tag..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Word List */}
      {words.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Your dictionary is empty"
          description="Start building your Japanese vocabulary by adding your first word."
          actionLabel="Add Your First Word"
          onAction={() => setIsFormOpen(true)}
        />
      ) : filteredWords.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No words found"
          description="Try adjusting your search query or category filter."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredWords.map((word) => (
            <WordCard
              key={word.id}
              word={word}
              onEdit={setEditingWord}
              onDelete={setDeletingWord}
              onViewDetails={setViewingWord}
            />
          ))}
        </div>
      )}

      {/* Add Word Form */}
      <WordForm open={isFormOpen} onOpenChange={setIsFormOpen} onSubmit={handleAddWord} isLoading={isLoading} />

      {/* Edit Word Form */}
      <WordForm
        open={!!editingWord}
        onOpenChange={(open) => !open && setEditingWord(null)}
        onSubmit={handleEditWord}
        initialData={editingWord}
        isLoading={isLoading}
      />

      <WordDetailDialog
        word={viewingWord}
        open={!!viewingWord}
        onOpenChange={(open) => !open && setViewingWord(null)}
        onGenerateExamples={handleGenerateExamples}
        isGeneratingExamples={isGeneratingExamples}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deletingWord}
        onOpenChange={(open) => !open && setDeletingWord(null)}
        onConfirm={handleDeleteWord}
        isLoading={isLoading}
        description={`Are you sure you want to delete "${deletingWord?.hiragana}"? This will also remove it from your flashcards.`}
      />
    </main>
  )
}
