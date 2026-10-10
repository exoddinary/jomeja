// Generates every English clip the app needs into public/audio/en (committed, so the live app makes no API calls).
//
//   node --env-file=.env.local scripts/en-audio.mts --voice <library_voice_id> [--only sound|word] [--force] [--ids s,a,cat]
//
// Existing files are skipped unless --force is given, so you can re-run to fill gaps or redo single clips.
import { existsSync } from "node:fs"
import { sounds, vocabulary, audioPath } from "../lib/english/phonics.ts"
import { soundText, tts } from "./elevenlabs.mts"

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? undefined : process.argv[i + 1]
}
const voiceId = arg("voice")
if (!voiceId) {
  console.error("Usage: node --env-file=.env.local scripts/en-audio.mts --voice <voice_id> [--only sound|word] [--force] [--ids a,b]")
  process.exit(1)
}
const only = arg("only")
const ids = arg("ids")?.split(",")
const force = process.argv.includes("--force")

const jobs = [
  ...(only === "word" ? [] : sounds.map((s) => ({ kind: "sound" as const, id: s.id, text: soundText(s.ipa) }))),
  ...(only === "sound" ? [] : vocabulary.map((w) => ({ kind: "word" as const, id: w, text: `${w === "i" ? "I" : w}.` }))),
]
  .filter((j) => !ids || ids.includes(j.id))
  .map((j) => ({ ...j, out: `public${audioPath(j.kind, j.id)}` }))
  .filter((j) => force || !existsSync(j.out))

console.log(`Generating ${jobs.length} clips with voice ${voiceId}...`)
let done = 0
const worker = async () => {
  for (let job = jobs.shift(); job; job = jobs.shift()) {
    try {
      await tts({ voiceId, text: job.text, out: job.out })
      console.log(`[${++done}] ${job.kind} ${job.id}`)
    } catch (e) {
      console.error(`FAILED ${job.kind} ${job.id}: ${(e as Error).message}`)
    }
  }
}
await Promise.all([worker(), worker(), worker()])
console.log("Done.")
