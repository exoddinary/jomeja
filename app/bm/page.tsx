"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BarChart3, ChevronDown, Play, RotateCcw, SlidersHorizontal, User, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import FirstTimeModal from "@/components/first-time-modal"
import SentenceCard from "@/components/sentence-card"
import { useProfile, type AllLetterStats, type CardResult, type GameResult } from "@/context/profile-context"
import {
  allConsonants,
  allThirdLetters,
  allVowels,
  allWordGroupIds,
  defaultSettings,
  easyVowels,
  generateWords,
  getExamples,
  getWordPool,
  modeLabels,
  wordGroups,
  type GameMode,
  type GameSettings,
  type LetterCase,
  type SessionMode,
  type StatsMode,
} from "@/lib/words"
import {
  generateSentences,
  readingLevel,
  sentenceLevels,
  sentenceWords,
  type SentenceLevel,
  type WordMark,
} from "@/lib/sentences"

const SETTINGS_KEY = "jom-eja-settings"
const LANGUAGE_KEY = "jom-eja-language"
const shadow = "shadow-[6px_6px_0px_0px_rgba(30,41,59,1)]"
const iconButton =
  "inline-flex items-center gap-2 h-11 px-3 bg-slate-800 text-rose-100 border-4 border-slate-800 rounded-md hover:bg-slate-700 active:bg-slate-900 font-black touch-manipulation select-none"

type CharacterType = "happy" | "super" | "excited" | "sad"

const characterImages: Record<CharacterType, string> = {
  happy: "/images/lin-happy.png",
  super: "/images/happy-character.png",
  excited: "/images/lin-excited.png",
  sad: "/images/lin-sad.png",
}

// Correct-answer streak milestones that trigger a celebration character
const streakCharacters: Record<number, CharacterType> = { 5: "happy", 7: "super", 10: "excited" }

const levels: { mode: GameMode; title: string; sample: string; description: string; isNew?: boolean }[] = [
  {
    mode: "2letter",
    title: "2 Huruf",
    sample: "ba · ki",
    description: "Suku kata asas: konsonan + vokal. Sesuai untuk permulaan.",
  },
  {
    mode: "3letter",
    title: "3 Huruf",
    sample: "man · kah",
    description: "Suku kata tertutup: konsonan + vokal + huruf akhir.",
  },
  {
    mode: "4letter",
    title: "4 Huruf",
    sample: "buku · syok",
    description: "Perkataan sebenar yang biasa didengar di Malaysia, termasuk ng, ny, sy dan kh.",
  },
  {
    mode: "ayat",
    title: "Ayat",
    sample: "Adik makan roti.",
    description: "Baca ayat pendek. Ketik perkataan yang salah sahaja.",
    isNew: true,
  },
]

interface Session {
  mode: SessionMode
  level: SentenceLevel
  words: string[] // flashcard words, or sentences in "ayat" mode
  index: number
  correct: number
  wrong: number
  helped: number
  streak: number
  wrongStreak: number
  totalMarks: number
  startTime: number
  cardResults: CardResult[]
}

// Marks based on how quickly the child reads the card
const calculateMarks = (timeSpent: number) => (timeSpent < 5000 ? 3 : timeSpent < 10000 ? 2 : 1)

const toggleIn = (list: string[], item: string) =>
  list.includes(item) ? (list.length > 1 ? list.filter((x) => x !== item) : list) : [...list, item]

const mergeLetterStats = (all: AllLetterStats, mode: StatsMode, cards: CardResult[]): AllLetterStats => {
  const stats = { ...(all[mode] ?? {}) }
  for (const card of cards) {
    for (const letter of new Set(card.syllable.toUpperCase())) {
      const prev = stats[letter] ?? { totalTime: 0, count: 0, incorrect: 0 }
      stats[letter] = {
        totalTime: prev.totalTime + card.timeSpent,
        count: prev.count + 1,
        incorrect: (prev.incorrect ?? 0) + (card.correct ? 0 : 1),
      }
    }
  }
  return { ...all, [mode]: stats }
}

