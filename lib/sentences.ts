// Procedural Malay reading sentences built from tagged word lists so every sentence makes sense.

export type SentenceLevel = 1 | 2 | 3 | 4
export type WordMarkType = "betul" | "salah" | "bantu"

export interface WordMark {
  word: string
  mark: WordMarkType
}

export const sentenceLevels: { level: SentenceLevel; title: string; example: string; description: string }[] = [
  { level: 1, title: "1", example: "Ibu baca buku.", description: "2–3 perkataan, suku kata terbuka sahaja (ba, ku)." },
  { level: 2, title: "2", example: "Adik makan roti.", description: "3 perkataan, termasuk suku kata tertutup (kan, dik)." },
  { level: 3, title: "3", example: "Abang main bola di padang.", description: "4–5 perkataan dengan tempat atau sifat." },
  { level: 4, title: "4", example: "Ayah minum kopi dan Adik makan kuih.", description: "Ayat panjang dengan 'dan'." },
]

const subjects = ["Adik", "Abang", "Kakak", "Ayah", "Ibu", "Atuk", "Nenek", "Mama", "Papa", "Umi", "Cikgu"]

// Object -> adjectives that make sense with it
const objects: Record<string, string[]> = {
  roti: ["sedap", "panas"],
  nasi: ["panas", "sedap"],
  kuih: ["sedap", "manis"],
  sate: ["sedap"],
  apam: ["manis"],
  ikan: ["besar", "goreng"],
  ayam: ["goreng"],
  epal: ["merah", "manis"],
  pisang: ["manis"],
  susu: ["sejuk", "panas"],
  kopi: ["panas", "manis"],
  teh: ["panas", "manis"],
  air: ["sejuk"],
  buku: ["baru", "besar"],
  peta: ["besar"],
  surat: ["baru"],
  bola: ["besar", "kecil", "merah", "baru"],
  gasing: ["baru", "merah"],
  wau: ["besar", "cantik"],
  baju: ["baru", "merah", "cantik"],
  topi: ["merah", "baru"],
  kasut: ["baru", "kotor"],
  kaki: ["kotor"],
  tangan: ["kotor"],
  pinggan: ["kotor"],
  kereta: ["merah", "kotor"],
  beg: ["besar", "berat"],
  payung: ["merah", "besar"],
}

const food = ["roti", "nasi", "kuih", "sate", "apam", "ikan", "ayam", "epal", "pisang"]
const toys = ["bola", "gasing", "wau"]

interface Verb {
  word: string
  objects: string[]
  places: string[]
}

const transitiveVerbs: Verb[] = [
  { word: "makan", objects: food, places: ["di rumah", "di dapur", "di kedai"] },
  { word: "minum", objects: ["susu", "kopi", "teh", "air"], places: ["di rumah", "di dapur", "di kedai"] },
  { word: "baca", objects: ["buku", "peta", "surat"], places: ["di rumah", "di sekolah", "di taman"] },
  { word: "main", objects: toys, places: ["di padang", "di taman", "di rumah"] },
  { word: "cuci", objects: ["baju", "kaki", "tangan", "pinggan", "kereta"], places: ["di dapur", "di rumah"] },
  {
    word: "beli",
    objects: ["roti", "ikan", "buku", "bola", "topi", "baju", "kasut", "epal", "pisang", "susu"],
    places: ["di kedai", "di pasar"],
  },
  { word: "bawa", objects: ["buku", "bola", "beg", "payung"], places: ["ke sekolah", "ke rumah", "ke taman"] },
  { word: "pakai", objects: ["baju", "topi", "kasut"], places: ["ke sekolah", "ke kedai"] },
  { word: "suka", objects: [...food, ...toys], places: [] },
]

const intransitiveVerbs: Verb[] = [
  { word: "lari", objects: [], places: ["di padang", "di taman"] },
  { word: "tidur", objects: [], places: ["di rumah", "di bilik"] },
  { word: "mandi", objects: [], places: ["di rumah", "di sungai", "di pantai"] },
  { word: "duduk", objects: [], places: ["di kerusi", "di rumah"] },
  { word: "senyum", objects: [], places: [] },
  { word: "berenang", objects: [], places: ["di kolam", "di pantai"] },
]

const DIGRAPHS = ["ng", "ny", "sy", "kh", "gh"]
const isVowel = (u: string) => "aeiou".includes(u)

// Splits a Malay word into syllables, treating ng/ny/sy/kh/gh as one consonant and
// ai/au/oi as a diphthong only at the end of a word (pa·kai, but ka·in, ba·ik).
export const syllabify = (word: string): string[] => {
  const lower = word.toLowerCase()
  if (!/^[a-z]+$/.test(lower)) return [word]
  const units: string[] = []
  for (let i = 0; i < lower.length; ) {
    const two = lower.slice(i, i + 2)
    const unit = DIGRAPHS.includes(two) ? two : lower[i]
    units.push(unit)
    i += unit.length
  }

  const nuclei: [number, number][] = []
  units.forEach((u, i) => {
    if (!isVowel(u)) return
    const last = nuclei[nuclei.length - 1]
    if (last && last[1] === i - 1 && i === units.length - 1 && ["ai", "au", "oi"].includes(units[i - 1] + u)) last[1] = i
    else nuclei.push([i, i])
  })
  if (nuclei.length <= 1) return [word]

  // Syllable boundaries: V·V, V·CV, VC·CV
  const starts = [0]
  for (let k = 1; k < nuclei.length; k++) {
    const consonants = nuclei[k][0] - nuclei[k - 1][1] - 1
    starts.push(consonants <= 1 ? nuclei[k][0] - consonants : nuclei[k - 1][1] + 2)
  }
  starts.push(units.length)

  // Map unit boundaries back onto the original word to keep its capitalisation
  const syllables: string[] = []
  let pos = 0
  for (let k = 0; k < starts.length - 1; k++) {
    const len = units.slice(starts[k], starts[k + 1]).join("").length
    syllables.push(word.slice(pos, pos + len))
    pos += len
  }
  return syllables
}

