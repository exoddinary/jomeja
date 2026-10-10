"use client"

import { useEffect, useState, type ReactNode } from "react"
import { Eye, Lightbulb, Volume2 } from "lucide-react"
import { playClip } from "@/lib/english/audio"
import { segment, sounds, type Sound, type TrickyWord, type Word } from "@/lib/english/phonics"

// Shared look for the English section: dark "mission" UI with a white, high-contrast reading surface.
export const en = {
  page: "min-h-screen bg-slate-950 text-slate-100 p-4 max-w-md mx-auto font-semibold",
  panel: "bg-slate-900 border border-slate-700 rounded-2xl",
  surface: "bg-white text-slate-900 rounded-2xl shadow-[0_0_0_4px_rgba(45,212,191,0.35)]",
  ghost: "inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold px-4 py-3 touch-manipulation select-none",
  primary: "inline-flex items-center justify-center gap-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-900 font-black px-4 py-3 touch-manipulation select-none",
  accent: "inline-flex items-center justify-center gap-2 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-900 font-black px-4 py-3 touch-manipulation select-none",
}

const soundById = new Map(sounds.map((s) => [s.id, s]))
const playSound = (id: string) => {
  const s = soundById.get(id)
  playClip("sound", id, s ? `${id}, as in ${s.example}` : id)
}
export const playWord = (word: string) => playClip("word", word)

// Word with tappable sound buttons: a dot under one-letter sounds, a bar under two-letter sounds (d·u·ck)
export function SoundButtons({ word, size = "text-7xl", hidden = false }: { word: string; size?: string; hidden?: boolean }) {
  return (
    <div className={`flex justify-center items-end gap-1 ${size} font-black tracking-wide`}>
      {segment(word).map((g, i) => (
        <button
          key={i}
          type="button"
          onClick={() => !hidden && playSound(g)}
          className="flex flex-col items-center px-1 rounded-lg hover:bg-teal-50 touch-manipulation"
          aria-label={`Sound ${g}`}
        >
          <span className={hidden ? "invisible" : ""}>{g}</span>
          <span className={`mt-1 bg-teal-500 rounded-full ${g.length > 1 ? "h-2.5 w-full" : "h-3 w-3"}`} />
        </button>
      ))}
    </div>
  )
}

export function MarkButtons({ onMark, disabled }: { onMark: (correct: boolean) => void; disabled?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button type="button" disabled={disabled} onClick={() => onMark(false)} className={`${en.ghost} text-xl py-5 disabled:opacity-50`}>
        ✗ Not yet
      </button>
      <button type="button" disabled={disabled} onClick={() => onMark(true)} className={`${en.primary} text-xl py-5 disabled:opacity-50`}>
        ✓ Got it
      </button>
    </div>
  )
}

function Hint({ children }: { children: ReactNode }) {
  return <p className="text-sm text-slate-400 mb-4 min-h-5">{children}</p>
}

export function SoundCard({ sound, onMark, disabled }: { sound: Sound; onMark: (c: boolean) => void; disabled?: boolean }) {
  const [hint, setHint] = useState(false)
  return (
    <>
      <div className={`${en.surface} py-12 mb-4 text-center`}>
        <div className="text-[9rem] leading-none font-black">{sound.id}</div>
        <div className="h-10 mt-2 text-2xl">{hint && `${sound.emoji} ${sound.example}`}</div>
      </div>
      <Hint>Child says the sound (not the letter name). Then mark it.</Hint>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <button type="button" onClick={() => playSound(sound.id)} className={en.ghost}>
          <Volume2 className="w-5 h-5" /> Hear it
        </button>
        <button type="button" onClick={() => setHint(true)} disabled={hint} className={`${en.ghost} disabled:opacity-50`}>
          <Lightbulb className="w-5 h-5" /> Picture hint
        </button>
      </div>
      <MarkButtons onMark={onMark} disabled={disabled} />
    </>
  )
}