// Play sound effect using Web Audio API
const playSound = (isCorrect: boolean) => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    const notes = isCorrect ? [523.25, 659.25, 783.99] : [392.0, 329.63, 261.63]
    notes.forEach((freq, i) => oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.1))
    oscillator.type = "sine"
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  } catch (error) {
    console.log("Sound play failed:", error)
  }
}

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="flex border-4 border-slate-800 rounded-md overflow-hidden">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`flex-1 py-2 font-black text-lg border-r-4 last:border-r-0 border-slate-800 touch-manipulation select-none ${
            value === o.value ? "bg-slate-800 text-white" : "bg-white text-slate-800 hover:bg-rose-50"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-w-10 h-10 px-2 rounded-md border-2 border-slate-800 font-black touch-manipulation select-none ${
        active ? "bg-emerald-300 text-slate-800" : "bg-white text-slate-400 hover:bg-rose-50"
      }`}
    >
      {children}
    </button>
  )
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-full flex items-center gap-3 text-left touch-manipulation"
    >
      <span className="flex-1">
        <span className="block font-black text-slate-800">{label}</span>
        <span className="block text-xs text-slate-500">{hint}</span>
      </span>
      <span
        className={`w-14 h-8 shrink-0 rounded-full border-4 border-slate-800 relative transition-colors ${checked ? "bg-emerald-400" : "bg-slate-200"}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white border-2 border-slate-800 transition-all ${checked ? "left-6" : "left-0.5"}`}
        />
      </span>
    </button>
  )
}

function LetterPicker({
  title,
  letters,
  selected,
  onChange,
  presets,
}: {
  title: string
  letters: string[]
  selected: string[]
  onChange: (letters: string[]) => void
  presets?: { label: string; letters: string[] }[]
}) {
  const allPresets = presets ?? [{ label: "Semua", letters }]
  return (
    <div>
      <div className="flex items-center justify-between mb-2 gap-2">
        <span className="font-black text-slate-800">{title}</span>
        <div className="flex gap-1">
          {allPresets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange(p.letters)}
              className="text-xs font-black px-2 py-1 rounded border-2 border-slate-800 bg-white hover:bg-rose-50"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {letters.map((l) => (
          <Chip key={l} active={selected.includes(l)} onClick={() => onChange(toggleIn(selected, l))}>
            {l.toLowerCase()}
          </Chip>
        ))}
      </div>
    </div>
  )
}

