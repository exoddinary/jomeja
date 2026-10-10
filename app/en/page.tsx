"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BarChart3, BookOpen, Lock, Play, RotateCcw, User, X } from "lucide-react"
import SentenceCard, { type SentenceCardLabels } from "@/components/sentence-card"
import { BlendCard, ChooseCard, SoundCard, SpellCard, TrickyCard, en, playWord } from "@/components/english/cards"
import { useProfile } from "@/context/profile-context"
import { playClip } from "@/lib/english/audio"
import {
  MAX_GROUP,
  generateEnglishSentences,
  groupLabels,
  similarWords,
  sounds,
  trickyWords,
  words,
  type GroupId,
  type Sound,
  type TrickyWord,
  type Word,
} from "@/lib/english/phonics"
import {
  MASTERY_THRESHOLD,
  MASTERY_WINDOW,
  applyAttempts,
  groupMastery,
  itemKey,
  newProgress,
  pickItems,
  sentenceAttempts,
  unlockIfReady,
  type Activity,
  type Attempt,
  type EnglishProgress,
  type EnglishSession,
} from "@/lib/english/progress"
import type { WordMark } from "@/lib/sentences"

const LANGUAGE_KEY = "jom-eja-language"
const SETTINGS_KEY = "jom-read-settings"
const FEEDBACK_MS = 1000

type RoundItem =
  | { kind: "sound"; group: GroupId; sound: Sound }
  | { kind: "word"; group: GroupId; word: Word; options?: string[] }
  | { kind: "tricky"; group: GroupId; tricky: TrickyWord }
  | { kind: "sentence"; group: GroupId; text: string }

interface ItemResult {
  item: RoundItem
  correct: boolean
  marks?: WordMark[]
}

const activities: { id: Exclude<Activity, "placement">; title: string; desc: string; icon: string }[] = [
  { id: "sounds", title: "Sounds", desc: "Say the sound for each letter", icon: "🔤" },
  { id: "blend", title: "Blend", desc: "Sound out and read words", icon: "🧩" },
  { id: "choose", title: "Listen & Choose", desc: "Hear a word, find it", icon: "👂" },
  { id: "spell", title: "Spell", desc: "Hear it, say the sounds, write it", icon: "✏️" },
  { id: "tricky", title: "Tricky Words", desc: "Read by sight", icon: "⭐" },
  { id: "sentences", title: "Sentences", desc: "Read whole sentences", icon: "📖" },
]
const activityTitle = (a: Activity) => (a === "placement" ? "Placement check" : activities.find((x) => x.id === a)!.title)

const sentenceLabels: SentenceCardLabels = {
  pointHint: "Child reads the highlighted word, then mark it:",
  help: "🔊 Hear",
  wrong: "✗ Not yet",
  right: "✓ Got it",
  undo: "← Back one word",
  tapHint: "Tap any word read wrongly. Press and hold a word to hear it (counts as helped).",
  marked: (wrong, helped) => `${wrong} wrong · ${helped} helped · tap again to change`,
  allRight: "✓ All correct · Next",
  next: "Next →",
}

const label = (item: RoundItem) =>
  item.kind === "sound" ? item.sound.id : item.kind === "word" ? item.word.text : item.kind === "tricky" ? item.tricky.text : item.text
const keyOf = (item: RoundItem) =>
  item.kind === "sound" ? itemKey("sound", item.sound.id) : item.kind === "tricky" ? itemKey("tricky", item.tricky.text) : itemKey("word", label(item))
const playItem = (item: RoundItem) =>
  item.kind === "sound" ? playClip("sound", item.sound.id, `${item.sound.id}, as in ${item.sound.example}`) : item.kind !== "sentence" && playWord(label(item))

const readableWords = (progress: EnglishProgress, minLength: number) =>
  words.filter((w) => w.text.length >= minLength && w.text === w.text.toLowerCase() && w.group <= progress.unlockedGroup)

