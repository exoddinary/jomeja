"use client"

import type React from "react"
import { createContext, useState, useEffect, useContext, useCallback } from "react"
import type { GameMode, LegacyMode, StatsMode } from "@/lib/words"

// Define interfaces for data structures
export interface CardResult {
  syllable: string
  correct: boolean
  timeSpent: number
  marks: number
}

export interface GameResult {
  date: string
  time: string
  duration: number
  correct: number
  wrong: number
  mode: GameMode | LegacyMode
  totalWords: number
  totalMarks: number
  cardResults: CardResult[]
}

export interface LetterStats {
  [key: string]: { totalTime: number; count: number; incorrect?: number }
}

export type AllLetterStats = Partial<Record<StatsMode, LetterStats>>

export interface Profile {
  id: string
  name: string
  results: GameResult[]
  letterStats: AllLetterStats
}

interface ProfileContextType {
  loaded: boolean
  profiles: Profile[]
  currentProfileId: string | null
  currentProfile: Profile | null
  addProfile: (name: string) => void
  selectProfile: (id: string) => void
  deleteProfile: (id: string) => void
  updateCurrentProfileStats: (newResults: GameResult[], newLetterStats: AllLetterStats) => void
  clearCurrentProfileRecords: () => void
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  // Load profiles and currentProfileId from localStorage on mount
  useEffect(() => {
    try {
      const savedProfiles = localStorage.getItem("jom-eja-profiles")
      const parsedProfiles: Profile[] = savedProfiles ? JSON.parse(savedProfiles) : []
      setProfiles(parsedProfiles)

      const savedCurrentProfileId = localStorage.getItem("jom-eja-current-profile-id")
      if (savedCurrentProfileId && parsedProfiles.some((p) => p.id === savedCurrentProfileId)) {
        setCurrentProfileId(savedCurrentProfileId)
      } else if (parsedProfiles.length > 0) {
        // If no current ID but profiles exist, select the first one
        setCurrentProfileId(parsedProfiles[0].id)
      }
    } catch (error) {
      console.error("Failed to load profiles from localStorage:", error)
      // Clear corrupted data if any
      localStorage.removeItem("jom-eja-profiles")
      localStorage.removeItem("jom-eja-current-profile-id")
    }
    setLoaded(true)
  }, [])

  // Save profiles and currentProfileId to localStorage whenever they change (only after initial load,
  // otherwise the empty initial state would overwrite saved data)
  useEffect(() => {
    if (loaded) localStorage.setItem("jom-eja-profiles", JSON.stringify(profiles))
  }, [profiles, loaded])

  useEffect(() => {
    if (!loaded) return
    if (currentProfileId) {
      localStorage.setItem("jom-eja-current-profile-id", currentProfileId)
    } else {
      localStorage.removeItem("jom-eja-current-profile-id")
    }
  }, [currentProfileId, loaded])

  const currentProfile = profiles.find((p) => p.id === currentProfileId) || null

  const addProfile = useCallback((name: string) => {
    const newProfile: Profile = {
      id: Date.now().toString(), // Simple unique ID
      name,
      results: [],
      letterStats: {},
    }
    setProfiles((prev) => [...prev, newProfile])
    setCurrentProfileId(newProfile.id) // Automatically select the new profile
  }, [])

  const selectProfile = useCallback((id: string) => {
    setCurrentProfileId(id)
  }, [])

  const deleteProfile = useCallback(
    (id: string) => {
      setProfiles((prev) => prev.filter((p) => p.id !== id))
      if (currentProfileId === id) {
        // If the deleted profile was the current one, clear currentProfileId
        setCurrentProfileId(null)
      }
    },
    [currentProfileId],
  )

  const updateCurrentProfileStats = useCallback(
    (newResults: GameResult[], newLetterStats: AllLetterStats) => {
      setProfiles((prevProfiles) =>
        prevProfiles.map((p) =>
          p.id === currentProfileId ? { ...p, results: newResults, letterStats: newLetterStats } : p,
        ),
      )
    },
    [currentProfileId],
  )

  const clearCurrentProfileRecords = useCallback(() => {
    if (currentProfileId) {
      setProfiles((prevProfiles) =>
        prevProfiles.map((p) => (p.id === currentProfileId ? { ...p, results: [], letterStats: {} } : p)),
      )
    }
  }, [currentProfileId])

  const value = {
    loaded,
    profiles,
    currentProfileId,
    currentProfile,
    addProfile,
    selectProfile,
    deleteProfile,
    updateCurrentProfileStats,
    clearCurrentProfileRecords,
  }

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider")
  }
  return context
}