export default function JomEja() {
  const router = useRouter()
  const { loaded, profiles, currentProfile, updateCurrentProfileStats } = useProfile()

  const [settings, setSettings] = useState<GameSettings>(defaultSettings)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [screen, setScreen] = useState<"home" | "play" | "results">("home")
  const [session, setSession] = useState<Session | null>(null)
  const [cardStart, setCardStart] = useState(0) // 0 means the timer is paused
  const [elapsed, setElapsed] = useState(0)
  const [character, setCharacter] = useState<CharacterType | null>(null)
  const [lastResult, setLastResult] = useState<GameResult | null>(null)
  const [showIntro, setShowIntro] = useState(false)
  const characterTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Remember Malay as the last-used language for the landing page
  useEffect(() => localStorage.setItem(LANGUAGE_KEY, "bm"), [])

  // Load and persist settings so parents don't have to set them up every time
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY)
      if (saved) setSettings({ ...defaultSettings, ...JSON.parse(saved) })
    } catch {}
    setSettingsLoaded(true)
  }, [])

  useEffect(() => {
    if (settingsLoaded) localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  }, [settings, settingsLoaded])

  // Show intro for brand new users, otherwise make sure a profile is selected
  useEffect(() => {
    if (!loaded) return
    if (profiles.length === 0) {
      if (localStorage.getItem("jom-eja-intro-seen")) router.push("/profile")
      else setShowIntro(true)
    } else if (!currentProfile) {
      router.push("/profile")
    }
  }, [loaded, profiles.length, currentProfile, router])

  // Timer for current card
  useEffect(() => {
    if (screen !== "play" || !cardStart) return
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - cardStart) / 1000)), 250)
    return () => clearInterval(interval)
  }, [screen, cardStart])

  useEffect(() => () => clearTimeout(characterTimeout.current), [])

  const update = (patch: Partial<GameSettings>) => setSettings((s) => ({ ...s, ...patch }))

  const startGame = (words?: string[], mode: SessionMode = settings.mode, sentenceLevel = settings.sentenceLevel) => {
    if (!currentProfile) return router.push("/profile")
    clearTimeout(characterTimeout.current)
    setSession({
      mode,
      level: sentenceLevel,
      words:
        words ??
        (mode === "ayat"
          ? generateSentences(
              sentenceLevel,
              settings.wordsPerSession,
              settings.useChildName ? currentProfile.name : undefined,
            )
          : generateWords(settings)),
      index: 0,
      correct: 0,
      wrong: 0,
      helped: 0,
      streak: 0,
      wrongStreak: 0,
      totalMarks: 0,
      startTime: Date.now(),
      cardResults: [],
    })
    setCharacter(null)
    setCardStart(Date.now())
    setElapsed(0)
    setScreen("play")
    window.scrollTo({ top: 0 })
  }

  const exitGame = () => {
    if (!window.confirm("Hentikan sesi ini? Kemajuan sesi ini tidak akan disimpan.")) return
    clearTimeout(characterTimeout.current)
    setCharacter(null)
    setSession(null)
    setCardStart(0)
    setScreen("home")
  }

  // Shared by flashcards and sentences: stores the card, updates streaks, finishes the session
  const recordCard = (card: CardResult, counts: { correct: number; wrong: number; helped: number }) => {
    if (!session || !currentProfile) return
    const cardResults = [...session.cardResults, card]
    const next: Session = {
      ...session,
      cardResults,
      index: session.index + 1,
      totalMarks: session.totalMarks + card.marks,
      correct: session.correct + counts.correct,
      wrong: session.wrong + counts.wrong,
      helped: session.helped + counts.helped,
    }
    let celebrate: CharacterType | null = null

    if (card.correct) {
      next.streak++
      next.wrongStreak = 0
      celebrate = streakCharacters[next.streak] ?? null
    } else {
      next.streak = 0
      next.wrongStreak++
      // Show sad character after 3 wrong answers in a row
      if (next.wrongStreak === 3) {
        celebrate = "sad"
        next.wrongStreak = 0
      }
    }

    const finished = next.index >= next.words.length
    setSession(next)

    if (finished) {
      const now = new Date()
      const result: GameResult = {
        date: now.toLocaleDateString("ms-MY"),
        time: now.toLocaleTimeString("ms-MY", { hour12: false }),
        duration: Math.round((Date.now() - next.startTime) / 1000),
        correct: next.correct,
        wrong: next.wrong,
        helped: next.helped,
        mode: next.mode,
        level: next.mode === "ayat" ? next.level : undefined,
        totalWords: next.correct + next.wrong + next.helped,
        totalMarks: next.totalMarks,
        cardResults,
      }
      const isFlashcard = next.mode !== "ayat" && next.mode !== "kata"
      updateCurrentProfileStats(
        [...currentProfile.results, result],
        isFlashcard ? mergeLetterStats(currentProfile.letterStats, next.mode as StatsMode, cardResults) : currentProfile.letterStats,
      )
      setLastResult(result)
      setCardStart(0)
      setScreen("results")
    }

    if (celebrate) {
      // Pause the timer while the character is on screen, resume afterwards
      setCharacter(celebrate)
      setCardStart(0)
      characterTimeout.current = setTimeout(() => {
        setCharacter(null)
        if (!finished) {
          setCardStart(Date.now())
          setElapsed(0)
        }
      }, 2000)
    } else if (!finished) {
      setCardStart(Date.now())
      setElapsed(0)
    }
  }

  const handleAnswer = (isCorrect: boolean) => {
    if (!session || !cardStart || character || session.mode === "ayat") return
    const timeSpent = Date.now() - cardStart
    playSound(isCorrect)
    recordCard(
      { syllable: session.words[session.index], correct: isCorrect, timeSpent, marks: isCorrect ? calculateMarks(timeSpent) : 0 },
      { correct: isCorrect ? 1 : 0, wrong: isCorrect ? 0 : 1, helped: 0 },
    )
  }

  const handleSentence = (words: WordMark[]) => {
    if (!session || !cardStart || character) return
    const correct = words.filter((w) => w.mark === "betul").length
    const wrong = words.filter((w) => w.mark === "salah").length
    const helped = words.length - correct - wrong
    playSound(wrong === 0)
    recordCard(
      {
        syllable: session.words[session.index],
        correct: correct === words.length,
        timeSpent: Date.now() - cardStart,
        marks: correct === words.length ? 3 : wrong === 0 ? 2 : correct > 0 ? 1 : 0,
        words,
      },
      { correct, wrong, helped },
    )
  }

  // Keyboard shortcuts for desktop: ← wrong, → correct
  const answerRef = useRef(handleAnswer)
  answerRef.current = handleAnswer
  useEffect(() => {
    if (screen !== "play") return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") answerRef.current(true)
      if (e.key === "ArrowLeft") answerRef.current(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [screen])

  const handleIntroComplete = () => {
    localStorage.setItem("jom-eja-intro-seen", "true")
    setShowIntro(false)
    router.push("/profile")
  }

  const pageClass = "min-h-screen bg-rose-100 p-4 max-w-md mx-auto font-bold relative"
  const grid = (
    <div className="fixed inset-0 opacity-10 pointer-events-none">
      <div className="w-full h-full bg-grid-pattern"></div>
    </div>
  )

  if (!loaded || (!currentProfile && !showIntro)) return <div className={pageClass}>{grid}</div>

  const level = levels.find((l) => l.mode === settings.mode)!
  const wordPool = getWordPool(settings.wordGroupIds)
  const isAyat = settings.mode === "ayat"
  const sentenceLevel = sentenceLevels.find((l) => l.level === settings.sentenceLevel)!
  const advancedSummary = isAyat
    ? [settings.useChildName && `Nama ${currentProfile?.name}`, settings.pointMode ? "Mod Tunjuk" : "Ketik yang salah"]
        .filter(Boolean)
        .join(" · ")
    : settings.mode === "4letter"
      ? `${settings.wordGroupIds.length} kumpulan · ${wordPool.length} perkataan`
      : `Vokal: ${settings.vowels.map((v) => v.toLowerCase()).join(", ")} · ${settings.consonants.length} konsonan` +
        (settings.mode === "3letter" ? ` · ${settings.thirdLetters.length} huruf akhir` : "")
  const currentWord = session?.words[session.index]
  const isAyatResult = lastResult?.mode === "ayat"
  const wrongWords = isAyatResult
    ? [
        ...new Map(
          lastResult.cardResults
            .flatMap((c) => c.words ?? [])
            .filter((w) => w.mark !== "betul")
            .map((w) => [w.word.toLowerCase(), w.word] as const),
        ).values(),
      ]
    : (lastResult?.cardResults.filter((c) => !c.correct).map((c) => c.syllable) ?? [])
  const accuracy = lastResult && lastResult.totalWords ? lastResult.correct / lastResult.totalWords : 0
  const lastReadingLevel = readingLevel(accuracy)
  const readingMinutes = (lastResult?.cardResults.reduce((sum, c) => sum + c.timeSpent, 0) ?? 0) / 60000
  const wordsPerMinute = readingMinutes > 0 ? Math.round((lastResult?.totalWords ?? 0) / readingMinutes) : 0
  const lastLevel = (lastResult?.level ?? 1) as SentenceLevel
  const startAtLevel = (level: SentenceLevel) => {
    update({ sentenceLevel: level })
    startGame(undefined, "ayat", level)
  }

  return (
    <div className={pageClass}>
      {grid}

      {/* Header */}
      <header className="flex justify-between items-center mb-5 relative z-10">
        <Link href="/?choose=1" aria-label="Tukar bahasa">
          <h1 className="text-3xl font-black text-slate-800">Jom Eja</h1>
        </Link>
        {screen === "play" ? (
          <button type="button" onClick={exitGame} className={iconButton} aria-label="Keluar dari sesi">
            <X className="w-5 h-5" /> Keluar
          </button>
        ) : (
          <div className="flex gap-2">
            <Link href="/en" className={iconButton} aria-label="Switch to English">
              🇬🇧 EN
            </Link>
            <Link href="/statistics" className={iconButton} aria-label="Statistik">
              <BarChart3 className="w-5 h-5" />
            </Link>
            <Link href="/profile" className={iconButton} aria-label="Tukar profil">
              <User className="w-5 h-5" />
              <span className="max-w-[5rem] truncate">{currentProfile?.name}</span>
            </Link>
          </div>
        )}
      </header>

      {/* Home: choose level and start */}
      {screen === "home" && currentProfile && (
        <div className="space-y-5 relative z-10">
          <Card className={`bg-white border-4 border-slate-800 p-4 ${shadow}`}>
            <h2 className="text-lg font-black mb-3 text-slate-800">1. Pilih tahap</h2>
            <div className="grid grid-cols-2 gap-2">
              {levels.map((l) => (
                <button
                  key={l.mode}
                  type="button"
                  onClick={() => update({ mode: l.mode })}
                  aria-pressed={settings.mode === l.mode}
                  className={`relative rounded-md border-4 border-slate-800 py-3 px-1 text-center touch-manipulation select-none transition-transform ${
                    settings.mode === l.mode
                      ? "bg-yellow-300 -translate-y-0.5 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)]"
                      : "bg-white hover:bg-rose-50"
                  }`}
                >
                  {l.isNew && (
                    <span className="absolute -top-3 right-1 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded border-2 border-slate-800">
                      BARU
                    </span>
                  )}
                  <div className="text-xl font-black text-slate-800">{l.title}</div>
                  <div className="text-base text-slate-600 font-handwriting">{l.sample}</div>
                </button>
              ))}
            </div>
            <p className="text-sm mt-3 text-slate-600">{level.description}</p>
          </Card>

          <Card className={`bg-purple-200 border-4 border-slate-800 p-4 ${shadow}`}>
            <h2 className="text-lg font-black mb-3 text-slate-800">2. Tetapan</h2>
            <div className="space-y-4">
              {isAyat ? (
                <div>
                  <div className="font-black text-slate-800 mb-2">Tahap ayat</div>
                  <Segmented<SentenceLevel>
                    value={settings.sentenceLevel}
                    onChange={(sentenceLevel) => update({ sentenceLevel })}
                    options={sentenceLevels.map((l) => ({ value: l.level, label: l.title }))}
                  />
                  <p className="text-xs text-slate-600 mt-2">{sentenceLevel.description}</p>
                </div>
              ) : (
                <div>
                  <div className="font-black text-slate-800 mb-2">Bentuk huruf</div>
                  <Segmented<LetterCase>
                    value={settings.letterCase}
                    onChange={(letterCase) => update({ letterCase })}
                    options={[
                      { value: "Aa", label: "Ma" },
                      { value: "aa", label: "ma" },
                      { value: "AA", label: "MA" },
                    ]}
                  />
                </div>
              )}
              <div>
                <div className="font-black text-slate-800 mb-2">{isAyat ? "Bilangan ayat" : "Bilangan kad"}</div>
                <Segmented<number>
                  value={settings.wordsPerSession}
                  onChange={(wordsPerSession) => update({ wordsPerSession })}
                  options={[
                    { value: 5, label: "5" },
                    { value: 10, label: "10" },
                    { value: 20, label: "20" },
                  ]}
                />
              </div>

              <div className="bg-white border-4 border-slate-800 rounded-md">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  aria-expanded={showAdvanced}
                  className="w-full flex items-center gap-2 p-3 text-left touch-manipulation"
                >
                  <SlidersHorizontal className="w-5 h-5 shrink-0" />
                  <span className="flex-1">
                    <span className="block font-black text-slate-800">
                      {isAyat
                        ? "Pilihan bacaan"
                        : settings.mode === "4letter"
                          ? "Pilih kumpulan perkataan"
                          : "Pilih huruf sendiri"}
                    </span>
                    <span className="block text-xs text-slate-500">{advancedSummary}</span>
                  </span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                </button>

                {showAdvanced && (
                  <div className="border-t-4 border-slate-800 p-3 space-y-4">
                    {isAyat ? (
                      <>
                        <Toggle
                          checked={settings.useChildName}
                          onChange={(useChildName) => update({ useChildName })}
                          label={`Guna nama "${currentProfile.name}"`}
                          hint={`Cth: ${currentProfile.name} makan roti.`}
                        />
                        <Toggle
                          checked={settings.pointMode}
                          onChange={(pointMode) => update({ pointMode })}
                          label="Mod Tunjuk"
                          hint="Satu perkataan bercahaya pada satu masa. Bagus untuk pembaca baru."
                        />
                      </>
                    ) : settings.mode === "4letter" ? (
                      <div className="space-y-2">
                        {wordGroups.map((g) => {
                          const active = settings.wordGroupIds.includes(g.id)
                          return (
                            <button
                              key={g.id}
                              type="button"
                              aria-pressed={active}
                              onClick={() => update({ wordGroupIds: toggleIn(settings.wordGroupIds, g.id) })}
                              className={`w-full flex items-center gap-3 p-2 rounded-md border-2 border-slate-800 text-left touch-manipulation ${
                                active ? "bg-emerald-200" : "bg-white text-slate-400"
                              }`}
                            >
                              <span
                                className={`w-6 h-6 shrink-0 border-2 border-slate-800 rounded flex items-center justify-center ${
                                  active ? "bg-emerald-400" : "bg-white"
                                }`}
                              >
                                {active && "✓"}
                              </span>
                              <span className="flex-1">
                                <span className="block font-black text-slate-800">{g.label}</span>
                                <span className="block text-xs text-slate-600">
                                  {g.description} · {g.words.length} perkataan
                                </span>
                              </span>
                            </button>
                          )
                        })}
                        <button
                          type="button"
                          onClick={() => update({ wordGroupIds: allWordGroupIds })}
                          className="text-xs font-black px-2 py-1 rounded border-2 border-slate-800 bg-white hover:bg-rose-50"
                        >
                          Pilih semua
                        </button>
                      </div>
                    ) : (
                      <>
                        <LetterPicker
                          title="Vokal"
                          letters={allVowels}
                          selected={settings.vowels}
                          onChange={(vowels) => update({ vowels })}
                          presets={[
                            { label: "Mudah (a, i, u)", letters: easyVowels },
                            { label: "Semua", letters: allVowels },
                          ]}
                        />
                        <LetterPicker
                          title="Konsonan (huruf pertama)"
                          letters={allConsonants}
                          selected={settings.consonants}
                          onChange={(consonants) => update({ consonants })}
                        />
                        {settings.mode === "3letter" && (
                          <LetterPicker
                            title="Huruf akhir"
                            letters={allThirdLetters}
                            selected={settings.thirdLetters}
                            onChange={(thirdLetters) => update({ thirdLetters })}
                          />
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>

          <div className="text-center">
            <p className="text-sm text-slate-600 mb-2">{isAyat ? "Contoh ayat:" : "Contoh kad:"}</p>
            <div className="flex justify-center gap-2 mb-4">
              {(isAyat ? [sentenceLevel.example] : getExamples(settings)).map((e, i) => (
                <span
                  key={i}
                  className="font-handwriting text-3xl text-slate-800 bg-white border-2 border-slate-800 rounded-md px-3 py-1"
                >
                  {e}
                </span>
              ))}
            </div>
            <Button
              onClick={() => startGame()}
              className={`w-full h-auto bg-emerald-300 text-slate-800 border-4 border-slate-800 hover:bg-emerald-400 active:bg-emerald-500 font-black text-2xl py-4 ${shadow} touch-manipulation select-none`}
            >
              <Play className="w-7 h-7 mr-2 fill-slate-800" /> Mula
            </Button>
          </div>
        </div>
      )}

      {/* Character Animation */}
      {character && (
        <div className="fixed inset-0 flex items-end justify-center z-50 pointer-events-none animate-slide-up-simple">
          <Image
            src={characterImages[character]}
            alt="Character Celebration"
            width={500}
            height={500}
            className="max-w-[90vw] max-h-[75vh] object-contain"
          />
        </div>
      )}

      {/* Sentence reading */}
      {screen === "play" && session?.mode === "ayat" && currentWord && !character && (
        <div className="text-center relative z-10">
          <div className="flex justify-between items-center text-lg font-black text-slate-800 mb-2">
            <span>
              Ayat {session.index + 1} / {session.words.length}
            </span>
            <span className="text-sm text-slate-600">Tahap {session.level}</span>
          </div>
          <div className="h-4 bg-white border-4 border-slate-800 rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-emerald-400 transition-all duration-300"
              style={{ width: `${(session.index / session.words.length) * 100}%` }}
            />
          </div>
          <SentenceCard key={session.index} sentence={currentWord} pointMode={settings.pointMode} onSubmit={handleSentence} />
        </div>
      )}

      {/* Flashcard */}
      {screen === "play" && session && session.mode !== "ayat" && currentWord && !character && (
        <div className="text-center relative z-10">
          <div className="flex justify-between items-center text-lg font-black text-slate-800 mb-2">
            <span>
              Kad {session.index + 1} / {session.words.length}
            </span>
            <span className="text-purple-700">⭐ {session.totalMarks}</span>
          </div>
          <div className="h-4 bg-white border-4 border-slate-800 rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-emerald-400 transition-all duration-300"
              style={{ width: `${(session.index / session.words.length) * 100}%` }}
            />
          </div>

          <Card className="bg-white border-8 border-slate-800 py-16 px-4 mb-3 shadow-[12px_12px_0px_0px_rgba(30,41,59,1)] relative">
            <div
              className={`absolute top-2 right-2 px-3 py-1 rounded-full font-black text-base ${
                elapsed < 5 ? "bg-emerald-200" : elapsed < 10 ? "bg-yellow-200" : "bg-rose-200"
              } text-slate-800 border-2 border-slate-800`}
            >
              ⏱️ {elapsed}s
            </div>
            <div
              className={`${currentWord.length > 5 ? "text-6xl" : "text-8xl"} font-black text-slate-800 font-handwriting break-words`}
            >
              {currentWord}
            </div>
          </Card>

          <p className="text-sm text-slate-600 mb-4 h-5">
            {session.streak >= 2
              ? `🔥 ${session.streak} betul berturut-turut!`
              : "Minta anak baca kad ini, kemudian tekan:"}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => handleAnswer(false)}
              className={`h-auto bg-rose-300 text-slate-800 border-4 border-slate-800 hover:bg-rose-400 active:bg-rose-500 font-black text-2xl py-6 ${shadow} touch-manipulation select-none`}
            >
              ❌ Salah
            </Button>
            <Button
              onClick={() => handleAnswer(true)}
              className={`h-auto bg-emerald-300 text-slate-800 border-4 border-slate-800 hover:bg-emerald-400 active:bg-emerald-500 font-black text-2xl py-6 ${shadow} touch-manipulation select-none`}
            >
              ✅ Betul
            </Button>
          </div>
          <p className="hidden md:block text-xs text-slate-500 mt-4">Papan kekunci: ← Salah · → Betul</p>
        </div>
      )}

      {/* Results */}
      {screen === "results" && lastResult && (
        <div className="space-y-5 relative z-10">
          {isAyatResult ? (
            <Card className={`bg-white border-4 border-slate-800 p-6 text-center ${shadow}`}>
              <div className="text-6xl mb-2">{accuracy >= 0.9 ? "🏆" : "💪"}</div>
              <h2 className="text-2xl font-black text-slate-800">
                {accuracy >= 0.9 ? `Syabas, ${currentProfile?.name}!` : "Bagus, teruskan berlatih!"}
              </h2>
              <div className="text-5xl font-black text-slate-800 mt-4">{Math.round(accuracy * 100)}%</div>
              <p className="text-slate-600 mb-3">
                {lastResult.correct} / {lastResult.totalWords} perkataan dibaca betul
              </p>
              <div className={`inline-block px-3 py-1 rounded-md border-2 border-slate-800 font-black ${lastReadingLevel.color}`}>
                Tahap {lastLevel}: {lastReadingLevel.label}
              </div>
              <p className="text-sm text-slate-600 mt-2">{lastReadingLevel.advice}</p>
              <div className="flex justify-center flex-wrap gap-x-5 gap-y-1 text-slate-700 mt-3 text-sm">
                <span>⭐ {lastResult.totalMarks}</span>
                <span>📖 ~{wordsPerMinute} perkataan/minit</span>
                {!!lastResult.helped && <span>🤝 {lastResult.helped} dibantu</span>}
              </div>
            </Card>
          ) : (
          <Card className={`bg-white border-4 border-slate-800 p-6 text-center ${shadow}`}>
            <div className="text-6xl mb-2">{lastResult.correct >= lastResult.totalWords * 0.8 ? "🏆" : "💪"}</div>
            <h2 className="text-2xl font-black text-slate-800">
              {lastResult.correct >= lastResult.totalWords * 0.8
                ? `Syabas, ${currentProfile?.name}!`
                : "Bagus, teruskan berlatih!"}
            </h2>
            <div className="text-5xl font-black text-slate-800 my-4">
              {lastResult.correct}
              <span className="text-2xl text-slate-500"> / {lastResult.totalWords} betul</span>
            </div>
            <div className="flex justify-center gap-6 text-slate-700">
              <span>⭐ {lastResult.totalMarks} bintang</span>
              <span>⏱️ {lastResult.duration} saat</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">{modeLabels[lastResult.mode]}</p>
          </Card>
          )}

          <div className="space-y-3">
            {isAyatResult && accuracy >= 0.95 && lastLevel < 4 && (
              <Button
                onClick={() => startAtLevel((lastLevel + 1) as SentenceLevel)}
                className={`w-full h-auto bg-emerald-300 text-slate-800 border-4 border-slate-800 hover:bg-emerald-400 font-black text-xl py-4 ${shadow} touch-manipulation select-none`}
              >
                ⬆️ Naik ke Tahap {lastLevel + 1}
              </Button>
            )}
            {isAyatResult && accuracy < 0.9 && lastLevel > 1 && (
              <Button
                onClick={() => startAtLevel((lastLevel - 1) as SentenceLevel)}
                className={`w-full h-auto bg-white text-slate-800 border-4 border-slate-800 hover:bg-rose-50 font-black text-xl py-4 ${shadow} touch-manipulation select-none`}
              >
                ⬇️ Cuba Tahap {lastLevel - 1}
              </Button>
            )}
            {wrongWords.length > 0 && (
              <Button
                onClick={() => startGame(wrongWords, isAyatResult ? "kata" : (lastResult.mode as SessionMode))}
                className={`w-full h-auto bg-yellow-300 text-slate-800 border-4 border-slate-800 hover:bg-yellow-400 active:bg-yellow-500 font-black text-xl py-4 ${shadow} touch-manipulation select-none`}
              >
                <RotateCcw className="w-6 h-6 mr-2" />
                {isAyatResult ? `Latih ${wrongWords.length} perkataan yang salah` : `Ulang ${wrongWords.length} kad yang salah`}
              </Button>
            )}
            <Button
              onClick={() => startGame()}
              className={`w-full h-auto bg-emerald-300 text-slate-800 border-4 border-slate-800 hover:bg-emerald-400 active:bg-emerald-500 font-black text-xl py-4 ${shadow} touch-manipulation select-none`}
            >
              <Play className="w-6 h-6 mr-2 fill-slate-800" /> Main Lagi
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setScreen("home")}
                className="h-auto bg-white text-slate-800 border-4 border-slate-800 hover:bg-rose-50 font-black text-base py-3 touch-manipulation select-none"
              >
                <SlidersHorizontal className="w-5 h-5 mr-2" /> Tukar Tetapan
              </Button>
              <Link
                href="/statistics"
                className="inline-flex items-center justify-center rounded-md bg-white text-slate-800 border-4 border-slate-800 hover:bg-rose-50 font-black text-base py-3 touch-manipulation select-none"
              >
                <BarChart3 className="w-5 h-5 mr-2" /> Statistik
              </Link>
            </div>
          </div>

          {isAyatResult ? (
            <Card className={`bg-blue-100 border-4 border-slate-800 p-4 ${shadow}`}>
              <h3 className="text-lg font-black mb-3 text-slate-800">Butiran Ayat</h3>
              <div className="space-y-2">
                {lastResult.cardResults.map((card, index) => (
                  <div key={index} className="bg-white p-2 border-2 border-slate-800 rounded">
                    <div className="flex flex-wrap gap-1 text-lg">
                      {(card.words ?? sentenceWords(card.syllable).map((word) => ({ word, mark: "betul" as const }))).map(
                        (w, i) => (
                          <span
                            key={i}
                            className={`px-1.5 rounded ${
                              w.mark === "salah"
                                ? "bg-rose-300 line-through decoration-rose-700"
                                : w.mark === "bantu"
                                  ? "bg-yellow-200"
                                  : ""
                            }`}
                          >
                            {w.word}
                          </span>
                        ),
                      )}
                    </div>
                    <div className="flex justify-between text-xs text-slate-600 mt-1">
                      <span>{(card.timeSpent / 1000).toFixed(1)}s</span>
                      <span>{"⭐".repeat(card.marks)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-600 mt-3">
                <span className="bg-rose-300 px-1 rounded">salah</span> ·{" "}
                <span className="bg-yellow-200 px-1 rounded">dibantu</span>
              </p>
            </Card>
          ) : (
          <Card className={`bg-blue-100 border-4 border-slate-800 p-4 ${shadow}`}>
            <h3 className="text-lg font-black mb-3 text-slate-800">Butiran Kad</h3>
            <div className="grid grid-cols-2 gap-2">
              {lastResult.cardResults.map((card, index) => (
                <div
                  key={index}
                  className={`p-2 border-2 border-slate-800 rounded text-sm ${card.correct ? "bg-emerald-200" : "bg-rose-200"}`}
                >
                  <div className="font-black text-xl text-slate-800 font-handwriting">{card.syllable}</div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700">{(card.timeSpent / 1000).toFixed(1)}s</span>
                    <span>{card.correct ? "⭐".repeat(card.marks) : "Perlu ulang"}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          )}
        </div>
      )}

      <FirstTimeModal isOpen={showIntro} onClose={handleIntroComplete} onComplete={handleIntroComplete} />
    </div>
  )
}
