import { type NextRequest, NextResponse } from "next/server"
import type { WordCategory } from "@/lib/types"
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limit"

// Types for Jisho API response
interface JishoSense {
  english_definitions: string[]
  parts_of_speech: string[]
  tags: string[]
  info: string[]
}

interface JishoJapanese {
  word?: string
  reading: string
}

interface JishoData {
  slug: string
  is_common: boolean
  tags: string[]
  jlpt: string[]
  japanese: JishoJapanese[]
  senses: JishoSense[]
}

interface JishoResponse {
  data: JishoData[]
}

export interface DictionaryResult {
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

// Simple hiragana to romaji conversion
function hiraganaToRomaji(hiragana: string): string {
  const hiraganaMap: Record<string, string> = {
    あ: "a",
    い: "i",
    う: "u",
    え: "e",
    お: "o",
    か: "ka",
    き: "ki",
    く: "ku",
    け: "ke",
    こ: "ko",
    さ: "sa",
    し: "shi",
    す: "su",
    せ: "se",
    そ: "so",
    た: "ta",
    ち: "chi",
    つ: "tsu",
    て: "te",
    と: "to",
    な: "na",
    に: "ni",
    ぬ: "nu",
    ね: "ne",
    の: "no",
    は: "ha",
    ひ: "hi",
    ふ: "fu",
    へ: "he",
    ほ: "ho",
    ま: "ma",
    み: "mi",
    む: "mu",
    め: "me",
    も: "mo",
    や: "ya",
    ゆ: "yu",
    よ: "yo",
    ら: "ra",
    り: "ri",
    る: "ru",
    れ: "re",
    ろ: "ro",
    わ: "wa",
    を: "wo",
    ん: "n",
    が: "ga",
    ぎ: "gi",
    ぐ: "gu",
    げ: "ge",
    ご: "go",
    ざ: "za",
    じ: "ji",
    ず: "zu",
    ぜ: "ze",
    ぞ: "zo",
    だ: "da",
    ぢ: "di",
    づ: "du",
    で: "de",
    ど: "do",
    ば: "ba",
    び: "bi",
    ぶ: "bu",
    べ: "be",
    ぼ: "bo",
    ぱ: "pa",
    ぴ: "pi",
    ぷ: "pu",
    ぺ: "pe",
    ぽ: "po",
    きゃ: "kya",
    きゅ: "kyu",
    きょ: "kyo",
    しゃ: "sha",
    しゅ: "shu",
    しょ: "sho",
    ちゃ: "cha",
    ちゅ: "chu",
    ちょ: "cho",
    にゃ: "nya",
    にゅ: "nyu",
    にょ: "nyo",
    ひゃ: "hya",
    ひゅ: "hyu",
    ひょ: "hyo",
    みゃ: "mya",
    みゅ: "myu",
    みょ: "myo",
    りゃ: "rya",
    りゅ: "ryu",
    りょ: "ryo",
    ぎゃ: "gya",
    ぎゅ: "gyu",
    ぎょ: "gyo",
    じゃ: "ja",
    じゅ: "ju",
    じょ: "jo",
    びゃ: "bya",
    びゅ: "byu",
    びょ: "byo",
    ぴゃ: "pya",
    ぴゅ: "pyu",
    ぴょ: "pyo",
    っ: "",
    ー: "-",
  }

  let result = ""
  let i = 0

  while (i < hiragana.length) {
    if (i + 1 < hiragana.length) {
      const twoChar = hiragana.substring(i, i + 2)
      if (hiraganaMap[twoChar]) {
        result += hiraganaMap[twoChar]
        i += 2
        continue
      }
    }

    if (hiragana[i] === "っ" && i + 1 < hiragana.length) {
      const nextChar = hiraganaMap[hiragana[i + 1]]
      if (nextChar && nextChar.length > 0) {
        result += nextChar[0]
      }
      i++
      continue
    }

    const char = hiraganaMap[hiragana[i]]
    if (char !== undefined) {
      result += char
    } else {
      result += hiragana[i]
    }
    i++
  }

  return result
}

function detectCategory(partsOfSpeech: string[]): { category: WordCategory; verbType?: string } {
  const pos = partsOfSpeech.join(" ").toLowerCase()

  // Check for specific verb types first (most specific)
  if (pos.includes("ichidan") || pos.includes("v1")) {
    return { category: "verb", verbType: "ichidan" }
  }
  if (pos.includes("godan") || pos.includes("v5")) {
    return { category: "verb", verbType: "godan" }
  }
  if (pos.includes("suru") || pos.includes("vs-")) {
    return { category: "verb", verbType: "suru" }
  }
  if (pos.includes("kuru") || pos.includes("vk")) {
    return { category: "verb", verbType: "kuru" }
  }
  
  // Check for other categories before general verbs (adverbs, counters, etc.)
  // This ensures adverbs and counters are detected correctly even if "verb" appears in the string
  if (pos.includes("counter")) {
    return { category: "counter" }
  }
  if (pos.includes("adverb")) {
    return { category: "adverb" }
  }
  if (pos.includes("particle")) {
    return { category: "particle" }
  }
  if (pos.includes("expression")) {
    return { category: "expression" }
  }
  if (pos.includes("i-adjective") || pos.includes("adj-i")) {
    return { category: "adjective-i" }
  }
  if (pos.includes("na-adjective") || pos.includes("adj-na")) {
    return { category: "adjective-na" }
  }
  if (pos.includes("noun")) {
    return { category: "noun" }
  }
  
  // Check for general verbs last (least specific)
  if (pos.includes("verb")) {
    return { category: "verb", verbType: "godan" }
  }

  return { category: "other" }
}

export async function GET(request: NextRequest) {
  // Rate limit by IP address
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || 
             request.headers.get("x-real-ip") || 
             "anonymous"
  
  const rateLimit = await checkRateLimit(ip, "dictionary", rateLimitConfigs.dictionary)
  
  if (!rateLimit.success) {
    return NextResponse.json(
      { 
        error: "Rate limit exceeded. Please slow down.",
        retryAfter: rateLimit.resetIn
      },
      { 
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.resetIn),
          "X-RateLimit-Remaining": "0",
        }
      }
    )
  }

  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")

  if (!query) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 })
  }

  try {
    const response = await fetch(`https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(query)}`, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      throw new Error(`Jisho API error: ${response.status}`)
    }

    const data: JishoResponse = await response.json()

    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
      return NextResponse.json({ results: [] })
    }

    const validEntries = data.data.filter(
      (entry) =>
        entry.japanese && Array.isArray(entry.japanese) && entry.japanese.length > 0 && entry.japanese[0]?.reading,
    )

    const results: DictionaryResult[] = validEntries.slice(0, 10).map((entry) => {
      const primaryJapanese = entry.japanese[0]
      const kanji = primaryJapanese?.word || null
      const hiragana = primaryJapanese?.reading || ""
      const romaji = hiragana ? hiraganaToRomaji(hiragana) : ""

      const definitions = (entry.senses || [])
        .slice(0, 3)
        .map((sense) => (sense.english_definitions || []).join(", "))
        .filter(Boolean)
        .join("; ")

      const partsOfSpeech = [...new Set((entry.senses || []).flatMap((sense) => sense.parts_of_speech || []))]

      const tags: string[] = []
      if (entry.is_common) tags.push("common")
      if (entry.jlpt) tags.push(...entry.jlpt)
      if (entry.tags) tags.push(...entry.tags)

      const { category, verbType } = detectCategory(partsOfSpeech)

      return {
        kanji,
        hiragana,
        romaji,
        definition: definitions || "No definition available",
        tags,
        partsOfSpeech,
        isCommon: entry.is_common || false,
        jlpt: entry.jlpt || [],
        alternateReadings: (entry.japanese || []).slice(1, 4),
        category,
        verbType,
      }
    })

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Dictionary lookup error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Failed to lookup word in dictionary" }, { status: 500 })
  }
}
