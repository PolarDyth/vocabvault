import type { VerbConjugation } from "./types"

// Detect verb type from dictionary form and tags
export function detectVerbType(hiragana: string, tags: string[]): string | null {
  // Check tags first for explicit verb type
  const tagStr = tags.join(" ").toLowerCase()

  if (tagStr.includes("godan") || tagStr.includes("v5")) {
    return "godan"
  }
  if (tagStr.includes("ichidan") || tagStr.includes("v1")) {
    return "ichidan"
  }
  if (tagStr.includes("suru") || tagStr.includes("vs")) {
    return "suru"
  }
  if (tagStr.includes("kuru") || tagStr.includes("vk")) {
    return "kuru"
  }

  // Fallback: detect from ending
  if (hiragana.endsWith("る")) {
    // Check if ichidan (eru/iru endings)
    const stem = hiragana.slice(0, -1)
    const lastChar = stem.slice(-1)
    const ichiSounds = [
      "い",
      "え",
      "き",
      "け",
      "ぎ",
      "げ",
      "し",
      "せ",
      "じ",
      "ぜ",
      "ち",
      "て",
      "ぢ",
      "で",
      "に",
      "ね",
      "ひ",
      "へ",
      "び",
      "べ",
      "ぴ",
      "ぺ",
      "み",
      "め",
      "り",
      "れ",
    ]
    if (ichiSounds.some((s) => lastChar.includes(s) || stem.endsWith(s))) {
      return "ichidan" // Could be ichidan, but not certain
    }
    return "godan" // Most る-ending verbs are godan
  }

  if (
    hiragana.endsWith("う") ||
    hiragana.endsWith("く") ||
    hiragana.endsWith("す") ||
    hiragana.endsWith("つ") ||
    hiragana.endsWith("ぬ") ||
    hiragana.endsWith("ぶ") ||
    hiragana.endsWith("む") ||
    hiragana.endsWith("ぐ")
  ) {
    return "godan"
  }

  if (hiragana.endsWith("する")) {
    return "suru"
  }

  if (hiragana === "くる" || hiragana === "来る") {
    return "kuru"
  }

  return null
}

// Generate conjugation table for a verb
export function generateConjugations(hiragana: string, verbType: string): VerbConjugation[] {
  const stem = hiragana.slice(0, -1)

  if (verbType === "ichidan") {
    return generateIchidanConjugations(stem)
  }

  if (verbType === "godan") {
    return generateGodanConjugations(hiragana)
  }

  if (verbType === "suru") {
    return generateSuruConjugations(stem)
  }

  if (verbType === "kuru") {
    return generateKuruConjugations()
  }

  return []
}

function generateIchidanConjugations(stem: string): VerbConjugation[] {
  return [
    { form: "Dictionary", japanese: stem + "る", romaji: "", usage: "Plain present/future" },
    { form: "Masu", japanese: stem + "ます", romaji: "", usage: "Polite present/future" },
    { form: "Te-form", japanese: stem + "て", romaji: "", usage: "Connecting, requests" },
    { form: "Ta-form", japanese: stem + "た", romaji: "", usage: "Plain past" },
    { form: "Mashita", japanese: stem + "ました", romaji: "", usage: "Polite past" },
    { form: "Nai-form", japanese: stem + "ない", romaji: "", usage: "Plain negative" },
    { form: "Masen", japanese: stem + "ません", romaji: "", usage: "Polite negative" },
    { form: "Nakatta", japanese: stem + "なかった", romaji: "", usage: "Plain past negative" },
    { form: "Potential", japanese: stem + "られる", romaji: "", usage: "Can do" },
    { form: "Passive", japanese: stem + "られる", romaji: "", usage: "Is done" },
    { form: "Causative", japanese: stem + "させる", romaji: "", usage: "Make/let do" },
    { form: "Imperative", japanese: stem + "ろ", romaji: "", usage: "Command" },
    { form: "Volitional", japanese: stem + "よう", romaji: "", usage: "Let's do" },
    { form: "Conditional", japanese: stem + "れば", romaji: "", usage: "If" },
    { form: "Tara-form", japanese: stem + "たら", romaji: "", usage: "If/when" },
  ]
}

