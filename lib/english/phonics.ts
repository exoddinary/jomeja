// Phase 1 of the English reading syllabus: Jolly Phonics order, groups 1–3.
// Everything a child sees is decodable from the sounds unlocked so far (plus taught tricky words).

export type GroupId = 1 | 2 | 3
export const MAX_GROUP: GroupId = 3

export interface Sound {
  id: string // grapheme as written, also used for the audio filename
  group: GroupId
  ipa: string // target phoneme, used for audio generation
  example: string
  emoji: string
  tip: string // how the parent should say it
}

export const sounds: Sound[] = [
  // Group 1
  { id: "s", group: 1, ipa: "s", example: "snake", emoji: "🐍", tip: "Long hiss: sss, not 'ess' or 'suh'." },
  { id: "a", group: 1, ipa: "æ", example: "ant", emoji: "🐜", tip: "Short a as in ant. Not 'ay' and not 'e'." },
  { id: "t", group: 1, ipa: "t", example: "tap", emoji: "🚰", tip: "Quick, crisp t with no 'uh' after it." },
  { id: "i", group: 1, ipa: "ɪ", example: "insect", emoji: "🐛", tip: "Short i as in insect. Not 'eye'." },
  { id: "p", group: 1, ipa: "p", example: "pig", emoji: "🐷", tip: "A small puff of air: p, not 'puh'." },
  { id: "n", group: 1, ipa: "n", example: "nut", emoji: "🥜", tip: "Hum through the nose: nnn." },
  // Group 2
  { id: "c", group: 2, ipa: "k", example: "cat", emoji: "🐱", tip: "Same sound as k. Quick, no 'uh'." },
  { id: "k", group: 2, ipa: "k", example: "kite", emoji: "🪁", tip: "Same sound as c. Quick, no 'uh'." },
  { id: "e", group: 2, ipa: "e", example: "egg", emoji: "🥚", tip: "Short e as in egg. Keep it different from a (pat / pet)." },
  { id: "h", group: 2, ipa: "h", example: "hat", emoji: "🎩", tip: "Just a breath out: h, not 'huh'." },
  { id: "r", group: 2, ipa: "r", example: "rat", emoji: "🐀", tip: "Growl softly: rrr, not 'ruh'." },
  { id: "m", group: 2, ipa: "m", example: "map", emoji: "🗺️", tip: "Lips together and hum: mmm, not 'muh'." },
  { id: "d", group: 2, ipa: "d", example: "dog", emoji: "🐶", tip: "Short d with no 'uh' after it." },
  { id: "ck", group: 2, ipa: "k", example: "duck", emoji: "🦆", tip: "Two letters, one sound: k." },
  // Group 3
  { id: "g", group: 3, ipa: "ɡ", example: "goat", emoji: "🐐", tip: "Short g from the throat, no 'uh'." },
  { id: "o", group: 3, ipa: "ɒ", example: "octopus", emoji: "🐙", tip: "Short o as in octopus. Not 'oh'." },
  { id: "u", group: 3, ipa: "ʌ", example: "umbrella", emoji: "☂️", tip: "Short u as in umbrella." },
  { id: "l", group: 3, ipa: "l", example: "leg", emoji: "🦵", tip: "Tongue up behind teeth: lll, not 'luh'." },
  { id: "f", group: 3, ipa: "f", example: "fish", emoji: "🐟", tip: "Top teeth on lip and blow: fff." },
  { id: "b", group: 3, ipa: "b", example: "bus", emoji: "🚌", tip: "Short b with no 'uh'. Keep it different from p." },
  { id: "ll", group: 3, ipa: "l", example: "bell", emoji: "🔔", tip: "Two letters, one sound: lll." },
  { id: "ff", group: 3, ipa: "f", example: "puff", emoji: "💨", tip: "Two letters, one sound: fff." },
  { id: "ss", group: 3, ipa: "s", example: "dress", emoji: "👗", tip: "Two letters, one sound: sss." },
]

export const groupLabels: Record<GroupId, string> = {
  1: sounds.filter((s) => s.group === 1).map((s) => s.id).join(" "),
  2: sounds.filter((s) => s.group === 2).map((s) => s.id).join(" "),
  3: sounds.filter((s) => s.group === 3).map((s) => s.id).join(" "),
}

const soundById = new Map(sounds.map((s) => [s.id, s]))
const digraphs = sounds.filter((s) => s.id.length > 1).map((s) => s.id)

// Split a word into graphemes (sound buttons): "duck" -> d·u·ck, "bell" -> b·e·ll
export const segment = (word: string): string[] => {
  const lower = word.toLowerCase()
  const parts: string[] = []
  for (let i = 0; i < lower.length; ) {
    const two = lower.slice(i, i + 2)
    const part = digraphs.includes(two) ? two : lower[i]
    parts.push(part)
    i += part.length
  }
  return parts
}

// The group in which a word becomes decodable (null if it uses sounds not in Phase 1)
export const wordGroup = (word: string): GroupId | null => {
  let group = 1
  for (const g of segment(word)) {
    const sound = soundById.get(g)
    if (!sound) return null
    group = Math.max(group, sound.group)
  }
  return group as GroupId
}

