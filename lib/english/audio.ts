import { audioPath } from "./phonics"

// Plays pre-generated clips from /public/audio/en. Until the clips exist (or if one is missing),
// falls back to the browser's built-in voice so the app is still usable.
let current: HTMLAudioElement | null = null
const missing = new Set<string>()

const speak = (text: string) => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = "en-GB"
  utterance.rate = 0.8
  window.speechSynthesis.speak(utterance)
}

export const playClip = (kind: "sound" | "word", id: string, fallbackText = id) => {
  current?.pause()
  const path = audioPath(kind, id)
  if (missing.has(path)) return speak(fallbackText)
  const audio = new Audio(path)
  current = audio
  audio.play().catch(() => {
    missing.add(path)
    speak(fallbackText)
  })
}