function generateGodanConjugations(hiragana: string): VerbConjugation[] {
  const ending = hiragana.slice(-1)
  const stem = hiragana.slice(0, -1)

  // Godan conjugation mappings
  const mappings: Record<
    string,
    {
      masu: string
      te: string
      ta: string
      nai: string
      potential: string
      volitional: string
      imperative: string
      conditional: string
    }
  > = {
    う: {
      masu: "い",
      te: "って",
      ta: "った",
      nai: "わ",
      potential: "え",
      volitional: "お",
      imperative: "え",
      conditional: "え",
    },
    く: {
      masu: "き",
      te: "いて",
      ta: "いた",
      nai: "か",
      potential: "け",
      volitional: "こ",
      imperative: "け",
      conditional: "け",
    },
    ぐ: {
      masu: "ぎ",
      te: "いで",
      ta: "いだ",
      nai: "が",
      potential: "げ",
      volitional: "ご",
      imperative: "げ",
      conditional: "げ",
    },
    す: {
      masu: "し",
      te: "して",
      ta: "した",
      nai: "さ",
      potential: "せ",
      volitional: "そ",
      imperative: "せ",
      conditional: "せ",
    },
    つ: {
      masu: "ち",
      te: "って",
      ta: "った",
      nai: "た",
      potential: "て",
      volitional: "と",
      imperative: "て",
      conditional: "て",
    },
    ぬ: {
      masu: "に",
      te: "んで",
      ta: "んだ",
      nai: "な",
      potential: "ね",
      volitional: "の",
      imperative: "ね",
      conditional: "ね",
    },
    ぶ: {
      masu: "び",
      te: "んで",
      ta: "んだ",
      nai: "ば",
      potential: "べ",
      volitional: "ぼ",
      imperative: "べ",
      conditional: "べ",
    },
    む: {
      masu: "み",
      te: "んで",
      ta: "んだ",
      nai: "ま",
      potential: "め",
      volitional: "も",
      imperative: "め",
      conditional: "め",
    },
    る: {
      masu: "り",
      te: "って",
      ta: "った",
      nai: "ら",
      potential: "れ",
      volitional: "ろ",
      imperative: "れ",
      conditional: "れ",
    },
  }

  const map = mappings[ending] || mappings["る"]

  // Special case for 行く (iku)
  const isIku = hiragana === "いく" || hiragana === "行く"
  const teForm = isIku ? stem + "って" : stem + map.te
  const taForm = isIku ? stem + "った" : stem + map.ta

  return [
    { form: "Dictionary", japanese: hiragana, romaji: "", usage: "Plain present/future" },
    { form: "Masu", japanese: stem + map.masu + "ます", romaji: "", usage: "Polite present/future" },
    { form: "Te-form", japanese: teForm, romaji: "", usage: "Connecting, requests" },
    { form: "Ta-form", japanese: taForm, romaji: "", usage: "Plain past" },
    { form: "Mashita", japanese: stem + map.masu + "ました", romaji: "", usage: "Polite past" },
    { form: "Nai-form", japanese: stem + map.nai + "ない", romaji: "", usage: "Plain negative" },
    { form: "Masen", japanese: stem + map.masu + "ません", romaji: "", usage: "Polite negative" },
    { form: "Nakatta", japanese: stem + map.nai + "なかった", romaji: "", usage: "Plain past negative" },
    { form: "Potential", japanese: stem + map.potential + "る", romaji: "", usage: "Can do" },
    { form: "Passive", japanese: stem + map.nai + "れる", romaji: "", usage: "Is done" },
    { form: "Causative", japanese: stem + map.nai + "せる", romaji: "", usage: "Make/let do" },
    { form: "Imperative", japanese: stem + map.imperative, romaji: "", usage: "Command" },
    { form: "Volitional", japanese: stem + map.volitional + "う", romaji: "", usage: "Let's do" },
    { form: "Conditional", japanese: stem + map.conditional + "ば", romaji: "", usage: "If" },
    { form: "Tara-form", japanese: taForm + "ら", romaji: "", usage: "If/when" },
  ]
}

function generateSuruConjugations(stem: string): VerbConjugation[] {
  // stem could be empty (just する) or a noun (勉強)
  const base = stem.endsWith("す") ? stem.slice(0, -1) : stem
  const prefix = base || ""

  return [
    { form: "Dictionary", japanese: prefix + "する", romaji: "", usage: "Plain present/future" },
    { form: "Masu", japanese: prefix + "します", romaji: "", usage: "Polite present/future" },
    { form: "Te-form", japanese: prefix + "して", romaji: "", usage: "Connecting, requests" },
    { form: "Ta-form", japanese: prefix + "した", romaji: "", usage: "Plain past" },
    { form: "Mashita", japanese: prefix + "しました", romaji: "", usage: "Polite past" },
    { form: "Nai-form", japanese: prefix + "しない", romaji: "", usage: "Plain negative" },
    { form: "Masen", japanese: prefix + "しません", romaji: "", usage: "Polite negative" },
    { form: "Nakatta", japanese: prefix + "しなかった", romaji: "", usage: "Plain past negative" },
    { form: "Potential", japanese: prefix + "できる", romaji: "", usage: "Can do" },
    { form: "Passive", japanese: prefix + "される", romaji: "", usage: "Is done" },
    { form: "Causative", japanese: prefix + "させる", romaji: "", usage: "Make/let do" },
    { form: "Imperative", japanese: prefix + "しろ", romaji: "", usage: "Command" },
    { form: "Volitional", japanese: prefix + "しよう", romaji: "", usage: "Let's do" },
    { form: "Conditional", japanese: prefix + "すれば", romaji: "", usage: "If" },
    { form: "Tara-form", japanese: prefix + "したら", romaji: "", usage: "If/when" },
  ]
}

