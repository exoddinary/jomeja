"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation" // Import useRouter
import { useProfile } from "@/context/profile-context" // Import useProfile hook
import { allConsonants, allVowels, toStatsMode, type StatsMode } from "@/lib/words"
import { readingLevel } from "@/lib/sentences"

const tabs: { value: StatsMode; label: string }[] = [
  { value: "2letter", label: "2 Huruf" },
  { value: "3letter", label: "3 Huruf" },
  { value: "4letter", label: "4 Huruf" },
  { value: "ayat", label: "Ayat" },
]

export default function StatisticsPage() {
  const router = useRouter()
  const { loaded, currentProfile, clearCurrentProfileRecords } = useProfile() // Get currentProfile from context
  const [currentStatsTab, setCurrentStatsTab] = useState<StatsMode>("2letter")

  // Redirect if no profile is selected
  useEffect(() => {
    if (loaded && !currentProfile) router.push("/profile")
  }, [loaded, currentProfile, router])

  // If no current profile, display a message or redirect
  if (!loaded) return <div className="min-h-screen bg-rose-100" />

  if (!currentProfile) {
    return (
      <div className="min-h-screen bg-rose-100 p-4 max-w-md mx-auto font-bold relative flex flex-col items-center justify-center text-center">
        <div className="fixed inset-0 opacity-10 pointer-events-none">
          <div className="w-full h-full bg-grid-pattern"></div>
        </div>
        <Card className="bg-white border-4 border-slate-800 p-6 shadow-[8px_8px_0px_0px_rgba(30,41,59,1)] relative z-10">
          <h2 className="text-2xl font-black mb-4 text-slate-800">Tiada Profil Dipilih</h2>
          <p className="text-lg font-bold mb-6 text-slate-700">Sila pilih atau cipta profil untuk melihat statistik.</p>
          <Link href="/profile">
            <Button className="bg-slate-800 text-rose-100 border-4 border-slate-800 hover:bg-slate-700 active:bg-slate-900 font-black text-lg px-4 py-2 touch-manipulation select-none">
              Pilih Profil
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  const currentModeStats = currentProfile.letterStats[currentStatsTab] ?? {}

  // Word-level difficulty for this tab, aggregated from every recorded session
  const wordStats = new Map<string, { word: string; count: number; wrong: number; totalTime: number }>()
  currentProfile.results
    .filter((r) => toStatsMode(r.mode) === currentStatsTab)
    .flatMap((r) => r.cardResults)
    // Sentence cards are split into their individual word marks
    .flatMap((c) =>
      c.words
        ? c.words.map((w) => ({ word: w.word, correct: w.mark === "betul", timeSpent: c.timeSpent / c.words!.length }))
        : [{ word: c.syllable, correct: c.correct, timeSpent: c.timeSpent }],
    )
    .forEach((c) => {
      const word = c.word.toLowerCase()
      const prev = wordStats.get(word) ?? { word, count: 0, wrong: 0, totalTime: 0 }
      wordStats.set(word, {
        word,
        count: prev.count + 1,
        wrong: prev.wrong + (c.correct ? 0 : 1),
        totalTime: prev.totalTime + c.timeSpent,
      })
    })
  const hardestWords = [...wordStats.values()]
    .filter((w) => w.wrong > 0)
    .sort((a, b) => b.wrong / b.count - a.wrong / a.count || b.totalTime / b.count - a.totalTime / a.count)
    .slice(0, 6)
  const sessionCount = currentProfile.results.filter((r) => toStatsMode(r.mode) === currentStatsTab).length

  // Sentence reading history (newest first)
  const readingSessions = currentProfile.results
    .filter((r) => r.mode === "ayat" && r.totalWords > 0)
    .map((r) => {
      const minutes = r.cardResults.reduce((sum, c) => sum + c.timeSpent, 0) / 60000
      return {
        ...r,
        accuracy: r.correct / r.totalWords,
        wordsPerMinute: minutes > 0 ? Math.round(r.totalWords / minutes) : 0,
      }
    })
    .reverse()
  const recentSessions = readingSessions.slice(0, 8)
  const averageAccuracy = recentSessions.length
    ? recentSessions.reduce((sum, r) => sum + r.accuracy, 0) / recentSessions.length
    : 0
  const averageWpm = recentSessions.length
    ? Math.round(recentSessions.reduce((sum, r) => sum + r.wordsPerMinute, 0) / recentSessions.length)
    : 0

  const clearAllRecords = () => {
    if (window.confirm(`Padam semua rekod untuk ${currentProfile.name}? Tindakan ini tidak boleh dibatalkan.`)) {
      clearCurrentProfileRecords()
    }
  }

  // Calculate average times for consonants
  const consonantAverages = allConsonants.map((consonant) => {
    const stats = currentModeStats[consonant]
    const average = stats ? stats.totalTime / stats.count / 1000 : 0 // Convert to seconds
    const count = stats ? stats.count : 0
    const incorrect = stats?.incorrect || 0
    return { letter: consonant, average, count, incorrect }
  })

  // Calculate average times for vowels
  const vowelAverages = allVowels.map((vowel) => {
    const stats = currentModeStats[vowel]
    const average = stats ? stats.totalTime / stats.count / 1000 : 0 // Convert to seconds
    const count = stats ? stats.count : 0
    const incorrect = stats?.incorrect || 0
    return { letter: vowel, average, count, incorrect }
  })

  // Find max average for scaling
  const maxConsonantAverage = Math.max(...consonantAverages.map((c) => c.average), 1)
  const maxVowelAverage = Math.max(...vowelAverages.map((v) => v.average), 1)

  // Get color based on performance (faster = better = green)
  const getBarColor = (average: number, maxAverage: number) => {
    if (average === 0) return "bg-gray-300"
    if (average <= 1.5) return "bg-emerald-400" // Fast (≤1.5s)
    if (average <= 3.5) return "bg-yellow-400" // Medium (1.5-3.5s)
    return "bg-rose-400" // Slow (>3.5s)
  }

  return (
    <div className="min-h-screen bg-rose-100 p-4 max-w-md mx-auto font-bold relative">
      {/* Grid Background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="w-full h-full bg-grid-pattern"></div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h1 className="text-2xl font-black text-slate-800">📊 Statistik Jom Eja</h1>
        <Link href="/bm">
          <Button className="bg-slate-800 text-rose-100 border-4 border-slate-800 hover:bg-slate-700 active:bg-slate-900 font-black text-lg px-4 py-2 touch-manipulation select-none">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-4 border-slate-800 rounded-md overflow-hidden mb-2 relative z-10">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setCurrentStatsTab(t.value)}
            aria-pressed={currentStatsTab === t.value}
            className={`flex-1 py-2 font-black text-base border-r-4 last:border-r-0 border-slate-800 touch-manipulation select-none ${
              currentStatsTab === t.value ? "bg-slate-800 text-white" : "bg-white text-slate-800 hover:bg-rose-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="text-sm text-slate-600 text-center mb-6 relative z-10">
        {currentProfile.name} · {sessionCount} sesi direkodkan
      </p>

      {/* Sentence reading progress */}
      {currentStatsTab === "ayat" && (
        <Card className="bg-green-200 border-4 border-slate-800 p-4 mb-6 shadow-[8px_8px_0px_0px_rgba(30,41,59,1)] relative z-10">
          <h2 className="text-xl font-black mb-3 text-slate-800">Kemajuan Membaca</h2>
          {recentSessions.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3 text-center mb-4">
                <div className="bg-white border-2 border-slate-800 rounded p-2">
                  <div className="text-3xl font-black text-slate-800">{Math.round(averageAccuracy * 100)}%</div>
                  <div className="text-xs text-slate-600">Purata ketepatan</div>
                  <div
                    className={`inline-block mt-1 px-2 rounded border border-slate-800 text-xs ${readingLevel(averageAccuracy).color}`}
                  >
                    {readingLevel(averageAccuracy).label}
                  </div>
                </div>
                <div className="bg-white border-2 border-slate-800 rounded p-2">
                  <div className="text-3xl font-black text-slate-800">~{averageWpm}</div>
                  <div className="text-xs text-slate-600">Perkataan seminit</div>
                </div>
              </div>
              <p className="text-xs text-slate-600 mb-2">Sesi terkini</p>
              <div className="space-y-1.5">
                {recentSessions.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-20 shrink-0 text-slate-600">{r.date}</span>
                    <span className="w-8 shrink-0 text-slate-800">T{r.level ?? 1}</span>
                    <div className="flex-1 bg-white border-2 border-slate-800 h-6 relative overflow-hidden rounded">
                      <div
                        className={`h-full ${readingLevel(r.accuracy).color}`}
                        style={{ width: `${Math.max(r.accuracy * 100, 4)}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center font-black text-slate-800">
                        {Math.round(r.accuracy * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-600 mt-3">
                <b>Panduan:</b> ≥95% mudah (naik tahap) · 90–94% sesuai · &lt;90% sukar (latih perkataan dahulu).
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-600">Belum ada sesi ayat. Pilih &quot;Ayat&quot; di halaman utama.</p>
          )}
        </Card>
      )}

      {/* Hardest Words */}
      <Card className="bg-white border-4 border-slate-800 p-4 mb-6 shadow-[8px_8px_0px_0px_rgba(30,41,59,1)] relative z-10">
        <h2 className="text-xl font-black mb-1 text-slate-800">Perlu Diulang</h2>
        <p className="text-xs text-slate-600 mb-3">
          {currentStatsTab === "ayat" ? "Perkataan yang paling kerap salah atau dibantu" : "Kad yang paling kerap salah"}
        </p>
        {hardestWords.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {hardestWords.map((w) => (
              <div key={w.word} className="bg-rose-100 border-2 border-slate-800 rounded p-2 text-center">
                <div className="text-2xl font-black text-slate-800 font-handwriting">{w.word}</div>
                <div className="text-xs text-slate-600">
                  {w.wrong}/{w.count} salah
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            {sessionCount > 0 ? "Tiada kad yang salah. Hebat! 🎉" : "Belum ada data. Mainkan satu sesi dahulu."}
          </p>
        )}
      </Card>

      {currentStatsTab !== "ayat" && (
        <>
      {/* Consonants Chart */}
      <Card className="bg-blue-200 border-4 border-slate-800 p-4 mb-6 shadow-[8px_8px_0px_0px_rgba(30,41,59,1)] relative z-10">
        <h2 className="text-xl font-black mb-4 text-slate-800">Konsonan (Purata Masa)</h2>
        <div className="space-y-2">
          {consonantAverages.map(({ letter, average, count, incorrect }) => (
            <div key={letter} className="flex items-center gap-2">
              <div className="w-8 text-center font-black text-slate-800">{letter}</div>
              <div className="flex-1 bg-white border-2 border-slate-800 h-8 relative overflow-hidden">
                <div
                  className={`h-full border-r-2 border-slate-800 flex items-center justify-end pr-1 transition-all duration-300 ${getBarColor(average, maxConsonantAverage)}`}
                  style={{
                    width: average > 0 ? `${Math.max((average / maxConsonantAverage) * 100, 5)}%` : "0%",
                  }}
                >
                  {average > 0 && <span className="text-xs font-black text-slate-800">{average.toFixed(1)}s</span>}
                </div>
              </div>
              <div className="w-16 text-xs text-slate-600 text-center">
                {count > 0 ? `${count}x` : "-"}
                {incorrect > 0 && <span className="text-rose-600 ml-1">({incorrect}❌)</span>}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-slate-600">
          <div className="flex gap-4 justify-center">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-emerald-400 border border-slate-800"></div>
              <span>Pantas (&lt;=1.5s)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-400 border border-slate-800"></div>
              <span>Sederhana (1.5-3.5s)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-rose-400 border border-slate-800"></div>
              <span>Perlahan (&gt;3.5s)</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Vowels Chart */}
      <Card className="bg-purple-200 border-4 border-slate-800 p-4 mb-6 shadow-[8px_8px_0px_0px_rgba(30,41,59,1)] relative z-10">
        <h2 className="text-xl font-black mb-4 text-slate-800">Vokal (Purata Masa)</h2>
        <div className="space-y-3">
          {vowelAverages.map(({ letter, average, count, incorrect }) => (
            <div key={letter} className="flex items-center gap-2">
              <div className="w-8 text-center font-black text-slate-800">{letter}</div>
              <div className="flex-1 bg-white border-2 border-slate-800 h-10 relative overflow-hidden">
                <div
                  className={`h-full border-r-2 border-slate-800 flex items-center justify-end pr-2 transition-all duration-300 ${getBarColor(average, maxVowelAverage)}`}
                  style={{
                    width: average > 0 ? `${Math.max((average / maxVowelAverage) * 100, 8)}%` : "0%",
                  }}
                >
                  {average > 0 && <span className="text-sm font-black text-slate-800">{average.toFixed(1)}s</span>}
                </div>
              </div>
              <div className="w-16 text-xs text-slate-600 text-center">
                {count > 0 ? `${count}x` : "-"}
                {incorrect > 0 && <span className="text-rose-600 ml-1">({incorrect}❌)</span>}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-slate-600">
          <div className="flex gap-4 justify-center">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-emerald-400 border border-slate-800"></div>
              <span>Pantas (&lt;=1.5s)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-400 border border-slate-800"></div>
              <span>Sederhana (1.5-3.5s)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-rose-400 border border-slate-800"></div>
              <span>Perlahan (&gt;3.5s)</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <Card className="bg-green-200 border-4 border-slate-800 p-4 mb-6 shadow-[8px_8px_0px_0px_rgba(30,41,59,1)] relative z-10">
        <h2 className="text-xl font-black mb-4 text-slate-800">Ringkasan</h2>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-white border-2 border-slate-800 p-3 rounded">
            <div className="text-2xl font-black text-slate-800">
              {consonantAverages.filter((c) => c.count > 0).length}
            </div>
            <div className="text-sm font-bold text-slate-600">Konsonan Dicuba</div>
          </div>
          <div className="bg-white border-2 border-slate-800 p-3 rounded">
            <div className="text-2xl font-black text-slate-800">{vowelAverages.filter((v) => v.count > 0).length}</div>
            <div className="text-sm font-bold text-slate-600">Vokal Dicuba</div>
          </div>
        </div>

        {/* Best and Worst Performance */}
        {consonantAverages.some((c) => c.count > 0) && (
          <div className="mt-4 space-y-2">
            <div className="bg-emerald-100 border-2 border-slate-800 p-2 rounded">
              <div className="text-sm font-black text-slate-800">🏆 Konsonan Terpantas:</div>
              <div className="text-lg font-black text-emerald-700">
                {consonantAverages.filter((c) => c.count > 0).sort((a, b) => a.average - b.average)[0]?.letter}(
                {consonantAverages
                  .filter((c) => c.count > 0)
                  .sort((a, b) => a.average - b.average)[0]
                  ?.average.toFixed(1)}
                s)
              </div>
            </div>

            {vowelAverages.some((v) => v.count > 0) && (
              <div className="bg-purple-100 border-2 border-slate-800 p-2 rounded">
                <div className="text-sm font-black text-slate-800">⭐ Vokal Terpantas:</div>
                <div className="text-lg font-black text-purple-700">
                  {vowelAverages.filter((v) => v.count > 0).sort((a, b) => a.average - b.average)[0]?.letter}(
                  {vowelAverages
                    .filter((v) => v.count > 0)
                    .sort((a, b) => a.average - b.average)[0]
                    ?.average.toFixed(1)}
                  s)
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Weakness Analysis */}
      <Card className="bg-orange-200 border-4 border-slate-800 p-4 mb-6 shadow-[8px_8px_0px_0px_rgba(30,41,59,1)] relative z-10">
        <h2 className="text-xl font-black mb-4 text-slate-800">Analisis Kelemahan</h2>

        {/* Show letters that need improvement */}
        <div className="space-y-3">
          {(() => {
            const allLetters = [...allConsonants, ...allVowels]

            // Letters with high error rate
            const errorLetters = allLetters
              .map((letter) => {
                const stats = currentModeStats[letter]
                const count = stats ? stats.count : 0
                const incorrect = stats?.incorrect || 0
                const errorRate = count > 0 ? incorrect / count : 0
                return { letter, errorRate, incorrect, count, type: allVowels.includes(letter) ? "vokal" : "konsonan" }
              })
              .filter((item) => item.count > 0 && item.incorrect > 0)
              .sort((a, b) => b.errorRate - a.errorRate) // Highest error rate first
              .slice(0, 4) // Top 4 error-prone

            // Slow letters
            const slowLetters = allLetters
              .map((letter) => {
                const stats = currentModeStats[letter]
                const average = stats ? stats.totalTime / stats.count / 1000 : 0
                const count = stats ? stats.count : 0
                return { letter, average, count, type: allVowels.includes(letter) ? "vokal" : "konsonan" }
              })
              .filter((item) => item.count > 0 && item.average > 1.5) // Slow letters (>1.5s)
              .sort((a, b) => b.average - a.average) // Slowest first
              .slice(0, 4) // Top 4 slowest

            // Fast letters
            const fastLetters = allLetters
              .map((letter) => {
                const stats = currentModeStats[letter]
                const average = stats ? stats.totalTime / stats.count / 1000 : 0
                const count = stats ? stats.count : 0
                return { letter, average, count, type: allVowels.includes(letter) ? "vokal" : "konsonan" }
              })
              .filter((item) => item.count > 0 && item.average <= 1.5) // Fast letters (≤1.5s)
              .sort((a, b) => a.average - b.average) // Fastest first
              .slice(0, 3) // Top 3 fastest

            return (
              <>
                {errorLetters.length > 0 && (
                  <div className="bg-red-100 border-2 border-slate-800 p-3 rounded">
                    <h4 className="font-black text-slate-800 mb-2">❌ Sering Salah:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {errorLetters.map((item) => (
                        <div key={item.letter} className="bg-white border border-slate-600 p-2 rounded text-center">
                          <div className="text-lg font-black text-red-700">{item.letter}</div>
                          <div className="text-xs text-slate-600">
                            {item.incorrect}/{item.count} salah ({item.type})
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {slowLetters.length > 0 && (
                  <div className="bg-yellow-100 border-2 border-slate-800 p-3 rounded mt-3">
                    <h4 className="font-black text-slate-800 mb-2">🐌 Perlu Latihan Lebih (&gt;1.5s):</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {slowLetters.map((item) => (
                        <div key={item.letter} className="bg-white border border-slate-600 p-2 rounded text-center">
                          <div className="text-lg font-black text-amber-700">{item.letter}</div>
                          <div className="text-xs text-slate-600">
                            {item.average.toFixed(1)}s ({item.type})
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {fastLetters.length > 0 && (
                  <div className="bg-green-100 border-2 border-slate-800 p-3 rounded mt-3">
                    <h4 className="font-black text-slate-800 mb-2">🚀 Sudah Mahir (&lt;=1.5s):</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {fastLetters.map((item) => (
                        <div key={item.letter} className="bg-white border border-slate-600 p-2 rounded text-center">
                          <div className="text-lg font-black text-green-700">{item.letter}</div>
                          <div className="text-xs text-slate-600">
                            {item.average.toFixed(1)}s ({item.type})
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {errorLetters.length === 0 && slowLetters.length === 0 && fastLetters.length === 0 && (
                  <div className="bg-blue-100 border-2 border-slate-800 p-3 rounded text-center">
                    <p className="text-slate-700">
                      Belum ada data untuk analisis. Mainkan beberapa sesi untuk melihat analisis kelemahan.
                    </p>
                  </div>
                )}
              </>
            )
          })()}
        </div>

        <div className="mt-4 text-xs text-slate-600 bg-blue-50 border border-slate-300 p-2 rounded">
          <strong>Panduan:</strong> Fokus pada huruf yang sering salah dan huruf dengan masa &gt;1.5s.
          <br />
          Latih huruf-huruf ini untuk penambahbaikan yang berkesan.
        </div>
      </Card>

        </>
      )}

      {/* Back Button */}
      <div className="text-center relative z-10 pb-8 space-y-4">
        <Link href="/bm">
          <Button className="bg-slate-300 text-slate-800 border-4 border-slate-800 hover:bg-slate-400 active:bg-slate-500 font-black text-xl px-8 py-4 shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] touch-manipulation select-none">
            <ArrowLeft className="w-6 h-6 mr-2" />
            Kembali
          </Button>
        </Link>
        <div>
          <button
            type="button"
            onClick={clearAllRecords}
            className="inline-flex items-center gap-2 text-sm font-black text-rose-700 underline underline-offset-4"
          >
            <Trash2 className="w-4 h-4" /> Padam semua rekod {currentProfile.name}
          </button>
        </div>
      </div>

    </div>
  )
}