export function BlendCard({ word, onMark, disabled }: { word: Word; onMark: (c: boolean) => void; disabled?: boolean }) {
  return (
    <>
      <div className={`${en.surface} py-14 mb-4`}>
        <SoundButtons word={word.text} />
      </div>
      <Hint>Child touches each dot and says the sound, then blends them into the word.</Hint>
      <button type="button" onClick={() => playWord(word.text)} className={`${en.ghost} w-full mb-3`}>
        <Volume2 className="w-5 h-5" /> Hear the word (after trying)
      </button>
      <MarkButtons onMark={onMark} disabled={disabled} />
    </>
  )
}

// Hear a word, find it among 3 written choices that differ by one sound
export function ChooseCard({
  word,
  options,
  onMark,
  disabled,
}: {
  word: Word
  options: string[]
  onMark: (c: boolean) => void
  disabled?: boolean
}) {
  const [revealed, setRevealed] = useState(false)
  useEffect(() => playWord(word.text), [word.text])
  return (
    <>
      <button type="button" onClick={() => playWord(word.text)} className={`${en.accent} w-full text-xl py-5 mb-4`}>
        <Volume2 className="w-6 h-6" /> Play the word
      </button>
      <div className="grid gap-3 mb-4">
        {options.map((o) => (
          <div
            key={o}
            className={`${en.surface} py-5 text-center text-5xl font-black transition-opacity ${
              revealed && o !== word.text ? "opacity-30" : ""
            } ${revealed && o === word.text ? "ring-4 ring-lime-400" : ""}`}
          >
            {o}
          </div>
        ))}
      </div>
      <Hint>Child points to the word they heard.</Hint>
      {revealed ? (
        <MarkButtons onMark={onMark} disabled={disabled} />
      ) : (
        <button type="button" onClick={() => setRevealed(true)} className={`${en.ghost} w-full text-xl py-5`}>
          <Eye className="w-6 h-6" /> Show answer
        </button>
      )}
    </>
  )
}

// Hear a word, say its sounds and write it; boxes show how many sounds it has
export function SpellCard({ word, onMark, disabled }: { word: Word; onMark: (c: boolean) => void; disabled?: boolean }) {
  const [revealed, setRevealed] = useState(false)
  useEffect(() => playWord(word.text), [word.text])
  return (
    <>
      <div className={`${en.surface} py-8 mb-4 text-center`}>
        <div className="text-6xl h-20">{word.emoji}</div>
        <div className="flex justify-center gap-2 mt-2">
          {segment(word.text).map((g, i) => (
            <div key={i} className="w-16 h-20 border-4 border-slate-300 rounded-xl flex items-center justify-center text-5xl font-black">
              {revealed ? g : ""}
            </div>
          ))}
        </div>
      </div>
      <button type="button" onClick={() => playWord(word.text)} className={`${en.ghost} w-full mb-3`}>
        <Volume2 className="w-5 h-5" /> Play the word
      </button>
      <Hint>Child says each sound while tapping a box, then writes the word on paper.</Hint>
      {revealed ? (
        <MarkButtons onMark={onMark} disabled={disabled} />
      ) : (
        <button type="button" onClick={() => setRevealed(true)} className={`${en.ghost} w-full text-xl py-5`}>
          <Eye className="w-6 h-6" /> Show answer
        </button>
      )}
    </>
  )
}

export function TrickyCard({ tricky, onMark, disabled }: { tricky: TrickyWord; onMark: (c: boolean) => void; disabled?: boolean }) {
  return (
    <>
      <div className={`${en.surface} py-14 mb-4 text-center text-8xl font-black`}>
        {[...tricky.text].map((ch, i) => (
          <span key={i} className={tricky.tricky.includes(i) ? "text-rose-500 underline decoration-4 underline-offset-8" : ""}>
            {ch}
          </span>
        ))}
      </div>
      <Hint>Tricky word: the red part doesn&apos;t follow the rules. Child reads it on sight.</Hint>
      <button type="button" onClick={() => playWord(tricky.text)} className={`${en.ghost} w-full mb-3`}>
        <Volume2 className="w-5 h-5" /> Hear it
      </button>
      <MarkButtons onMark={onMark} disabled={disabled} />
    </>
  )
}
