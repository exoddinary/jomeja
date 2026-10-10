"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Trash2 } from "lucide-react"
import { en } from "@/components/english/cards"
import { useProfile } from "@/context/profile-context"
import { sounds, trickyWords } from "@/lib/english/phonics"
import { MASTERY_THRESHOLD, groupMastery, itemKey, newProgress, type ItemStat } from "@/lib/english/progress"

const tileColor = (stat: ItemStat | undefined, locked: boolean) => {
  if (locked) return "bg-slate-800/40 text-slate-600"
  if (!stat) return "bg-slate-800 text-slate-300"
  const accuracy = 1 - stat.wrong / stat.count
  if (accuracy >= MASTERY_THRESHOLD && stat.count >= 3) return "bg-lime-400 text-slate-900"
  if (accuracy >= 0.7) return "bg-amber-300 text-slate-900"
  return "bg-rose-400 text-slate-900"
}

const activityNames: Record<string, string> = {
  sounds: "Sounds",
  blend: "Blend",
  choose: "Listen & Choose",
  spell: "Spell",
  tricky: "Tricky Words",
  sentences: "Sentences",
  placement: "Placement",
}

export default function EnglishStats() {
  const router = useRouter()
  const { loaded, currentProfile, updateCurrentProfileEnglish } = useProfile()
  useEffect(() => {
    if (loaded && !currentProfile) router.push("/profile")
  }, [loaded, currentProfile, router])
  if (!loaded || !currentProfile) return <div className={en.page} />

  const progress = currentProfile.english ?? newProgress()
  const hardestWords = Object.entries(progress.items)
    .filter(([key, s]) => key.startsWith("word:") && s.wrong > 0)
    .sort(([, a], [, b]) => b.wrong / b.count - a.wrong / a.count || b.wrong - a.wrong)
    .slice(0, 9)
  const recent = [...progress.sessions].reverse().slice(0, 10)
  const mastery = groupMastery(progress, progress.unlockedGroup)

  const reset = () => {
    if (window.confirm(`Reset all English progress for ${currentProfile.name}? This can't be undone.`)) {
      updateCurrentProfileEnglish(undefined)
    }
  }

  const Tile = ({ id, stat, locked }: { id: string; stat?: ItemStat; locked: boolean }) => (
    <div className={`rounded-xl p-2 text-center ${tileColor(stat, locked)}`}>
      <div className="text-2xl font-black">{id}</div>
      <div className="text-[11px]">{locked ? "locked" : stat ? `${stat.count - stat.wrong}/${stat.count}` : "new"}</div>
    </div>
  )

  return (
    <div className={en.page}>
      <header className="flex justify-between items-center mb-5">
        <h1 className="text-2xl font-black">Progress</h1>
        <Link href="/en" className={en.ghost} aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </header>

      <div className="space-y-5 pb-8">
        <section className={`${en.panel} p-4`}>
          <div className="text-xs uppercase tracking-widest text-slate-400">{currentProfile.name}</div>
          <div className="text-2xl font-black">Level {progress.unlockedGroup}</div>
          <div className="text-sm text-slate-400">
            {Math.round(mastery.accuracy * 100)}% over the last {mastery.attempts} attempts · {progress.sessions.length} rounds played
          </div>
        </section>

        <section className={`${en.panel} p-4`}>
          <h2 className="font-black mb-1">Sounds</h2>
          <p className="text-xs text-slate-400 mb-3">Green = secure (90%+), amber = nearly, red = needs practice</p>
          <div className="grid grid-cols-5 gap-2">
            {sounds.map((s) => (
              <Tile key={s.id} id={s.id} stat={progress.items[itemKey("sound", s.id)]} locked={s.group > progress.unlockedGroup} />
            ))}
          </div>
        </section>

        <section className={`${en.panel} p-4`}>
          <h2 className="font-black mb-3">Tricky words</h2>
          <div className="grid grid-cols-5 gap-2">
            {trickyWords.map((t) => (
              <Tile key={t.text} id={t.text} stat={progress.items[itemKey("tricky", t.text)]} locked={t.group > progress.unlockedGroup} />
            ))}
          </div>
        </section>

        <section className={`${en.panel} p-4`}>
          <h2 className="font-black mb-3">Words to practise</h2>
          {hardestWords.length ? (
            <div className="grid grid-cols-3 gap-2">
              {hardestWords.map(([key, s]) => (
                <div key={key} className="bg-slate-800 rounded-xl p-2 text-center">
                  <div className="text-xl font-black">{key.slice(5)}</div>
                  <div className="text-[11px] text-rose-300">
                    {s.wrong}/{s.count} not yet
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No missed words yet.</p>
          )}
        </section>

        <section className={`${en.panel} p-4`}>
          <h2 className="font-black mb-3">Recent rounds</h2>
          {recent.length ? (
            <div className="space-y-2">
              {recent.map((s, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="w-20 text-slate-400">{s.date}</span>
                  <span className="flex-1">{activityNames[s.activity]}</span>
                  <span className="font-black">
                    {s.correct}/{s.total}
                  </span>
                  {s.unlocked && <span className="text-lime-400">🔓</span>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No rounds yet.</p>
          )}
        </section>

        <button type="button" onClick={reset} className="mx-auto flex items-center gap-2 text-sm text-rose-300 underline underline-offset-4">
          <Trash2 className="w-4 h-4" /> Reset English progress for {currentProfile.name}
        </button>
      </div>
    </div>
  )
}