// Decodable words with an emoji where the picture is unambiguous
const wordEmoji: Record<string, string> = {
  // Group 1
  at: "", it: "", in: "", an: "", sat: "🪑", pat: "", tap: "🚰", nap: "😴", pan: "🍳", tan: "", pin: "📌",
  tin: "🥫", tip: "", sip: "🥤", sit: "🪑", pit: "", nip: "", snap: "📸", spin: "🌀", ant: "🐜", pants: "👖",
  // Group 2
  cat: "🐱", can: "🥫", cap: "🧢", kit: "🧰", kid: "🧒", ten: "🔟", net: "🥅", pet: "🐕", pen: "🖊️", hen: "🐔",
  red: "🟥", hat: "🎩", hit: "", him: "", ham: "🍖", rat: "🐀", ran: "🏃", rip: "", man: "👨", map: "🗺️",
  mat: "", men: "👬", mad: "😠", sad: "😢", dad: "👨", did: "", dip: "", deck: "", neck: "🦒", kick: "🦵",
  sick: "🤒", pick: "", tick: "✅", sack: "", tent: "⛺", milk: "",
  // Group 3
  dog: "🐶", log: "🪵", got: "", hot: "🔥", pot: "🍲", top: "🔝", mop: "", hop: "🐇", on: "", not: "",
  sun: "☀️", run: "🏃", fun: "🎉", bun: "🍞", bus: "🚌", cup: "🥤", pup: "🐶", mud: "", rug: "", mug: "☕",
  hug: "🤗", bug: "🐛", nut: "🥜", cut: "✂️", hut: "🛖", up: "⬆️", us: "", big: "", bag: "👜", bat: "🦇",
  bed: "🛏️", bin: "🗑️", leg: "🦵", lip: "👄", lid: "", let: "", fan: "🪭", fin: "", fit: "", fog: "🌫️",
  gum: "", pig: "🐷", dig: "⛏️", fell: "", bell: "🔔", doll: "🪆", hill: "⛰️", fill: "", tell: "", sell: "",
  off: "📴", puff: "💨", kiss: "💋", mess: "", less: "", miss: "", dress: "👗", frog: "🐸", flag: "🚩",
  drum: "🥁", gift: "🎁", lamp: "💡", belt: "", sock: "🧦", lock: "🔒", rock: "🪨", clock: "⏰", duck: "🦆",
  luck: "🍀", Mum: "👩", and: "", had: "", hid: "", a: "",
}

export interface Word {
  text: string
  group: GroupId
  emoji: string
}

export const words: Word[] = Object.entries(wordEmoji).map(([text, emoji]) => ({
  text,
  emoji,
  group: wordGroup(text) as GroupId,
}))

// Tricky (irregular) words, introduced a few per group. `tricky` = indexes of the letters that don't follow the rules.
export interface TrickyWord {
  text: string
  group: GroupId
  tricky: number[]
}

export const trickyWords: TrickyWord[] = [
  { text: "I", group: 1, tricky: [0] },
  { text: "the", group: 2, tricky: [1, 2] },
  { text: "to", group: 2, tricky: [1] },
  { text: "he", group: 2, tricky: [1] },
  { text: "me", group: 2, tricky: [1] },
  { text: "she", group: 3, tricky: [0, 1, 2] },
  { text: "we", group: 3, tricky: [1] },
  { text: "be", group: 3, tricky: [1] },
  { text: "was", group: 3, tricky: [1, 2] },
  { text: "do", group: 3, tricky: [1] },
]

const trickyByText = new Map(trickyWords.map((t) => [t.text.toLowerCase(), t]))
export const isTricky = (word: string) => trickyByText.has(word.toLowerCase())

// Is this word readable by a child who has unlocked up to `group`?
export const canRead = (word: string, group: GroupId) => {
  const tricky = trickyByText.get(word.toLowerCase())
  if (tricky) return tricky.group <= group
  const g = wordGroup(word)
  return g !== null && g <= group
}

// Sentence lexicon (only words that are also in `words`/`trickyWords`, so audio exists for each)
const people = ["Dad", "Mum", "Pat", "Pip", "Sam", "Tim", "Ben", "Meg"]
const animals = ["cat", "dog", "rat", "hen", "pig", "duck", "bug", "frog", "bat", "pup"]
const holdables = ["hat", "pen", "map", "cap", "bag", "cup", "mug", "pot", "pan", "drum", "bell", "doll", "gift", "sock", "clock", "lamp", "net", "kit", "bun", "nut", "tin"]
const adjectives = ["big", "red", "hot", "sad", "mad"]
const canVerbs = ["nap", "sit", "run", "hop", "dig", "kick", "spin", "tap"]
const placesBy: Record<string, string[]> = {
  on: ["mat", "bed", "rug", "log", "rock", "hill", "bus", "deck"],
  in: ["bag", "pot", "cup", "tin", "pan", "hut", "sack", "bed", "net", "tent", "bin", "mud"],
  off: ["log", "bed", "rock", "hill", "mat", "bus"],
  to: ["hut", "bus", "hill", "bed", "tent"],
}
const pastWithPlace: { verb: string; prep: keyof typeof placesBy }[] = [
  { verb: "sat", prep: "on" },
  { verb: "sat", prep: "in" },
  { verb: "hid", prep: "in" },
  { verb: "fell", prep: "off" },
  { verb: "ran", prep: "to" },
]

