import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Jom Read - English phonics for Malaysian kids",
  description: "Learn to read English with synthetic phonics: sounds, blending, tricky words and decodable sentences.",
}

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return (
    <div lang="en" className="min-h-screen bg-slate-950">
      {children}
    </div>
  )
}