// 1 = only open CV/V syllables, 2 = closed syllables, 3 = digraphs, diphthongs or 4+ syllables
export const wordTier = (word: string): number => {
  const lower = word.toLowerCase()
  const syllables = syllabify(lower)
  if (DIGRAPHS.some((d) => lower.includes(d)) || syllables.length > 3) return 3
  if (syllables.every((s) => s.length <= 2 && isVowel(s[s.length - 1]))) return 1
  return syllables.every((s) => s.length <= 3) ? 2 : 3
}

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

const capitaliseName = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ")

export const generateSentences = (level: SentenceLevel, count: number, childName?: string): string[] => {
  const maxTier = Math.min(level, 3)
  const ok = (phrase: string) => phrase.split(" ").every((w) => wordTier(w) <= maxTier)
  const subjectPool = subjects.filter(ok)
  const name = childName && /^[a-zA-Z\s'-]+$/.test(childName) ? capitaliseName(childName) : null
  const subject = (exclude?: string) => {
    if (name && name !== exclude && Math.random() < 0.35) return name
    return pick(subjectPool.filter((s) => s !== exclude))
  }

  const verbs = transitiveVerbs
    .filter((v) => ok(v.word))
    .map((v) => ({ ...v, objects: v.objects.filter(ok), places: v.places.filter(ok) }))
    .filter((v) => v.objects.length > 0)
  const intransitive = intransitiveVerbs.filter((v) => ok(v.word)).map((v) => ({ ...v, places: v.places.filter(ok) }))
  const allObjects = [...new Set(verbs.flatMap((v) => v.objects))]
  const withAdjective = (list: string[]) => list.filter((o) => objects[o]?.some(ok))
  const adjective = (o: string) => pick(objects[o].filter(ok))

  const svo = () => {
    const v = pick(verbs)
    return { v, o: pick(v.objects) }
  }

  const templates: Record<SentenceLevel, (() => string)[]> = {
    1: [
      () => `Ini ${pick(allObjects)}`,
      () => `${subject()} ${pick(intransitive).word}`,
      () => {
        const { v, o } = svo()
        return `${subject()} ${v.word} ${o}`
      },
    ],
    2: [
      () => {
        const { v, o } = svo()
        return `${subject()} ${v.word} ${o}`
      },
      () => `Ini ${pick(allObjects)} ${subject()}`,
      () => `${subject()} ada ${pick(allObjects)}`,
      () => `${subject()} ${pick(intransitive).word}`,
    ],
    3: [
      () => {
        const v = pick(verbs.filter((v) => v.places.length))
        return `${subject()} ${v.word} ${pick(v.objects)} ${pick(v.places)}`
      },
      () => {
        const v = pick(verbs.filter((v) => withAdjective(v.objects).length))
        const o = pick(withAdjective(v.objects))
        return `${subject()} ${v.word} ${o} ${adjective(o)}`
      },
      () => {
        const v = pick(intransitive.filter((v) => v.places.length))
        return `${subject()} ${v.word} ${pick(v.places)}`
      },
      () => {
        const o = pick(withAdjective(allObjects))
        return `${o} ${subject()} ${adjective(o)}`
      },
    ],
    4: [
      () => {
        const v = pick(verbs.filter((v) => v.places.length && withAdjective(v.objects).length))
        const o = pick(withAdjective(v.objects))
        return `${subject()} ${v.word} ${o} ${adjective(o)} ${pick(v.places)}`
      },
      () => {
        const v = pick(verbs.filter((v) => v.objects.length > 1))
        const o1 = pick(v.objects)
        const o2 = pick(v.objects.filter((o) => o !== o1))
        return `${subject()} ${v.word} ${o1} dan ${o2}`
      },
      () => {
        const first = svo()
        const s1 = subject()
        const second = svo()
        return `${s1} ${first.v.word} ${first.o} dan ${subject(s1)} ${second.v.word} ${second.o}`
      },
    ],
  }

  const sentences = new Set<string>()
  for (let attempt = 0; sentences.size < count && attempt < count * 30; attempt++) {
    const raw = pick(templates[level])()
    sentences.add(raw.charAt(0).toUpperCase() + raw.slice(1) + ".")
  }
  const list = [...sentences]
  while (list.length < count) list.push(list[list.length % sentences.size])
  return list
}

// Words in a sentence without punctuation, in reading order
export const sentenceWords = (sentence: string) =>
  sentence
    .replace(/[.,!?]/g, "")
    .split(/\s+/)
    .filter(Boolean)

// Running-record thresholds commonly used by teachers
export const readingLevel = (accuracy: number) =>
  accuracy >= 0.95
    ? { label: "Mudah", color: "bg-emerald-300", advice: "Anak membaca dengan lancar. Cuba tahap seterusnya." }
    : accuracy >= 0.9
      ? { label: "Sesuai", color: "bg-yellow-300", advice: "Tahap ini sesuai untuk latihan. Teruskan." }
      : { label: "Sukar", color: "bg-rose-300", advice: "Tahap ini masih sukar. Latih perkataan yang salah dahulu." }
