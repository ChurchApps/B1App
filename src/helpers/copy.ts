// Voice / tone dictionary for user-facing CTA copy.
//
// SCAFFOLD ONLY — no admin UI yet. Every church currently resolves to "standard"
// because nothing populates `voice` on the config. To activate per-church voice:
//
//   1. Add a `voice` field to globalStyles.palette JSON (formal | standard | casual).
//   2. In Theme.tsx, expose it via React context (e.g. `useChurchVoice()`).
//   3. Pass `useChurchVoice()` into `cta(key, voice)` at call sites.
//
// Today, components call `cta("key")` and the default voice gives the same
// strings the codebase used before — so this is a literal-string-extraction
// pass, no behavior change.

export type Voice = "formal" | "standard" | "casual";

type CopyEntry = Record<Voice, string>;

const dictionary: Record<string, CopyEntry> = {
  // Mobile dashboard / hero CTAs
  heroExploreSubtext: {
    formal: "Select to continue",
    standard: "Tap to explore",
    casual: "Tap in →"
  },
  // Donation page
  giveHeroPrompt: {
    formal: "Support the ministry",
    standard: "Make a Difference Today",
    casual: "Pitch in today"
  },
  giveHeroBody: {
    formal: "Your contributions sustain our mission and serve our community.",
    standard: "Your generosity helps us continue our mission and support our community.",
    casual: "Your gifts keep the lights on and the mission going."
  },
  giveCta: {
    formal: "Contribute",
    standard: "Give Now",
    casual: "Give"
  },
  giveRepeat: {
    formal: "Repeat contribution",
    standard: "Repeat",
    casual: "Again"
  },
  // Generic empty-state CTAs
  exploreCommunityCta: {
    formal: "Browse the community",
    standard: "Explore Community",
    casual: "Find your people"
  }
};

export const cta = (key: string, voice: Voice = "standard"): string => {
  const entry = dictionary[key];
  if (!entry) return key;
  return entry[voice] ?? entry.standard;
};