// Tokens: plain words, or slot names in braces
type Token = string
const templates: Token[][] = [
  ["I", "{can}"],
  ["I", "can", "{can}"],
  ["{person}", "sat"],
  ["{person}", "can", "{can}"],
  ["{det}", "{animal}", "can", "{can}"],
  ["{det}", "{animal}", "{past}", "{prep}", "the", "{place}"],
  ["{person}", "{past}", "{prep}", "the", "{place}"],
  ["{person}", "had", "a", "{holdable}"],
  ["{person}", "got", "a", "{adj}", "{holdable}"],
  ["{pronoun}", "had", "a", "{adj}", "{holdable}"],
  ["{person}", "and", "{person2}", "ran", "up", "the", "hill"],
  ["the", "{adj}", "{animal}", "sat", "on", "the", "{place:on}"],
  ["it", "was", "a", "{adj}", "{animal}"],
  ["{person}", "was", "{adj}"],
  ["{person}", "hid", "in", "a", "{place:in}"],
  ["I", "sat", "in", "a", "{place:in}"],
]

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

// Build one sentence from a template, choosing only readable words. Returns null if the template can't be filled.
const fill = (template: Token[], group: GroupId): string | null => {
  const ok = (w: string) => canRead(w, group)
  const choose = (list: string[]) => {
    const options = list.filter(ok)
    return options.length ? pick(options) : null
  }
  const out: string[] = []
  let prep: keyof typeof placesBy | null = null
  let person: string | null = null
  for (const token of template) {
    let word: string | null
    if (!token.startsWith("{")) word = ok(token) ? token : null
    else {
      const slot = token.slice(1, -1)
      if (slot === "person") word = person = choose(people)
      else if (slot === "person2") word = choose(people.filter((p) => p !== person))
      else if (slot === "animal") word = choose(animals)
      else if (slot === "holdable") word = choose(holdables)
      else if (slot === "adj") word = choose(adjectives)
      else if (slot === "can") word = choose(canVerbs)
      else if (slot === "det") word = choose(["the", "a"])
      else if (slot === "pronoun") word = choose(["he", "she", "we", "I"])
      else if (slot === "past") {
        const options = pastWithPlace.filter((p) => ok(p.verb) && ok(p.prep) && placesBy[p.prep].some(ok))
        const chosen = options.length ? pick(options) : null
        prep = chosen?.prep ?? null
        word = chosen?.verb ?? null
      } else if (slot === "prep") word = prep
      else if (slot === "place") word = prep ? choose(placesBy[prep]) : null
      else if (slot.startsWith("place:")) word = choose(placesBy[slot.slice(6)])
      else word = null
    }
    if (!word) return null
    out.push(word)
  }
  const sentence = out.join(" ")
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + "."
}

export const generateEnglishSentences = (group: GroupId, count: number): string[] => {
  const found = new Set<string>()
  for (let attempt = 0; found.size < count && attempt < count * 40; attempt++) {
    const s = fill(pick(templates), group)
    if (s) found.add(s)
  }
  const list = [...found]
  if (!list.length) return []
  while (list.length < count) list.push(list[list.length % found.size])
  return list.sort(() => Math.random() - 0.5)
}

// Every word that can appear on screen (needs an audio clip)
export const vocabulary = [
  ...new Set(
    [
      ...words.map((w) => w.text),
      ...trickyWords.map((t) => t.text),
      ...people,
      ...animals,
      ...holdables,
      ...adjectives,
      ...canVerbs,
      ...Object.keys(placesBy),
      ...Object.values(placesBy).flat(),
      ...pastWithPlace.map((p) => p.verb),
      ...templates.flat().filter((t) => !t.startsWith("{")),
    ].map((w) => w.toLowerCase()),
  ),
]

// Distractors for Listen & Choose: prefer words that differ from the target by exactly one sound (cat -> cap, hat)
export const similarWords = (target: string, pool: string[], n = 2): string[] => {
  const t = segment(target)
  const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5)
  const scored = pool
    .filter((w) => w !== target)
    .map((w) => {
      const s = segment(w)
      return { w, diff: s.length === t.length ? s.filter((g, i) => g !== t[i]).length : 99 }
    })
  const ordered = [
    ...shuffle(scored.filter((x) => x.diff === 1)),
    ...shuffle(scored.filter((x) => x.diff > 1 && x.diff < 99)),
    ...shuffle(scored.filter((x) => x.diff === 99)),
  ]
  return [...new Set(ordered.map((x) => x.w))].slice(0, n)
}

export const audioPath = (kind: "sound" | "word", id: string) =>
  `/audio/en/${kind}-${id.toLowerCase()}.mp3`
