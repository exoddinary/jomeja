"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function WalkthroughPage() {
  return (
    <div className="min-h-screen bg-rose-100 p-4 max-w-md mx-auto font-bold relative">
      {/* Grid Background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="w-full h-full bg-grid-pattern"></div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h1 className="text-2xl font-black text-slate-800">Panduan Jom Eja</h1>
        <Link href="/">
          <Button className="bg-slate-800 text-rose-100 border-4 border-slate-800 hover:bg-slate-700 active:bg-slate-900 font-black text-lg px-4 py-2 touch-manipulation select-none">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="space-y-6 relative z-10">
        <Card className="bg-white border-4 border-slate-800 p-6 shadow-[8px_8px_0px_0px_rgba(30,41,59,1)]">
          <h2 className="text-xl font-black mb-4 text-slate-800">Halaman Utama</h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-700">
            <li>
              <span className="font-black">Tajuk:</span> "Suku Kata" dengan ikon tetapan di kanan atas
            </li>
            <li>
              <span className="font-black">Kad Mula:</span> Menunjukkan mod semasa, bilangan perkataan, dan format
            </li>
            <li>
              <span className="font-black">Butang Mula:</span> Butang hijau "Mula" untuk memulakan latihan
            </li>
            <li>
              <span className="font-black">Bahagian Rekod:</span> Menunjukkan sehingga 5 keputusan sesi sebelumnya
            </li>
            <li>
              <span className="font-black">Akses Tetapan:</span> Klik ikon gear untuk mengakses tetapan
            </li>
          </ul>
        </Card>

        <Card className="bg-white border-4 border-slate-800 p-6 shadow-[8px_8px_0px_0px_rgba(30,41,59,1)]">
          <h2 className="text-xl font-black mb-4 text-slate-800">Halaman Permainan</h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-700">
            <li>
              <span className="font-black">Tajuk:</span> Menunjukkan nombor kad semasa, pemasa, kiraan betul/salah, dan
              streak
            </li>
            <li>
              <span className="font-black">Kad Suku Kata:</span> Paparan besar suku kata semasa dalam fon tulisan tangan
            </li>
            <li>
              <span className="font-black">Butang Jawapan:</span> Butang "Betul" dan "Salah" untuk menjawab
            </li>
            <li>
              <span className="font-black">Butang Utama:</span> Kembali ke menu utama semasa permainan
            </li>
            <li>
              <span className="font-black">Animasi Karakter:</span> Muncul pada pencapaian streak (5, 7, 10 betul atau 3
              salah)
            </li>
          </ul>
        </Card>

        <Card className="bg-white border-4 border-slate-800 p-6 shadow-[8px_8px_0px_0px_rgba(30,41,59,1)]">
          <h2 className="text-xl font-black mb-4 text-slate-800">Halaman Keputusan</h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-700">
            <li>
              <span className="font-black">Kad Ringkasan:</span> Menunjukkan tarikh, masa, tempoh, kiraan betul/salah,
              dan jumlah markah
            </li>
            <li>
              <span className="font-black">Keputusan Terperinci:</span> Grid menunjukkan setiap suku kata, masa yang
              diambil, dan markah yang diperoleh
            </li>
            <li>
              <span className="font-black">Butang Tindakan:</span> "Main Lagi", "Tetapan", "Statistik Huruf"
            </li>
          </ul>
        </Card>

        <Card className="bg-white border-4 border-slate-800 p-6 shadow-[8px_8px_0px_0px_rgba(30,41,59,1)]">
          <h2 className="text-xl font-black mb-4 text-slate-800">Halaman Statistik</h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-700">
            <li>
              <span className="font-black">Carta Konsonan:</span> Carta bar menunjukkan masa respons purata untuk setiap
              konsonan
            </li>
            <li>
              <span className="font-black">Carta Vokal:</span> Carta bar menunjukkan masa respons purata untuk setiap
              vokal
            </li>
            <li>
              <span className="font-black">Statistik Ringkasan:</span> Bilangan konsonan dan vokal yang dicuba
            </li>
            <li>
              <span className="font-black">Prestasi Terbaik:</span> Konsonan dan vokal terpantas
            </li>
            <li>
              <span className="font-black">Analisis Gabungan:</span> Contoh kombinasi suku kata dengan analisis masa
            </li>
          </ul>
        </Card>

        <Card className="bg-white border-4 border-slate-800 p-6 shadow-[8px_8px_0px_0px_rgba(30,41,59,1)]">
          <h2 className="text-xl font-black mb-4 text-slate-800">Panel Tetapan</h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-700">
            <li>
              <span className="font-black">Pilihan Mod:</span> Mudah (a,i,u), Sukar (a,e,i,o,u), 3-Huruf, atau Vokal
              Pilihan
            </li>
            <li>
              <span className="font-black">Format Huruf:</span> Biasa (Ma), kecil (ma), atau BESAR (MA)
            </li>
            <li>
              <span className="font-black">Bilangan Perkataan:</span> 10 atau 20 perkataan per sesi
            </li>
            <li>
              <span className="font-black">Pilihan Konsonan:</span> Pilih konsonan untuk berlatih
            </li>
            <li>
              <span className="font-black">Pilihan Vokal:</span> (Dalam mod Vokal Pilihan) Pilih vokal untuk berlatih
            </li>
            <li>
              <span className="font-black">Padam Rekod:</span> Pilihan untuk memadamkan semua data yang disimpan
            </li>
            <li>
              <span className="font-black">Butang Pengesahan:</span> Simpan atau batalkan perubahan
            </li>
          </ul>
        </Card>

        <Card className="bg-blue-200 border-4 border-slate-800 p-6 shadow-[8px_8px_0px_0px_rgba(30,41,59,1)]">
          <h2 className="text-xl font-black mb-4 text-slate-800">Ciri-ciri Utama</h2>

          <h3 className="font-black text-lg text-slate-800 mt-4 mb-2">1. Ciri Pembelajaran</h3>
          <ul className="list-disc pl-5 space-y-1 text-slate-700 mb-4">
            <li>
              <span className="font-bold">Pelbagai Mod:</span> Tahap kesukaran dan jenis suku kata yang berbeza
            </li>
            <li>
              <span className="font-bold">Pilihan Format:</span> Berlatih dengan format huruf yang berbeza
            </li>
            <li>
              <span className="font-bold">Latihan Tersuai:</span> Pilih konsonan dan vokal tertentu untuk fokus
            </li>
            <li>
              <span className="font-bold">Mod 3-Huruf:</span> Berlatih suku kata yang lebih kompleks dengan konsonan
              akhir
            </li>
          </ul>

          <h3 className="font-black text-lg text-slate-800 mt-4 mb-2">2. Ciri Permainan</h3>
          <ul className="list-disc pl-5 space-y-1 text-slate-700 mb-4">
            <li>
              <span className="font-bold">Pemasa:</span> Kiraan masa untuk setiap suku kata untuk menggalakkan
              pengecaman pantas
            </li>
            <li>
              <span className="font-bold">Sistem Markah:</span> 3 markah (&lt;5s), 2 markah (5-10s), 1 markah (&gt;10s)
            </li>
            <li>
              <span className="font-bold">Pengira Streak:</span> Menjejak jawapan betul berturut-turut
            </li>
            <li>
              <span className="font-bold">Animasi Karakter:</span> Karakter motivasi muncul pada streak pencapaian
            </li>
            <li>
              <span className="font-bold">Efek Bunyi:</span> Maklum balas audio untuk jawapan betul/salah
            </li>
          </ul>

          <h3 className="font-black text-lg text-slate-800 mt-4 mb-2">3. Penjejakan Kemajuan</h3>
          <ul className="list-disc pl-5 space-y-1 text-slate-700 mb-4">
            <li>
              <span className="font-bold">Keputusan Sesi:</span> Prestasi terperinci untuk setiap sesi latihan
            </li>
            <li>
              <span className="font-bold">Rekod Sejarah:</span> Lihat keputusan sesi sebelumnya
            </li>
            <li>
              <span className="font-bold">Statistik Huruf:</span> Analisis prestasi mengikut huruf individu
            </li>
            <li>
              <span className="font-bold">Analisis Gabungan:</span> Lihat bagaimana kombinasi konsonan+vokal
              mempengaruhi kelajuan
            </li>
          </ul>
        </Card>

        <Card className="bg-green-200 border-4 border-slate-800 p-6 shadow-[8px_8px_0px_0px_rgba(30,41,59,1)]">
          <h2 className="text-xl font-black mb-4 text-slate-800">Cara Menggunakan</h2>
          <ol className="list-decimal pl-5 space-y-3 text-slate-700">
            <li>
              <span className="font-black">Mula:</span> Pilih tetapan anda dan ketik "Mula" untuk bermula
            </li>
            <li>
              <span className="font-black">Berlatih:</span> Baca suku kata dan ketik "Betul" atau "Salah" untuk menjawab
            </li>
            <li>
              <span className="font-black">Semak:</span> Selepas menyelesaikan semua perkataan, semak prestasi anda
            </li>
            <li>
              <span className="font-black">Analisis:</span> Periksa statistik huruf untuk mengenal pasti bidang untuk
              penambahbaikan
            </li>
            <li>
              <span className="font-black">Sesuaikan:</span> Sesuaikan tetapan untuk fokus pada huruf yang mencabar
            </li>
          </ol>

          <p className="mt-6 text-slate-700">
            Jom Eja direka untuk menjadikan pembelajaran suku kata Bahasa Melayu menarik dan berkesan melalui
            gamifikasi, maklum balas visual, dan penjejakan kemajuan terperinci.
          </p>
        </Card>

        {/* Back Button */}
        <div className="text-center pb-8">
          <Link href="/">
            <Button className="bg-slate-800 text-rose-100 border-4 border-slate-800 hover:bg-slate-700 active:bg-slate-900 font-black text-xl px-8 py-4 shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] touch-manipulation select-none">
              <ArrowLeft className="w-6 h-6 mr-2" />
              Kembali ke Aplikasi
            </Button>
          </Link>
        </div>
      </div>

      <style jsx global>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  )
}
