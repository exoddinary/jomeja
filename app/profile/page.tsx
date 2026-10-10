"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, UserPlus, Trash2, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useProfile } from "@/context/profile-context"

export default function ProfilePage() {
  const router = useRouter()
  const { loaded, profiles, currentProfileId, addProfile, selectProfile, deleteProfile } = useProfile()
  const [newProfileName, setNewProfileName] = useState("")
  const [showAddProfileForm, setShowAddProfileForm] = useState(false)

  const handleAddProfile = () => {
    if (newProfileName.trim()) {
      addProfile(newProfileName.trim())
      setNewProfileName("")
      setShowAddProfileForm(false)
      router.push("/") // Redirect to main page after adding and selecting
    }
  }

  const handleSelectProfile = (id: string) => {
    selectProfile(id)
    router.push("/") // Redirect to main page after selecting
  }

  const handleDeleteProfile = (id: string, name: string) => {
    if (window.confirm(`Adakah anda pasti mahu memadamkan profil '${name}'? Semua rekod akan hilang.`)) {
      deleteProfile(id)
      // If no profiles left, show add form
      if (profiles.length === 1 && profiles[0].id === id) {
        // If this was the last profile
        setShowAddProfileForm(true)
      }
    }
  }

  return (
    <div className="min-h-screen bg-rose-100 p-4 max-w-md mx-auto font-bold relative">
      {/* Grid Background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="w-full h-full bg-grid-pattern"></div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h1 className="text-2xl font-black text-slate-800">👤 Profil Pengguna</h1>
        <Link href="/">
          <Button className="bg-slate-800 text-rose-100 border-4 border-slate-800 hover:bg-slate-700 active:bg-slate-900 font-black text-lg px-4 py-2 touch-manipulation select-none">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
      </div>

      {loaded && profiles.length === 0 && !showAddProfileForm && (
        <Card className="bg-white border-4 border-slate-800 p-6 mb-6 shadow-[8px_8px_0px_0px_rgba(30,41,59,1)] text-center relative z-10">
          <h2 className="text-xl font-black mb-4 text-slate-800">Tiada Profil Ditemui</h2>
          <p className="text-lg font-bold mb-6 text-slate-700">Sila tambah profil baru untuk bermula.</p>
          <Button
            onClick={() => setShowAddProfileForm(true)}
            className="bg-emerald-300 text-slate-800 border-4 border-slate-800 hover:bg-emerald-400 active:bg-emerald-500 font-black text-xl px-8 py-4 shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] touch-manipulation select-none"
          >
            <UserPlus className="w-6 h-6 mr-2" />
            Tambah Profil Baru
          </Button>
        </Card>
      )}

      {showAddProfileForm && (
        <Card className="bg-purple-200 border-4 border-slate-800 p-6 mb-6 shadow-[8px_8px_0px_0px_rgba(30,41,59,1)] relative z-10">
          <h2 className="text-xl font-black mb-4 text-slate-800">Tambah Profil Baru</h2>
          <Input
            type="text"
            placeholder="Nama Profil"
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddProfile()}
            autoFocus
            className="mb-4 p-3 border-2 border-slate-800 rounded-md text-slate-800 font-bold"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => setShowAddProfileForm(false)}
              className="flex-1 bg-gray-300 text-slate-800 border-4 border-slate-800 hover:bg-gray-400 active:bg-gray-500 font-black text-lg py-3 touch-manipulation select-none"
            >
              Batal
            </Button>
            <Button
              onClick={handleAddProfile}
              disabled={!newProfileName.trim()}
              className={`flex-1 border-4 border-slate-800 font-black text-lg py-3 touch-manipulation select-none ${
                newProfileName.trim()
                  ? "bg-emerald-300 text-slate-800 hover:bg-emerald-400 active:bg-emerald-500"
                  : "bg-slate-300 text-slate-600 cursor-not-allowed"
              }`}
            >
              Tambah
            </Button>
          </div>
        </Card>
      )}

      {profiles.length > 0 && !showAddProfileForm && (
        <div className="space-y-4 relative z-10">
          <h2 className="text-xl font-black mb-4 text-slate-800">Pilih Profil</h2>
          {profiles.map((profile) => (
            <Card
              key={profile.id}
              className={`p-4 border-4 border-slate-800 shadow-[8px_8px_0px_0px_rgba(30,41,59,1)] flex items-center justify-between ${
                profile.id === currentProfileId ? "bg-emerald-200" : "bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-slate-800">{profile.name}</span>
                {profile.id === currentProfileId && <CheckCircle className="w-6 h-6 text-emerald-600" />}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSelectProfile(profile.id)}
                  disabled={profile.id === currentProfileId}
                  className={`font-black border-4 border-slate-800 touch-manipulation select-none ${
                    profile.id === currentProfileId
                      ? "bg-slate-800 text-white cursor-not-allowed"
                      : "bg-blue-300 text-slate-800 hover:bg-blue-400 active:bg-blue-500"
                  }`}
                >
                  Pilih
                </Button>
                <Button
                  onClick={() => handleDeleteProfile(profile.id, profile.name)}
                  className="bg-rose-300 text-slate-800 border-4 border-slate-800 hover:bg-rose-400 active:bg-rose-500 font-black text-lg px-3 py-2 touch-manipulation select-none"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </Card>
          ))}
          <Button
            onClick={() => setShowAddProfileForm(true)}
            className="w-full bg-emerald-300 text-slate-800 border-4 border-slate-800 hover:bg-emerald-400 active:bg-emerald-500 font-black text-xl px-8 py-4 shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] touch-manipulation select-none mt-6"
          >
            <UserPlus className="w-6 h-6 mr-2" />
            Tambah Profil Baru
          </Button>

          {currentProfileId && (
            <Link href="/">
              <Button className="w-full bg-slate-800 text-rose-100 border-4 border-slate-800 hover:bg-slate-700 active:bg-slate-900 font-black text-xl px-8 py-4 shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] touch-manipulation select-none mt-4">
                <ArrowLeft className="w-6 h-6 mr-2" />
                Kembali ke Aplikasi
              </Button>
            </Link>
          )}
        </div>
      )}

    </div>
  )
}
