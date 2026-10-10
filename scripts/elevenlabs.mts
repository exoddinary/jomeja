// Shared helpers for the ElevenLabs scripts. Run scripts with: node --env-file=.env.local scripts/<name>.mts
import { mkdir, writeFile } from "node:fs/promises"
import { dirname } from "node:path"

const API = "https://api.elevenlabs.io/v1"

export const apiKey = () => {
  const key = process.env.ELEVENLABS_API_KEY
  if (!key) {
    console.error("ELEVENLABS_API_KEY is empty. Add it to .env.local first.")
    process.exit(1)
  }
  return key
}

export const api = async (path: string, init: RequestInit = {}) => {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { "xi-api-key": apiKey(), "Content-Type": "application/json", ...(init.headers ?? {}) },
  })
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} -> ${res.status}: ${await res.text()}`)
  return res
}

export interface TtsOptions {
  voiceId: string
  text: string
  modelId?: string
  out: string
}

export const tts = async ({ voiceId, text, modelId = process.env.ELEVENLABS_MODEL || "eleven_v4", out }: TtsOptions) => {
  const res = await api(`/text-to-speech/${voiceId}?output_format=mp3_44100_64`, {
    method: "POST",
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: { stability: 0.75, similarity_boost: 0.8, speed: 0.9 },
    }),
  })
  await mkdir(dirname(out), { recursive: true })
  await writeFile(out, Buffer.from(await res.arrayBuffer()))
}

export const download = async (url: string, out: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`download ${url} -> ${res.status}`)
  await mkdir(dirname(out), { recursive: true })
  await writeFile(out, Buffer.from(await res.arrayBuffer()))
}

// Text sent to the voice for an isolated phoneme. Wrapping IPA in slashes asks the model for the exact sound.
export const soundText = (ipa: string) => `/${ipa}/`