const buildRound = (activity: Activity, progress: EnglishProgress, count: number): RoundItem[] => {
  if (activity === "placement") {
    return ([1, 2, 3] as GroupId[]).flatMap((group) => [
      ...sounds.filter((s) => s.group === group).map((sound): RoundItem => ({ kind: "sound", group, sound })),
      ...words
        .filter((w) => w.group === group && w.text.length >= 3 && w.text === w.text.toLowerCase())
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((word): RoundItem => ({ kind: "word", group, word })),
    ])
  }
  if (activity === "sounds") {
    return pickItems(sounds, count, progress, (s) => itemKey("sound", s.id), (s) => s.group).map((sound) => ({
      kind: "sound",
      group: sound.group,
      sound,
    }))
  }
  if (activity === "tricky") {
    return pickItems(trickyWords, count, progress, (t) => itemKey("tricky", t.text), (t) => t.group).map((tricky) => ({
      kind: "tricky",
      group: tricky.group,
      tricky,
    }))
  }
  if (activity === "sentences") {
    return generateEnglishSentences(progress.unlockedGroup, count).map((text) => ({
      kind: "sentence",
      group: progress.unlockedGroup,
      text,
    }))
  }
  const pool = readableWords(progress, activity === "choose" ? 3 : 2)
  return pickItems(pool, count, progress, (w) => itemKey("word", w.text), (w) => w.group).map((word) => ({
    kind: "word",
    group: word.group,
    word,
    options:
      activity === "choose"
        ? [word.text, ...similarWords(word.text, pool.map((w) => w.text))].sort(() => Math.random() - 0.5)
        : undefined,
  }))
}

// Placement stops at the first group the child isn't secure in (below 90%)
const placementGroup = (results: ItemResult[]): GroupId | null => {
  for (const group of [1, 2, 3] as GroupId[]) {
    const inGroup = results.filter((r) => r.item.group === group)
    if (!inGroup.length) return null
    if (inGroup.filter((r) => r.correct).length / inGroup.length < MASTERY_THRESHOLD) return group
  }
  return null
}

