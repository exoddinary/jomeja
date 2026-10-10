export type GameMode = "2letter" | "3letter" | "4letter"
export type LegacyMode = "easy" | "hard" | "custom"
export type LetterCase = "Aa" | "aa" | "AA"
export type StatsMode = GameMode

export const allConsonants = ["B", "C", "D", "F", "G", "H", "J", "K", "L", "M", "N", "P", "R", "S", "T", "W", "Y", "Z"]
export const allVowels = ["A", "E", "I", "O", "U"]
export const easyVowels = ["A", "I", "U"]
export const allThirdLetters = [...new Set(["K", "H", "M", "N", "S", "T", "R", "L", ...allVowels])].sort()

export interface WordGroup {
  id: string
  label: string
  description: string
  words: string[]
}

// Curated 4-letter words familiar to Malaysian children and families
export const wordGroups: WordGroup[] = [
  {
    id: "harian",
    label: "Kata Harian",
    description: "buku, bola, kaki",
    words: [
      "baju", "buku", "batu", "bola", "kaki", "mata", "susu", "topi", "gigi", "kuda",
      "rusa", "labu", "madu", "guru", "satu", "lima", "jari", "kayu", "padi", "lagu",
      "siku", "gula", "meja", "bayi", "peta", "kuku", "tali", "pipi", "lori", "pagi",
    ],
  },
  {
    id: "vokal",
    label: "Mula Dengan Vokal",
    description: "ayam, ikan, ular",
    words: [
      "ayam", "ikan", "itik", "ular", "emak", "abah", "ayah", "adik", "ulat", "awan",
      "atuk", "epal", "oren", "ekor", "akar", "ubat", "enam", "ajar", "umur",
    ],
  },
  {
    id: "diftong",
    label: "Vokal Berganding",
    description: "baik, laut, daun",
    words: ["baik", "naik", "main", "laut", "kain", "daun", "duit", "buih", "taip", "saiz"],
  },
  {
    id: "gabung",
    label: "Huruf Gabung (ng, ny, sy, kh)",
    description: "yang, syam, khas",
    words: [
      "yang", "wang", "bang", "sang", "tong", "gong", "long", "ngah", "syam", "syor",
      "syak", "syif", "khas", "khat", "nyah",
    ],
  },
  {
    id: "malaysia",
    label: "Ala Malaysia",
    description: "syok, roti, kuih",
    words: ["syok", "geng", "ngam", "oyen", "abam", "atok", "roti", "nasi", "sate", "kuih", "apam", "kari", "kopi", "raya"],
  },
]

export const allWordGroupIds = wordGroups.map((g) => g.id)

export const modeLabels: Record<GameMode | LegacyMode, string> = {
  "2letter": "2 Huruf",
  "3letter": "3 Huruf",
  "4letter": "4 Huruf",
  easy: "2 Huruf (Mudah)",
  hard: "2 Huruf (Sukar)",
  custom: "2 Huruf (Pilihan)",
}

export const toStatsMode = (mode: GameMode | LegacyMode): StatsMode =>
  mode === "3letter" || mode === "4letter" ? mode : "2letter"

export const applyCase = (word: string, caseType: LetterCase): string => {
  if (caseType === "AA") return word.toUpperCase()
  if (caseType === "aa") return word.toLowerCase()
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

const shuffle = <T,>(arr: T[]) => {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export interface GameSettings {
  mode: GameMode
  letterCase: LetterCase
  wordsPerSession: number
  consonants: string[]
  vowels: string[]
  thirdLetters: string[]
  wordGroupIds: string[]
}

export const defaultSettings: GameSettings = {
  mode: "2letter",
  letterCase: "Aa",
  wordsPerSession: 10,
  consonants: allConsonants,
  vowels: easyVowels,
  thirdLetters: allThirdLetters,
  wordGroupIds: allWordGroupIds,
}

export const getWordPool = (groupIds: string[]) =>
  [...new Set(wordGroups.filter((g) => groupIds.includes(g.id)).flatMap((g) => g.words))]

export const generateWords = (s: GameSettings): string[] => {
  const consonants = s.consonants.length ? s.consonants : allConsonants
  const vowels = s.vowels.length ? s.vowels : allVowels
  const thirds = s.thirdLetters.length ? s.thirdLetters : allThirdLetters

  if (s.mode === "4letter") {
    const pool = getWordPool(s.wordGroupIds.length ? s.wordGroupIds : allWordGroupIds)
    const words: string[] = []
    while (words.length < s.wordsPerSession) words.push(...shuffle(pool))
    return words.slice(0, s.wordsPerSession).map((w) => applyCase(w, s.letterCase))
  }

  return Array.from({ length: s.wordsPerSession }, () => {
    const base = pick(consonants) + pick(vowels) + (s.mode === "3letter" ? pick(thirds) : "")
    return applyCase(base, s.letterCase)
  })
}

// Deterministic examples shown on the home screen so parents can see what the cards will look like
export const getExamples = (s: GameSettings): string[] => {
  if (s.mode === "4letter") return getWordPool(s.wordGroupIds).slice(0, 3).map((w) => applyCase(w, s.letterCase))
  const consonants = s.consonants.length ? s.consonants : allConsonants
  const vowels = s.vowels.length ? s.vowels : allVowels
  return [0, 1, 2].map((i) => {
    const base =
      consonants[i % consonants.length] +
      vowels[i % vowels.length] +
      (s.mode === "3letter" ? s.thirdLetters[i % s.thirdLetters.length] || "" : "")
    return applyCase(base, s.letterCase)
  })
}
