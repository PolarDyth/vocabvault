"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Volume2, BookOpen, Languages, Sparkles } from "lucide-react"
import { VerbConjugation, Word } from "@/lib/types"
import { generateConjugations, generateIAdjectiveConjugations, generateNaAdjectiveConjugations } from "@/lib/configuration"
import { ConjugationTable } from "./conjugation-table"
import { useAIFeature } from "@/hooks/use-ai-features"

interface WordDetailDialogProps {
  word: Word | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerateExamples?: (word: Word) => void
  isGeneratingExamples?: boolean
}

export function WordDetailDialog({
  word,
  open,
  onOpenChange,
  onGenerateExamples,
  isGeneratingExamples,
}: WordDetailDialogProps) {
  // Hooks must be called unconditionally (before any early returns)
  const { isEnabled: hasExampleSentencesEnabled } = useAIFeature("example_sentences")

  if (!word) return null

  const speakWord = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "ja-JP"
      utterance.rate = 0.8
      window.speechSynthesis.speak(utterance)
    }
  }

  // Generate conjugations based on word category
  let conjugations: VerbConjugation[] = []
  let conjugationTitle = ""

  if (word.category === "verb" && word.verb_type) {
    conjugations = generateConjugations(word.hiragana, word.verb_type)
    conjugationTitle = "Verb Conjugations"
  } else if (word.category === "adjective-i") {
    conjugations = generateIAdjectiveConjugations(word.hiragana)
    conjugationTitle = "Adjective Forms"
  } else if (word.category === "adjective-na") {
    conjugations = generateNaAdjectiveConjugations(word.hiragana)
    conjugationTitle = "Adjective Forms"
  }

  const categoryLabels: Record<string, string> = {
    verb: "Verb",
    noun: "Noun",
    "adjective-i": "い-Adjective",
    "adjective-na": "な-Adjective",
    adverb: "Adverb",
    particle: "Particle",
    expression: "Expression",
    counter: "Counter",
    other: "Other",
  }

  const grammaticalInfo = word.grammatical_info || {}
  const examples = word.example_sentences || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                {word.kanji && <span className="text-4xl font-light japanese-text">{word.kanji}</span>}
                <Button variant="ghost" size="icon" onClick={() => speakWord(word.hiragana)}>
                  <Volume2 className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-xl text-muted-foreground japanese-text mt-1">{word.hiragana}</p>
              {word.romaji && <p className="text-sm text-muted-foreground/70 italic">{word.romaji}</p>}
            </div>
            <Badge variant="secondary" className="text-sm">
              {categoryLabels[word.category] || word.category}
            </Badge>
          </div>
          <DialogTitle className="text-lg font-normal">{word.definition}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Details
            </TabsTrigger>
            {conjugations.length > 0 && (
              <TabsTrigger value="conjugations" className="gap-2">
                <Languages className="h-4 w-4" />
                Forms
              </TabsTrigger>
            )}
            {hasExampleSentencesEnabled && (
              <TabsTrigger value="examples" className="gap-2">
              <Sparkles className="h-4 w-4" />
                Examples
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="details" className="mt-4 space-y-4">
            {/* Tags */}
            {word.tags && word.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {word.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Grammatical Info */}
            {Object.keys(grammaticalInfo).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Grammatical Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {grammaticalInfo.transitivity && (
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">Transitivity</span>
                      <span className="capitalize">{grammaticalInfo.transitivity}</span>
                    </div>
                  )}
                  {grammaticalInfo.formality && (
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">Formality</span>
                      <span className="capitalize">{grammaticalInfo.formality}</span>
                    </div>
                  )}
                  {grammaticalInfo.counter && (
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">Counter</span>
                      <span>{grammaticalInfo.counter}</span>
                    </div>
                  )}
                  {grammaticalInfo.countable !== undefined && (
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">Countable</span>
                      <span>{grammaticalInfo.countable ? "Yes" : "No"}</span>
                    </div>
                  )}
                </div>
                {grammaticalInfo.auxNotes && (
                  <p className="text-sm text-muted-foreground mt-2">{grammaticalInfo.auxNotes}</p>
                )}
              </div>
            )}

            {/* Notes */}
            {word.notes && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Notes</h4>
                <p className="text-sm">{word.notes}</p>
              </div>
            )}

            {/* Verb type info */}
            {word.category === "verb" && word.verb_type && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Verb Type</h4>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium capitalize">{word.verb_type} verb</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {word.verb_type === "ichidan" && "Also called る-verbs. Drop る and add conjugation endings."}
                    {word.verb_type === "godan" &&
                      "Also called う-verbs. The final syllable changes based on conjugation."}
                    {word.verb_type === "suru" && "Noun + する compound verb. Conjugates irregularly."}
                    {word.verb_type === "kuru" && "Irregular verb. One of only two irregular verbs in Japanese."}
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          {conjugations.length > 0 && (
            <TabsContent value="conjugations" className="mt-4">
              <ConjugationTable
                conjugations={conjugations}
                verbType={word.verb_type || word.category}
                title={conjugationTitle}
              />
            </TabsContent>
          )}

          {hasExampleSentencesEnabled && (
            <TabsContent value="examples" className="mt-4 space-y-4">
            {examples.length > 0 ? (
              <div className="space-y-3">
                {examples.map((example, idx) => (
                  <div key={idx} className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-lg japanese-text">{example.japanese}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => speakWord(example.japanese)}
                      >
                        <Volume2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {example.romaji && <p className="text-sm text-muted-foreground italic">{example.romaji}</p>}
                    <p className="text-sm">{example.english}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No example sentences yet.</p>
                {onGenerateExamples && (
                  <Button
                    variant="outline"
                    onClick={() => onGenerateExamples(word)}
                    disabled={isGeneratingExamples}
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    {isGeneratingExamples ? "Generating..." : "Generate with AI"}
                  </Button>
                )}
              </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