export default function EnglishHome() {
  const router = useRouter()
  const { loaded, currentProfile, updateCurrentProfileEnglish } = useProfile()
  const [roundSize, setRoundSize] = useState(10)
  const [pointMode, setPointMode] = useState(false)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [screen, setScreen] = useState<"home" | "play" | "results">("home")
  const [activity, setActivity] = useState<Activity>("sounds")
  const [items, setItems] = useState<RoundItem[]>([])
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<ItemResult[]>([])
  const [feedback, setFeedback] = useState<{ correct: boolean; item: RoundItem } | null>(null)
  const [lastSession, setLastSession] = useState<EnglishSession | null>(null)
  const [lastResults, setLastResults] = useState<ItemResult[]>([])
  const feedbackTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => localStorage.setItem(LANGUAGE_KEY, "en"), [])
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}")
      if (saved.roundSize) setRoundSize(saved.roundSize)
      if (typeof saved.pointMode === "boolean") setPointMode(saved.pointMode)
    } catch {}
    setSettingsLoaded(true)
  }, [])
  useEffect(() => {
    if (settingsLoaded) localStorage.setItem(SETTINGS_KEY, JSON.stringify({ roundSize, pointMode }))
  }, [roundSize, pointMode, settingsLoaded])
  useEffect(() => {
    if (loaded && !currentProfile) router.push("/profile")
  }, [loaded, currentProfile, router])
  useEffect(() => () => clearTimeout(feedbackTimer.current), [])

  if (!loaded || !currentProfile) return <div className={en.page} />

  const progress = currentProfile.english ?? newProgress()
  const mastery = groupMastery(progress, progress.unlockedGroup)

  const start = (a: Activity, roundItems?: RoundItem[]) => {
    const next = roundItems ?? buildRound(a, progress, roundSize)
    if (!next.length) return
    clearTimeout(feedbackTimer.current)
    setActivity(a)
    setItems(next)
    setIndex(0)
    setResults([])
    setFeedback(null)
    setScreen("play")
    window.scrollTo({ top: 0 })
  }

  const finish = (all: ItemResult[]) => {
    const attempts: Attempt[] = all.flatMap((r) =>
      r.marks ? sentenceAttempts(r.marks) : [{ key: keyOf(r.item), group: r.item.group, correct: r.correct }],
    )
    let updated = applyAttempts(progress, attempts)
    let unlocked: GroupId | undefined
    if (activity === "placement") {
      const group = placementGroup(all) ?? MAX_GROUP
      updated = { ...updated, placed: true, unlockedGroup: group }
    } else {
      unlocked = unlockIfReady(updated) ?? undefined
      if (unlocked) updated = { ...updated, unlockedGroup: unlocked }
    }
    // Sentences are scored per word; everything else per card
    const scored = all.some((r) => r.marks) ? attempts : all
    const now = new Date()
    const session: EnglishSession = {
      date: now.toLocaleDateString("en-MY"),
      time: now.toLocaleTimeString("en-MY", { hour12: false }),
      activity,
      group: updated.unlockedGroup,
      correct: scored.filter((r) => r.correct).length,
      total: scored.length,
      items: all.map((r) => ({ item: label(r.item), correct: r.correct, marks: r.marks })),
      unlocked,
    }
    updateCurrentProfileEnglish({ ...updated, sessions: [...updated.sessions, session].slice(-200) })
    setLastSession(session)
    setLastResults(all)
    setScreen("results")
  }

  const answer = (correct: boolean, marks?: WordMark[]) => {
    if (feedback) return
    const item = items[index]
    const all = [...results, { item, correct, marks }]
    setResults(all)
    const advance = () => {
      setFeedback(null)
      const nextItem = items[index + 1]
      // Placement ends early once a group falls below the mastery threshold
      const groupDone = activity === "placement" && (!nextItem || nextItem.group !== item.group)
      if (!nextItem || (groupDone && placementGroup(all) !== null)) finish(all)
      else setIndex(index + 1)
    }
    if (item.kind === "sentence") return advance()
    // Brief corrective feedback: show and play the right answer
    setFeedback({ correct, item })
    playItem(item)
    feedbackTimer.current = setTimeout(advance, FEEDBACK_MS)
  }

  const unlockNow = () => {
    if (progress.unlockedGroup >= MAX_GROUP) return
    if (!window.confirm(`Unlock Level ${progress.unlockedGroup + 1} now? It's best to wait until Level ${progress.unlockedGroup} is at 90%.`)) return
    updateCurrentProfileEnglish({ ...progress, unlockedGroup: (progress.unlockedGroup + 1) as GroupId })
  }

  const exitRound = () => {
    if (!window.confirm("Stop this round? Progress from this round won't be saved.")) return
    clearTimeout(feedbackTimer.current)
    setFeedback(null)
    setScreen("home")
  }

  const item = items[index]
  const missed = lastResults.filter((r) => !r.correct).map((r) => r.item)

  return (
    <div className={en.page}>
      <header className="flex justify-between items-center mb-5">
        <Link href="/?choose=1" aria-label="Change language">
          <h1 className="text-2xl font-black">
            Jom <span className="text-teal-400">Read</span>
          </h1>
        </Link>
        {screen === "play" ? (
          <button type="button" onClick={exitRound} className={en.ghost}>
            <X className="w-5 h-5" /> Exit
          </button>
        ) : (
          <div className="flex gap-2">
            <Link href="/bm" className={`${en.ghost} px-3`} aria-label="Tukar ke Bahasa Melayu">
              🇲🇾 BM
            </Link>
            <Link href="/en/guide" className={`${en.ghost} px-3`} aria-label="Parent guide">
              <BookOpen className="w-5 h-5" />
            </Link>
            <Link href="/en/stats" className={`${en.ghost} px-3`} aria-label="Progress">
              <BarChart3 className="w-5 h-5" />
            </Link>
            <Link href="/profile" className={`${en.ghost} px-3`} aria-label="Switch profile">
              <User className="w-5 h-5" />
              <span className="max-w-[4rem] truncate">{currentProfile.name}</span>
            </Link>
          </div>
        )}
      </header>

      {screen === "home" && (
        <div className="space-y-5">
          {!progress.placed && (
            <div className="rounded-2xl p-5 bg-gradient-to-br from-teal-500 to-teal-700 text-slate-950">
              <div className="text-xs font-black uppercase tracking-widest">First mission</div>
              <h2 className="text-2xl font-black mt-1">Quick placement check</h2>
              <p className="text-sm mt-1 mb-4 font-semibold">
                3–5 minutes. Finds where {currentProfile.name} should start, so nothing is too easy or too hard.
              </p>
              <button type="button" onClick={() => start("placement")} className="w-full rounded-xl bg-slate-950 text-white font-black py-3">
                Start check
              </button>
              <button
                type="button"
                onClick={() => updateCurrentProfileEnglish({ ...progress, placed: true })}
                className="w-full text-sm font-black mt-3 underline underline-offset-4"
              >
                Skip and start at Level 1
              </button>
            </div>
          )}

          <section className={`${en.panel} p-4`}>
            <div className="flex justify-between items-baseline mb-3">
              <h2 className="text-lg font-black">Level {progress.unlockedGroup} <span className="text-slate-500">/ {MAX_GROUP}</span></h2>
              <span className="text-xs text-slate-400">Phase 1</span>
            </div>
            <div className="space-y-2 mb-4">
              {([1, 2, 3] as GroupId[]).map((g) => {
                const open = g <= progress.unlockedGroup
                return (
                  <div
                    key={g}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                      g === progress.unlockedGroup ? "bg-teal-400/15 ring-1 ring-teal-400" : open ? "bg-slate-800" : "bg-slate-800/40 text-slate-500"
                    }`}
                  >
                    <span className="w-6 text-center font-black">{open ? g : <Lock className="w-4 h-4 inline" />}</span>
                    <span className="flex-1 tracking-widest font-black">{groupLabels[g]}</span>
                    {g < progress.unlockedGroup && <span className="text-lime-400 text-sm">✓</span>}
                  </div>
                )
              })}
            </div>
            {progress.unlockedGroup < MAX_GROUP ? (
              <>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>
                    Mastery: {Math.round(mastery.accuracy * 100)}% over last {mastery.attempts}/{MASTERY_WINDOW}
                  </span>
                  <span>Unlocks at 90%</span>
                </div>
                <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-lime-400"
                    style={{ width: `${(mastery.attempts / MASTERY_WINDOW) * Math.min(mastery.accuracy / MASTERY_THRESHOLD, 1) * 100}%` }}
                  />
                </div>
                <button type="button" onClick={unlockNow} className="text-xs text-slate-500 underline underline-offset-4 mt-3">
                  Unlock Level {progress.unlockedGroup + 1} now (parent override)
                </button>
              </>
            ) : (
              <p className="text-sm text-slate-400">All Phase 1 levels unlocked. Keep practising: Phase 2 (ai, ee, sh, th…) is coming next.</p>
            )}
          </section>

          <section>
            <h2 className="text-lg font-black mb-3">Missions</h2>
            <div className="grid grid-cols-2 gap-3">
              {activities.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => start(a.id)}
                  className={`${en.panel} p-4 text-left hover:border-teal-400 transition-colors touch-manipulation`}
                >
                  <div className="text-3xl mb-2">{a.icon}</div>
                  <div className="font-black">{a.title}</div>
                  <div className="text-xs text-slate-400">{a.desc}</div>
                </button>
              ))}
            </div>
          </section>

          <section className={`${en.panel} p-4 space-y-4`}>
            <div>
              <div className="text-sm font-black mb-2">Cards per round</div>
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 15].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRoundSize(n)}
                    aria-pressed={roundSize === n}
                    className={`rounded-xl py-2 font-black ${roundSize === n ? "bg-teal-400 text-slate-900" : "bg-slate-800"}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={pointMode}
              onClick={() => setPointMode(!pointMode)}
              className="w-full flex items-center gap-3 text-left"
            >
              <span className="flex-1">
                <span className="block text-sm font-black">Point mode for sentences</span>
                <span className="block text-xs text-slate-400">Highlights one word at a time. Good for new readers.</span>
              </span>
              <span className={`w-12 h-7 rounded-full relative transition-colors ${pointMode ? "bg-lime-400" : "bg-slate-700"}`}>
                <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${pointMode ? "left-6" : "left-1"}`} />
              </span>
            </button>
          </section>

          <Link href="/en/guide" className="block text-center text-sm text-teal-300 underline underline-offset-4 pb-6">
            New to phonics? Read the parent guide →
          </Link>
        </div>
      )}

      {screen === "play" && item && (
        <div className="text-center">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span className="font-black text-slate-100">{activityTitle(activity)}</span>
            <span>
              {index + 1} / {items.length}
              {activity === "placement" && ` · Level ${item.group}`}
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-5">
            <div className="h-full bg-teal-400 transition-all" style={{ width: `${(index / items.length) * 100}%` }} />
          </div>

          <div className="relative">
            {item.kind === "sound" && <SoundCard key={index} sound={item.sound} onMark={answer} disabled={!!feedback} />}
            {item.kind === "tricky" && <TrickyCard key={index} tricky={item.tricky} onMark={answer} disabled={!!feedback} />}
            {item.kind === "word" &&
              (activity === "choose" ? (
                <ChooseCard key={index} word={item.word} options={item.options ?? [item.word.text]} onMark={answer} disabled={!!feedback} />
              ) : activity === "spell" ? (
                <SpellCard key={index} word={item.word} onMark={answer} disabled={!!feedback} />
              ) : (
                <BlendCard key={index} word={item.word} onMark={answer} disabled={!!feedback} />
              ))}
            {item.kind === "sentence" && (
              <SentenceCard
                key={index}
                sentence={item.text}
                pointMode={pointMode}
                labels={sentenceLabels}
                onHelp={playWord}
                onSubmit={(marks) => answer(marks.every((m) => m.mark === "betul"), marks)}
              />
            )}

            {feedback && (
              <div className="absolute inset-x-0 top-0 flex justify-center pointer-events-none">
                <div
                  className={`mt-3 px-5 py-3 rounded-2xl font-black text-2xl shadow-lg ${
                    feedback.correct ? "bg-lime-400 text-slate-900" : "bg-slate-100 text-slate-900"
                  }`}
                >
                  {feedback.correct ? "✓ " : "→ "}
                  {feedback.item.kind === "word" && feedback.item.word.emoji} {label(feedback.item)}
                  {feedback.item.kind === "sound" && ` as in ${feedback.item.sound.example}`}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {screen === "results" && lastSession && (
        <div className="space-y-4">
          <section className={`${en.panel} p-6 text-center`}>
            <div className="text-xs uppercase tracking-widest text-slate-400">{activityTitle(lastSession.activity)}</div>
            {lastSession.activity === "placement" ? (
              <>
                <h2 className="text-3xl font-black mt-2">Start at Level {lastSession.group}</h2>
                <p className="text-slate-400 mt-2">
                  {lastSession.correct}/{lastSession.total} correct. Levels before this are secure; Level {lastSession.group} (
                  <span className="tracking-widest">{groupLabels[lastSession.group]}</span>) is where practice will help most.
                </p>
              </>
            ) : (
              <>
                <div className="text-6xl font-black mt-2">
                  {lastSession.correct}
                  <span className="text-2xl text-slate-500"> / {lastSession.total}</span>
                </div>
                <p className="text-slate-400 mt-1">
                  {lastSession.correct / Math.max(lastSession.total, 1) >= 0.9 ? "Excellent work!" : "Good effort. Practice makes it stick."}
                </p>
              </>
            )}
            {lastSession.unlocked && (
              <div className="mt-4 rounded-xl bg-lime-400 text-slate-900 p-3 font-black">
                🔓 Level {lastSession.unlocked} unlocked! New sounds:{" "}
                <span className="tracking-widest">{groupLabels[lastSession.unlocked]}</span>
              </div>
            )}
          </section>

          <div className="space-y-3">
            {missed.length > 0 && lastSession.activity !== "placement" && (
              <button type="button" onClick={() => start(lastSession.activity, missed)} className={`${en.accent} w-full text-lg`}>
                <RotateCcw className="w-5 h-5" /> Practise {missed.length} missed
              </button>
            )}
            {lastSession.activity !== "placement" && (
              <button type="button" onClick={() => start(lastSession.activity)} className={`${en.primary} w-full text-lg`}>
                <Play className="w-5 h-5 fill-slate-900" /> Again
              </button>
            )}
            <button type="button" onClick={() => setScreen("home")} className={`${en.ghost} w-full`}>
              Back to missions
            </button>
          </div>

          <section className={`${en.panel} p-4`}>
            <h3 className="font-black mb-3">Details</h3>
            <div className="flex flex-wrap gap-2">
              {lastResults.map((r, i) =>
                r.marks ? (
                  <div key={i} className="w-full bg-slate-800 rounded-xl p-2 flex flex-wrap gap-1">
                    {r.marks.map((m, j) => (
                      <span
                        key={j}
                        className={`px-1.5 rounded ${m.mark === "salah" ? "bg-rose-500/30 line-through" : m.mark === "bantu" ? "bg-amber-400/30" : ""}`}
                      >
                        {m.word}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span key={i} className={`px-3 py-1 rounded-lg font-black ${r.correct ? "bg-lime-400/20 text-lime-300" : "bg-rose-500/20 text-rose-300"}`}>
                    {label(r.item)}
                  </span>
                ),
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
