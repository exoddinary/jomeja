import type { WordMark } from "@/lib/sentences"
import { MAX_GROUP, isTricky, trickyWords, wordGroup, type GroupId } from "./phonics"

export type Activity = "sounds" | "blend" | "choose" | "spell" | "tricky" | "sentences" | "placement"
export type ItemKind = "sound" | "word" | "tricky"

export interface ItemStat {
  count: number
  wrong: number
}

export interface SessionItem {
  item: string
  correct: boolean
  marks?: WordMark[] // sentences only
}

export interface EnglishSession {
  date: string
  time: string
  activity: Activity
  group: GroupId
  correct: number
  total: number
  items: SessionItem[]
  unlocked?: GroupId // group unlocked at the end of this session
}

export interface EnglishProgress {
  placed: boolean
  unlockedGroup: GroupId
  recent: Partial<Record<GroupId, boolean[]>> // last attempts per group, for the mastery gate
  items: Record<string, ItemStat> // keyed "sound:s", "word:cat", "tricky:the"
  sessions: EnglishSession[]
}

export const MASTERY_WINDOW = 20
export const MASTERY_THRESHOLD = 0.9

export const newProgress = (): EnglishProgress => ({ placed: false, unlockedGroup: 1, recent: {}, items: {}, sessions: [] })

export const itemKey = (kind: ItemKind, id: string) => `${kind}:${id.toLowerCase()}`

export interface Attempt {
  key: string
  group: GroupId
  correct: boolean
}

// Turn a marked sentence into one attempt per word
export const sentenceAttempts = (marks: WordMark[]): Attempt[] =>
  marks.map(({ word, mark }) => {
    const tricky = isTricky(word)
    const group = tricky
      ? trickyWords.find((t) => t.text.toLowerCase() === word.toLowerCase())!.group
      : (wordGroup(word) ?? 1)
    return { key: itemKey(tricky ? "tricky" : "word", word), group, correct: mark === "betul" }
  })

export const groupMastery = (progress: EnglishProgress, group: GroupId) => {
  const recent = progress.recent[group] ?? []
  const accuracy = recent.length ? recent.filter(Boolean).length / recent.length : 0
  return {
    attempts: recent.length,
    accuracy,
    ready: recent.length >= MASTERY_WINDOW && accuracy >= MASTERY_THRESHOLD,
  }
}

export const applyAttempts = (progress: EnglishProgress, attempts: Attempt[]): EnglishProgress => {
  const items = { ...progress.items }
  const recent = { ...progress.recent }
  for (const a of attempts) {
    const prev = items[a.key] ?? { count: 0, wrong: 0 }
    items[a.key] = { count: prev.count + 1, wrong: prev.wrong + (a.correct ? 0 : 1) }
    recent[a.group] = [...(recent[a.group] ?? []), a.correct].slice(-MASTERY_WINDOW)
  }
  return { ...progress, items, recent }
}

// Unlock the next group once the current one is mastered
export const unlockIfReady = (progress: EnglishProgress): GroupId | null =>
  progress.unlockedGroup < MAX_GROUP && groupMastery(progress, progress.unlockedGroup).ready
    ? ((progress.unlockedGroup + 1) as GroupId)
    : null

// Weighted pick: ~70% from the newest unlocked group, ~30% review; weaker and unseen items come up more often
export const pickItems = <T,>(
  pool: T[],
  count: number,
  progress: EnglishProgress,
  keyOf: (item: T) => string,
  groupOf: (item: T) => GroupId,
): T[] => {
  const unlocked = pool.filter((i) => groupOf(i) <= progress.unlockedGroup)
  if (!unlocked.length) return []
  const weight = (i: T) => {
    const stat = progress.items[keyOf(i)]
    return stat ? 1 + (2 * stat.wrong) / stat.count : 2
  }
  const sample = (list: T[], n: number) => {
    const remaining = [...list]
    const out: T[] = []
    while (out.length < n && remaining.length) {
      const total = remaining.reduce((sum, i) => sum + weight(i), 0)
      let r = Math.random() * total
      const index = remaining.findIndex((i) => (r -= weight(i)) <= 0)
      out.push(...remaining.splice(index === -1 ? 0 : index, 1))
    }
    return out
  }

  const current = unlocked.filter((i) => groupOf(i) === progress.unlockedGroup)
  const review = unlocked.filter((i) => groupOf(i) < progress.unlockedGroup)
  const picked = sample(current, review.length ? Math.round(count * 0.7) : count)
  picked.push(...sample(review, count - picked.length))
  // Small pools (e.g. group 1 tricky words): repeat items so the round still has `count` cards
  while (picked.length < count) picked.push(...sample(unlocked, count - picked.length))
  return picked.sort(() => Math.random() - 0.5)
}
