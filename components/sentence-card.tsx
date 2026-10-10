"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { sentenceWords, syllabify, type WordMark, type WordMarkType } from "@/lib/sentences"

const shadow = "shadow-[6px_6px_0px_0px_rgba(30,41,59,1)]"
const LONG_PRESS_MS = 450

// Tap cycles betul -> salah -> dibantu -> betul
const nextMark: Record<WordMarkType, WordMarkType> = { betul: "salah", salah: "bantu", bantu: "betul" }
const markStyle: Record<WordMarkType, string> = {
  betul: "bg-white border-dashed border-slate-400",
  salah: "bg-rose-300 border-slate-800 line-through decoration-4 decoration-rose-700",
  bantu: "bg-yellow-200 border-slate-800",
}
const markBadge: Record<WordMarkType, string | null> = { betul: null, salah: "❌", bantu: "🤝" }

interface SentenceCardProps {
  sentence: string
  pointMode: boolean
  onSubmit: (marks: WordMark[]) => void
}

// Parent marks a read-aloud sentence. Default mode: every word starts correct, tap only mistakes.
// Tunjuk mode: one word is highlighted at a time and the parent marks it to move on.
export default function SentenceCard({ sentence, pointMode, onSubmit }: SentenceCardProps) {
  const words = sentenceWords(sentence)
  const [marks, setMarks] = useState<WordMarkType[]>(() => words.map(() => "betul"))
  const [split, setSplit] = useState<boolean[]>(() => words.map(() => false))
  const [pointer, setPointer] = useState(0)
  const pressTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const longPressed = useRef(false)

  const setMark = (i: number, mark: WordMarkType) => setMarks((prev) => prev.map((m, j) => (j === i ? mark : m)))
  const showSyllables = (i: number) => setSplit((prev) => prev.map((s, j) => j === i || s))
  const submit = (finalMarks: WordMarkType[]) => onSubmit(words.map((word, i) => ({ word, mark: finalMarks[i] })))

  // Long-press splits the word into syllables as a hint and marks it as "dibantu"
  const startPress = (i: number) => {
    longPressed.current = false
    clearTimeout(pressTimer.current)
    pressTimer.current = setTimeout(() => {
      longPressed.current = true
      showSyllables(i)
      setMark(i, "bantu")
    }, LONG_PRESS_MS)
  }
  const cancelPress = () => clearTimeout(pressTimer.current)
  const tapWord = (i: number) => {
    if (longPressed.current) {
      longPressed.current = false
      return
    }
    setMark(i, nextMark[marks[i]])
  }

  const markCurrent = (mark: "betul" | "salah") => {
    const finalMarks = marks.map((m, j) => (j === pointer ? (mark === "betul" && split[pointer] ? "bantu" : mark) : m))
    setMarks(finalMarks)
    if (pointer + 1 >= words.length) submit(finalMarks)
    else setPointer(pointer + 1)
  }

  const wrong = marks.filter((m) => m === "salah").length
  const helped = marks.filter((m) => m === "bantu").length

  return (
    <div>
      <Card className="bg-white border-8 border-slate-800 px-4 py-10 mb-3 shadow-[12px_12px_0px_0px_rgba(30,41,59,1)]">
        <div className="flex flex-wrap justify-center gap-x-2 gap-y-5 text-4xl font-black text-slate-800 leading-tight">
          {words.map((word, i) => {
            const isCurrent = pointMode && i === pointer
            const showMark = !pointMode || i < pointer
            const badge = showMark ? markBadge[marks[i]] : null
            return (
              <button
                key={i}
                type="button"
                disabled={pointMode}
                onPointerDown={() => !pointMode && startPress(i)}
                onPointerUp={cancelPress}
                onPointerLeave={cancelPress}
                onPointerCancel={cancelPress}
                onClick={() => tapWord(i)}
                onContextMenu={(e) => e.preventDefault()}
                aria-label={`${word}: ${marks[i]}`}
                style={{ WebkitTouchCallout: "none" }}
                className={`relative px-2 py-1 rounded-md border-2 select-none touch-manipulation disabled:cursor-default ${
                  isCurrent
                    ? "bg-yellow-200 border-slate-800 ring-4 ring-yellow-400 scale-110"
                    : showMark
                      ? markStyle[marks[i]]
                      : "bg-white border-transparent"
                } ${pointMode && !showMark && !isCurrent ? "text-slate-400" : ""}`}
              >
                {split[i] ? syllabify(word).join("·") : word}
                {i === words.length - 1 && "."}
                {badge && <span className="absolute -top-4 -right-2 text-lg no-underline">{badge}</span>}
              </button>
            )
          })}
        </div>
      </Card>

      {pointMode ? (
        <>
          <p className="text-sm text-slate-600 mb-4 h-5">Anak baca perkataan yang bercahaya, kemudian tekan:</p>
          <div className="grid grid-cols-3 gap-3">
            <Button
              onClick={() => showSyllables(pointer)}
              disabled={split[pointer]}
              className={`h-auto bg-yellow-200 text-slate-800 border-4 border-slate-800 hover:bg-yellow-300 font-black text-lg py-5 ${shadow} touch-manipulation select-none`}
            >
              🤝 Pecah
            </Button>
            <Button
              onClick={() => markCurrent("salah")}
              className={`h-auto bg-rose-300 text-slate-800 border-4 border-slate-800 hover:bg-rose-400 font-black text-lg py-5 ${shadow} touch-manipulation select-none`}
            >
              ❌ Salah
            </Button>
            <Button
              onClick={() => markCurrent("betul")}
              className={`h-auto bg-emerald-300 text-slate-800 border-4 border-slate-800 hover:bg-emerald-400 font-black text-lg py-5 ${shadow} touch-manipulation select-none`}
            >
              ✅ Betul
            </Button>
          </div>
          {pointer > 0 && (
            <button
              type="button"
              onClick={() => setPointer(pointer - 1)}
              className="mt-4 text-sm font-black text-slate-600 underline underline-offset-4"
            >
              ← Undur satu perkataan
            </button>
          )}
        </>
      ) : (
        <>
          <p className="text-sm text-slate-600 mb-4">
            {wrong + helped > 0
              ? `${wrong} salah · ${helped} dibantu · ketik lagi untuk tukar`
              : "Ketik perkataan yang salah. Tekan lama untuk pecah suku kata."}
          </p>
          <Button
            onClick={() => submit(marks)}
            className={`w-full h-auto ${
              wrong + helped === 0 ? "bg-emerald-300 hover:bg-emerald-400" : "bg-blue-300 hover:bg-blue-400"
            } text-slate-800 border-4 border-slate-800 font-black text-xl py-5 ${shadow} touch-manipulation select-none`}
          >
            {wrong + helped === 0 ? "✅ Semua betul · Seterusnya" : "Seterusnya →"}
          </Button>
        </>
      )}
    </div>
  )
}