function generateKuruConjugations(): VerbConjugation[] {
  return [
    { form: "Dictionary", japanese: "くる", romaji: "kuru", usage: "Plain present/future" },
    { form: "Masu", japanese: "きます", romaji: "kimasu", usage: "Polite present/future" },
    { form: "Te-form", japanese: "きて", romaji: "kite", usage: "Connecting, requests" },
    { form: "Ta-form", japanese: "きた", romaji: "kita", usage: "Plain past" },
    { form: "Mashita", japanese: "きました", romaji: "kimashita", usage: "Polite past" },
    { form: "Nai-form", japanese: "こない", romaji: "konai", usage: "Plain negative" },
    { form: "Masen", japanese: "きません", romaji: "kimasen", usage: "Polite negative" },
    { form: "Nakatta", japanese: "こなかった", romaji: "konakatta", usage: "Plain past negative" },
    { form: "Potential", japanese: "こられる", romaji: "korareru", usage: "Can do" },
    { form: "Passive", japanese: "こられる", romaji: "korareru", usage: "Is done" },
    { form: "Causative", japanese: "こさせる", romaji: "kosaseru", usage: "Make/let do" },
    { form: "Imperative", japanese: "こい", romaji: "koi", usage: "Command" },
    { form: "Volitional", japanese: "こよう", romaji: "koyou", usage: "Let's do" },
    { form: "Conditional", japanese: "くれば", romaji: "kureba", usage: "If" },
    { form: "Tara-form", japanese: "きたら", romaji: "kitara", usage: "If/when" },
  ]
}

// Generate i-adjective conjugations
export function generateIAdjectiveConjugations(hiragana: string): VerbConjugation[] {
  const stem = hiragana.slice(0, -1) // Remove い

  return [
    { form: "Dictionary", japanese: hiragana, romaji: "", usage: "Plain present" },
    { form: "Polite", japanese: stem + "いです", romaji: "", usage: "Polite present" },
    { form: "Past", japanese: stem + "かった", romaji: "", usage: "Plain past" },
    { form: "Past Polite", japanese: stem + "かったです", romaji: "", usage: "Polite past" },
    { form: "Negative", japanese: stem + "くない", romaji: "", usage: "Plain negative" },
    { form: "Neg. Polite", japanese: stem + "くないです", romaji: "", usage: "Polite negative" },
    { form: "Past Neg.", japanese: stem + "くなかった", romaji: "", usage: "Plain past neg." },
    { form: "Te-form", japanese: stem + "くて", romaji: "", usage: "Connecting" },
    { form: "Adverb", japanese: stem + "く", romaji: "", usage: "Adverbial form" },
    { form: "Conditional", japanese: stem + "ければ", romaji: "", usage: "If" },
  ]
}

// Generate na-adjective conjugations
export function generateNaAdjectiveConjugations(hiragana: string): VerbConjugation[] {
  return [
    { form: "Dictionary", japanese: hiragana, romaji: "", usage: "Plain/attributive" },
    { form: "Polite", japanese: hiragana + "です", romaji: "", usage: "Polite present" },
    { form: "Past", japanese: hiragana + "だった", romaji: "", usage: "Plain past" },
    { form: "Past Polite", japanese: hiragana + "でした", romaji: "", usage: "Polite past" },
    { form: "Negative", japanese: hiragana + "じゃない", romaji: "", usage: "Plain negative" },
    { form: "Neg. Polite", japanese: hiragana + "じゃありません", romaji: "", usage: "Polite negative" },
    { form: "Past Neg.", japanese: hiragana + "じゃなかった", romaji: "", usage: "Plain past neg." },
    { form: "Te-form", japanese: hiragana + "で", romaji: "", usage: "Connecting" },
    { form: "Adverb", japanese: hiragana + "に", romaji: "", usage: "Adverbial form" },
    { form: "Attributive", japanese: hiragana + "な", romaji: "", usage: "Before nouns" },
  ]
}
