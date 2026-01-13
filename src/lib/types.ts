export interface ExampleSentence {
  japanese: string
  romaji?: string
  english: string
}

export interface GrammaticalInfo {
  transitivity?: "transitive" | "intransitive" | "both"
  formality?: "formal" | "informal" | "both"
  countable?: boolean
  counter?: string
  politeness?: string
  gender?: string
  auxNotes?: string
}

export interface VerbConjugation {
  form: string
  japanese: string
  romaji: string
  usage: string
}

export type WordCategory =
  | "verb"
  | "noun"
  | "adjective-i"
  | "adjective-na"
  | "adverb"
  | "particle"
  | "expression"
  | "counter"
  | "other"

export interface Word {
  id: string
  user_id: string
  kanji: string | null
  hiragana: string
  romaji: string | null
  definition: string
  notes: string | null
  tags: string[] | null
  category: WordCategory
  verb_type: string | null
  example_sentences: ExampleSentence[]
  grammatical_info: GrammaticalInfo
  created_at: string
  updated_at: string
}

export interface FlashcardProgress {
  id: string
  user_id: string
  word_id: string
  ease_factor: number
  interval_days: number
  repetitions: number
  next_review_date: string
  last_reviewed_at: string | null
  created_at: string
}

export interface WordWithProgress extends Word {
  flashcard_progress?: FlashcardProgress
}

export type ReviewRating = 0 | 1 | 2 | 3 | 4 | 5

export interface DictionaryLookupResult {
  kanji: string | null
  hiragana: string
  romaji: string
  definition: string
  tags: string[]
  partsOfSpeech: string[]
  isCommon: boolean
  jlpt: string[]
  alternateReadings: { kanji?: string; reading: string }[]
  category: WordCategory
  verbType?: string
}

export type UserRole = "user" | "admin" | "moderator"
export type UserStatus = "active" | "suspended" | "pending"

export interface UserProfile {
  id: string
  user_id: string
  display_name: string | null
  role: UserRole
  status: UserStatus
  created_at: string
  updated_at: string
  email?: string
  word_count?: number
  last_sign_in?: string
}

export interface AIFeatureSetting {
  id: string
  feature_key: string
  feature_name: string
  description: string | null
  enabled: boolean
  updated_by: string | null
  updated_at: string
  created_at: string
}

export interface UserAIFeature {
  id: string
  user_id: string
  feature_key: string
  enabled: boolean
  updated_by: string | null
  updated_at: string | null
  created_at: string
}

export interface UserWithAIFeatures extends UserProfile {
  ai_features?: UserAIFeature[]
}

export const AI_FEATURE_KEYS = [
  "assistant",
  "pronunciation_assistance",
  "example_sentences",
  "related_words",
  "grammar_explanations",
  "smart_flashcards",
] as const

export type AIFeatureKey = (typeof AI_FEATURE_KEYS)[number]

export const AI_FEATURE_LABELS: Record<AIFeatureKey, string> = {
  assistant: "AI Assistant",
  pronunciation_assistance: "Pronunciation",
  example_sentences: "Examples",
  related_words: "Related Words",
  grammar_explanations: "Grammar",
  smart_flashcards: "Smart Flashcards",
}

export interface AuditLog {
  id: string
  admin_id: string
  action: string
  target_type: string
  target_id: string | null
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
  admin_email?: string
}
