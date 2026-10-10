// Voice audition for the English reading section.
//
//   1. List Malaysian-accent English voices and download their free previews (no credits used):
//        node --env-file=.env.local scripts/en-voices.mts
//   2. Generate the same test clips with shortlisted voices (uses a few credits; adds them to your voice library):
//        node --env-file=.env.local scripts/en-voices.mts --test <voice_id>:<public_owner_id>,<voice_id>:<public_owner_id>
//
// Output goes to .audition/ (git-ignored).
import { writeFile, mkdir } from "node:fs/promises"
import { api, download, soundText, tts } from "./elevenlabs.mts"

const OUT = ".audition"

// Minimal pairs that Malaysian English often merges, plus pure sounds that are easy to get wrong
const testWords = ["pat", "pet", "man", "men", "bad", "bed", "cat", "cap", "sat"]
const testSounds: Record<string, string> = { s: "s", m: "m", t: "t", a: "æ", e: "e", p: "p" }

const safe = (name: string) => name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()

const list = async () => {
  const found = new Map<string, any>()
  for (const query of ["accent=malaysian&language=en", "search=malaysian&language=en", "search=malaysia"]) {
    const res = await api(`/shared-voices?page_size=50&${query}`)
    for (const v of (await res.json()).voices) found.set(v.voice_id, v)
  }
  const voices = [...found.values()]
  console.log(`Found ${voices.length} candidate voices:\n`)
  await mkdir(OUT, { recursive: true })
  const rows: string[] = []
  for (const v of voices) {
    const line = `${v.name} | ${v.gender} ${v.age} | accent: ${v.accent} | ${v.use_case}\n  id ${v.voice_id}:${v.public_owner_id}\n  ${(v.description ?? "").slice(0, 140)}`
    console.log(line + "\n")
    rows.push(line)
    if (v.preview_url) await download(v.preview_url, `${OUT}/previews/${safe(v.name)}-${v.voice_id}.mp3`).catch(() => {})
  }
  await writeFile(`${OUT}/voices.txt`, rows.join("\n\n"))
  console.log(`Previews saved to ${OUT}/previews/`)
}

const test = async (pairs: string[]) => {
  const mine = new Set(((await (await api("/voices")).json()).voices ?? []).map((v: any) => v.voice_id))
  for (const pair of pairs) {
    const [sharedId, ownerId] = pair.split(":")
    let voiceId = sharedId
    if (!mine.has(sharedId)) {
      const res = await api(`/voices/add/${ownerId}/${sharedId}`, {
        method: "POST",
        body: JSON.stringify({ new_name: `JomRead audition ${sharedId.slice(0, 6)}` }),
      })
      voiceId = (await res.json()).voice_id
    }
    const dir = `${OUT}/test-${sharedId}`
    for (const w of testWords) await tts({ voiceId, text: `${w}.`, out: `${dir}/word-${w}.mp3` })
    for (const [id, ipa] of Object.entries(testSounds)) await tts({ voiceId, text: soundText(ipa), out: `${dir}/sound-${id}.mp3` })
    console.log(`Generated test clips for ${sharedId} (library voice ${voiceId}) in ${dir}/`)
  }
}

const testIndex = process.argv.indexOf("--test")
if (testIndex === -1) await list()
else await test(process.argv[testIndex + 1].split(","))
