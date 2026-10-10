"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation" // Import useRouter
import { useProfile } from "@/context/profile-context" // Import useProfile

interface FirstTimeModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export default function FirstTimeModal({ isOpen, onClose, onComplete }: FirstTimeModalProps) {
  const router = useRouter()
  const { profiles, currentProfileId } = useProfile() // Use profile context
  const [currentPage, setCurrentPage] = useState(1)
  const [imagesPreloaded, setImagesPreloaded] = useState(false)

  // Preload game images when modal opens
  useEffect(() => {
    if (isOpen && !imagesPreloaded) {
      const imagesToPreload = [
        "/images/lin-happy.png",
        "/images/happy-character.png",
        "/images/lin-excited.png",
        "/images/lin-sad.png",
      ]

      let loadedCount = 0
      const totalImages = imagesToPreload.length

      imagesToPreload.forEach((src) => {
        const img = new window.Image()
        img.onload = () => {
          loadedCount++
          if (loadedCount === totalImages) {
            setImagesPreloaded(true)
          }
        }
        img.onerror = () => {
          loadedCount++
          if (loadedCount === totalImages) {
            setImagesPreloaded(true)
          }
        }
        img.src = src
      })
    }
  }, [isOpen, imagesPreloaded])

  const handleNext = () => {
    if (currentPage < 3) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handleSkip = () => {
    onComplete()
    // After skipping, if no profiles exist, redirect to profile creation
    if (profiles.length === 0) {
      router.push("/profile")
    } else if (!currentProfileId) {
      router.push("/profile") // If profiles exist but none selected
    } else {
      router.push("/") // If a profile is already selected
    }
  }

  const handleStart = () => {
    onComplete()
    // After completing intro, if no profiles exist, redirect to profile creation
    if (profiles.length === 0) {
      router.push("/profile")
    } else if (!currentProfileId) {
      router.push("/profile") // If profiles exist but none selected
    } else {
      router.push("/") // If a profile is already selected
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="bg-white border-4 border-slate-800 w-full max-w-sm shadow-[8px_8px_0px_0px_rgba(30,41,59,1)] relative max-h-[90vh] flex flex-col">
        {/* Close button */}
        <Button
          onClick={onClose}
          className="absolute top-4 right-4 bg-gray-200 text-slate-800 border-2 border-slate-800 hover:bg-gray-300 active:bg-gray-400 font-black text-sm px-2 py-1 touch-manipulation select-none z-10"
        >
          <X className="w-4 h-4" />
        </Button>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto p-6 pb-0">
          {/* All the existing page content goes here without the bottom navigation */}
          {/* Page 1: Welcome */}
          {currentPage === 1 && (
            <div className="text-center">
              <div className="mb-6">
                <Image
                  src="/images/learn1.png"
                  alt="Parent and child learning together"
                  width={300}
                  height={200}
                  className="mx-auto rounded-lg"
                />
              </div>

              <h2 className="text-2xl font-black mb-4 text-slate-800">Selamat Datang ke Jom Eja</h2>

              <p className="text-lg font-bold mb-4 text-slate-700">
                Bantu anak anda belajar membaca dengan cara yang seronok dan terarah.
              </p>

              <p className="text-base font-bold mb-6 text-slate-600">
                Jom Eja ialah aplikasi suku kata interaktif yang direka khas untuk ibu bapa dan anak.
              </p>

              <div className="space-y-3 text-left mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-emerald-600 font-black text-xl">✓</span>
                  <p className="text-sm font-bold text-slate-700">Pilih huruf dan vokal yang ingin dikuasai</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-emerald-600 font-black text-xl">✓</span>
                  <p className="text-sm font-bold text-slate-700">
                    Bermain seperti kad imbas — tetapi dengan ganjaran dan animasi
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-emerald-600 font-black text-xl">✓</span>
                  <p className="text-sm font-bold text-slate-700">
                    Jejak prestasi untuk tahu huruf mana anak anda lemah
                  </p>
                </div>
              </div>

              <div className="bg-yellow-100 border-2 border-yellow-400 p-3 rounded mb-6">
                <p className="text-xs font-bold text-slate-700">
                  <strong>Nota:</strong> Anda yang tentukan sama ada jawapan betul atau salah. Ini bukan auto-grading —
                  anda adalah pendidik utama.
                </p>
              </div>
            </div>
          )}

          {/* Page 2: Focus Learning */}
          {currentPage === 2 && (
            <div className="text-center">
              <div className="mb-6">
                <Image
                  src="/images/learn2.png"
                  alt="Customizing learning settings"
                  width={300}
                  height={200}
                  className="mx-auto rounded-lg"
                />
              </div>

              <h2 className="text-2xl font-black mb-4 text-slate-800">Tentukan Fokus Pembelajaran</h2>

              <p className="text-lg font-bold mb-6 text-slate-700">Sebelum mula bermain, anda boleh tetapkan:</p>

              <div className="space-y-4 text-left mb-6">
                <div className="bg-purple-100 border-2 border-slate-800 p-3 rounded">
                  <h4 className="font-black text-slate-800 mb-1">Tahap:</h4>
                  <p className="text-sm font-bold text-slate-600">
                    2 Huruf (ba, ki), 3 Huruf (man, kah) atau 4 Huruf — perkataan sebenar seperti buku, yang, syok
                  </p>
                </div>

                <div className="bg-green-100 border-2 border-slate-800 p-3 rounded">
                  <h4 className="font-black text-slate-800 mb-1">Format Huruf:</h4>
                  <p className="text-sm font-bold text-slate-600">Sama ada "Ma", "ma", atau "MA"</p>
                </div>

                <div className="bg-blue-100 border-2 border-slate-800 p-3 rounded">
                  <h4 className="font-black text-slate-800 mb-1">Huruf Konsonan:</h4>
                  <p className="text-sm font-bold text-slate-600">
                    Boleh ditapis supaya hanya huruf lazim dalam Bahasa Melayu digunakan
                  </p>
                </div>

                <div className="bg-orange-100 border-2 border-slate-800 p-3 rounded">
                  <h4 className="font-black text-slate-800 mb-1">Bilangan Kad:</h4>
                  <p className="text-sm font-bold text-slate-600">Latihan pendek (5), biasa (10) atau panjang (20)</p>
                </div>
              </div>

              <div className="bg-yellow-100 border-2 border-yellow-400 p-3 rounded mb-6">
                <p className="text-xs font-bold text-slate-700">
                  <strong>Catatan:</strong> Huruf seperti Q, X, dan V telah dikeluarkan kerana tidak mewakili kebanyakan
                  struktur bunyi dalam Bahasa Melayu.
                </p>
              </div>
            </div>
          )}

          {/* Page 3: Statistics */}
          {currentPage === 3 && (
            <div className="text-center">
              <div className="mb-6">
                <Image
                  src="/images/learn3.png"
                  alt="Child learning syllables"
                  width={300}
                  height={200}
                  className="mx-auto rounded-lg"
                />
              </div>

              <h2 className="text-2xl font-black mb-4 text-slate-800">Lihat Statistik, Bantu Anak Lebih Fokus</h2>

              <p className="text-lg font-bold mb-4 text-slate-700">Setiap sesi akan direkodkan secara automatik.</p>

              <p className="text-base font-bold mb-4 text-slate-600">Anda boleh semak:</p>

              <div className="space-y-3 text-left mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-blue-600 font-black text-xl">📊</span>
                  <p className="text-sm font-bold text-slate-700">Purata masa respons untuk setiap huruf</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-600 font-black text-xl">❌</span>
                  <p className="text-sm font-bold text-slate-700">Huruf yang sering salah</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-600 font-black text-xl">✅</span>
                  <p className="text-sm font-bold text-slate-700">Huruf yang sudah dikuasai</p>
                </div>
              </div>

              <p className="text-sm font-bold mb-4 text-slate-700">
                Gunakan maklumat ini untuk buat latihan ulangan yang lebih tepat.
              </p>

              <div className="bg-emerald-100 border-2 border-emerald-400 p-3 rounded mb-6">
                <p className="text-xs font-bold text-slate-700">
                  <strong>Contoh:</strong> Jika huruf "C" selalu salah atau ambil masa lama, anda boleh fokuskan pada
                  kombinasi suku kata seperti Ca, Ci, Cu dalam sesi berikutnya.
                </p>
              </div>

              {!imagesPreloaded && <p className="text-xs text-slate-500 mb-4">Sedang memuatkan imej permainan...</p>}
            </div>
          )}
        </div>

        {/* Sticky bottom navigation */}
        <div className="border-t-4 border-slate-800 bg-white p-6">
          {/* Page indicator */}
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3].map((page) => (
              <div
                key={page}
                className={`w-3 h-3 rounded-full border-2 border-slate-800 ${
                  currentPage === page ? "bg-slate-800" : "bg-white"
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          {currentPage < 3 ? (
            <div className="flex gap-3">
              <Button
                onClick={handleSkip}
                className="flex-1 bg-gray-300 text-slate-800 border-4 border-slate-800 hover:bg-gray-400 active:bg-gray-500 font-black text-lg py-3 touch-manipulation select-none"
              >
                Langkau
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1 bg-blue-300 text-slate-800 border-4 border-slate-800 hover:bg-blue-400 active:bg-blue-500 font-black text-lg py-3 touch-manipulation select-none"
              >
                Seterusnya &gt;
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleStart}
              disabled={!imagesPreloaded}
              className={`w-full font-black text-xl py-4 border-4 border-slate-800 touch-manipulation select-none ${
                imagesPreloaded
                  ? "bg-emerald-300 text-slate-800 hover:bg-emerald-400 active:bg-emerald-500"
                  : "bg-gray-300 text-gray-600 cursor-not-allowed"
              }`}
            >
              {imagesPreloaded ? "Mula" : "Memuatkan..."}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
