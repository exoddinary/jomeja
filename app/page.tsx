"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const LANGUAGE_KEY = "jom-eja-language"
const routes = { bm: "/bm", en: "/en" } as const

// Landing page: choose a language once, then go straight to the last-used one.
// The logo in each section links to /?choose=1 to come back here.
export default function LandingPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(LANGUAGE_KEY) as keyof typeof routes | null
    const choosing = new URLSearchParams(window.location.search).has("choose")
    if (saved && routes[saved] && !choosing) router.replace(routes[saved])
    else setReady(true)
  }, [router])

  if (!ready) return <div className="min-h-screen bg-rose-100" />

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-100 to-sky-100 p-4 max-w-md mx-auto flex flex-col justify-center gap-5 font-bold">
      <div className="text-center mb-2">
        <h1 className="text-4xl font-black text-slate-800">Jom Baca</h1>
        <p className="text-slate-600 mt-1">Pilih bahasa · Choose a language</p>
      </div>

      <Link
        href="/bm"
        className="block bg-rose-200 border-4 border-slate-800 rounded-xl p-6 shadow-[8px_8px_0px_0px_rgba(30,41,59,1)] hover:-translate-y-0.5 transition-transform"
      >
        <div className="text-sm text-slate-600">🇲🇾 Jom Eja</div>
        <div className="text-3xl font-black text-slate-800">Bahasa Melayu</div>
        <div className="text-slate-700 mt-1">Suku kata, perkataan dan ayat</div>
      </Link>

      <Link
        href="/en"
        className="block bg-slate-900 border-4 border-slate-900 rounded-xl p-6 shadow-[8px_8px_0px_0px_rgba(20,184,166,1)] hover:-translate-y-0.5 transition-transform"
      >
        <div className="text-sm text-teal-300">🇬🇧 Jom Read</div>
        <div className="text-3xl font-black text-white">English</div>
        <div className="text-slate-300 mt-1">Phonics: sounds, blending, tricky words and sentences</div>
      </Link>
    </div>
  )
}
