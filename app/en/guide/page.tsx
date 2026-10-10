"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft, Volume2 } from "lucide-react"
import { en } from "@/components/english/cards"
import { playClip } from "@/lib/english/audio"
import { groupLabels, sounds, type GroupId } from "@/lib/english/phonics"

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={`${en.panel} p-5`}>
      <h2 className="text-lg font-black text-teal-300 mb-2">{title}</h2>
      <div className="space-y-2 text-sm text-slate-300 leading-relaxed font-medium">{children}</div>
    </section>
  )
}

export default function ParentGuide() {
  return (
    <div className={en.page}>
      <header className="flex justify-between items-center mb-5">
        <h1 className="text-2xl font-black">Parent guide</h1>
        <Link href="/en" className={en.ghost} aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </header>

      <div className="space-y-4 pb-10">
        <Section title="How this works">
          <p>
            Jom Read uses <b>synthetic phonics</b>, the method most schools use to teach reading, including KSSR English. Children
            learn the <b>sounds</b> letters make, then blend those sounds to read words.
          </p>
          <ol className="list-decimal pl-5 space-y-1">
            <li><b>Sounds:</b> learn what each letter says (s says sss).</li>
            <li><b>Blend:</b> say the sounds and push them together: s-a-t → sat.</li>
            <li><b>Spell:</b> the reverse: hear sat, split it into s-a-t.</li>
            <li><b>Tricky words:</b> a few common words (the, was, to) are learned by sight.</li>
            <li><b>Sentences:</b> read sentences made only of sounds and words already learned.</li>
          </ol>
          <p>Each level adds new sounds. The next level unlocks once your child gets 90% right over their last 20 tries.</p>
        </Section>

        <Section title="Say pure sounds (the most important tip)">
          <p>
            Say <b>mmm</b>, not <b>muh</b>. Say <b>sss</b>, not <b>suh</b> or <b>ess</b>. Extra &quot;uh&quot; sounds make blending
            impossible: &quot;cuh-a-tuh&quot; does not sound like cat. Tap a sound below to hear it.
          </p>
          {([1, 2, 3] as GroupId[]).map((g) => (
            <div key={g} className="pt-2">
              <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">
                Level {g}: <span className="tracking-[0.3em]">{groupLabels[g]}</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {sounds
                  .filter((s) => s.group === g)
                  .map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => playClip("sound", s.id, `${s.id}, as in ${s.example}`)}
                      className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 rounded-xl px-3 py-2 text-left"
                    >
                      <span className="w-10 text-2xl font-black text-white">{s.id}</span>
                      <span className="flex-1 text-xs">
                        {s.emoji} {s.example} · {s.tip}
                      </span>
                      <Volume2 className="w-4 h-4 text-teal-300 shrink-0" />
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </Section>

        <Section title="Blending: read, don't guess">
          <p>Ask your child to touch each dot under the word and say its sound, then say the sounds again, faster, until they hear the word.</p>
          <p>
            Struggling readers often guess from the first letter or the picture. If they guess, point back to the first dot and sound it
            out together. Slow and correct is better than fast and guessed.
          </p>
          <p>Use 🔊 only after they have tried, to check, not to give the answer.</p>
        </Section>

        <Section title="How to mark">
          <p>
            <b>✓ Got it</b>: read correctly by themselves, even if slowly.
            <br />
            <b>✗ Not yet</b>: guessed, needed you to say it, or got a sound wrong.
          </p>
          <p>
            Honest marking keeps the levels right for your child. &quot;Not yet&quot; is not a failure: the app will bring that item back
            more often until it sticks.
          </p>
          <p>In sentences, tap only the words read wrongly. Press and hold a word to hear it (it counts as helped).</p>
        </Section>

        <Section title="Little and often">
          <ul className="list-disc pl-5 space-y-1">
            <li>10–15 minutes a day, 5 days a week beats one long session.</li>
            <li>Mix 2–3 missions per day, e.g. Sounds → Blend → Sentences.</li>
            <li>Stop while it&apos;s still going well. End on something they can do.</li>
            <li>Praise effort and strategy (&quot;you sounded it out!&quot;), not just right answers.</li>
          </ul>
        </Section>

        <Section title="Common difficulties for Malaysian children">
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <b>a</b> and <b>e</b> sound alike in Malaysian English (pat / pet, man / men). Listen and repeat these pairs often.
            </li>
            <li>
              Final sounds get dropped (cat → ca&apos;). Ask for the last sound clearly: c-a-<b>t</b>.
            </li>
            <li>
              Letter names vs sounds: in Malay, letters mostly say their names when reading. In English, we read with sounds, so
              &quot;cat&quot; is not &quot;see-ay-tee&quot;.
            </li>
            <li>
              <b>Knowing the meaning matters.</b> If your child reads a word but doesn&apos;t know it, explain it in Malay. The pictures help.
            </li>
          </ul>
        </Section>

        <Section title="If your child is stuck">
          <ul className="list-disc pl-5 space-y-1">
            <li>Use rounds of 5 cards instead of 10–15.</li>
            <li>Go back to Sounds for a few days: blending only works when sounds are instant.</li>
            <li>Check the Progress page for red sounds and practise just those.</li>
            <li>If several weeks pass with little progress, talk to the class teacher; some children need extra support at school.</li>
          </ul>
        </Section>
      </div>
    </div>
  )
}
