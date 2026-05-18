// name-blocklist.js — Static Chat name moderation
// -----------------------------------------------------------------------
// BLOCKED_TERMS: any username containing one of these strings
//   (case-insensitive, non-alphanumeric stripped) will be rejected.
// SLUR_TERMS: words auto-blurred in SFW/Edgy-OK chats (per-user blur setting).
// APPROVED_ADJECTIVES / APPROVED_NOUNS: used to auto-generate safe
//   replacement usernames like "BrightArc52" when a blocked name is found.
// -----------------------------------------------------------------------

export const BLOCKED_TERMS = [
  // Authority / impersonation
  "admin", "administrator", "mod", "moderator", "staff", "official",
  "support", "helpdesk", "staticteam", "staticstaff", "staticmod",
  "staticadmin", "staticofficial", "owner", "developer", "dev",
  "system", "bot", "autobot", "announcement", "verify", "verification",
  "discord", "static", "staticchat",

  // Slurs — usernames only (keep lowercase, no spaces)
  "nigger", "nigga", "faggot", "retard", "tranny", "spic", "chink",
  "kike", "wetback", "gook", "beaner", "cracker", "honky", "coon",
  "jigaboo", "sandnigger", "towelhead", "raghead", "slant",

  // Explicit content
  "sex", "porn", "nude", "nsfw", "xxx", "hentai", "onlyfans",
  "cumslut", "cumshot", "blowjob", "handjob", "dildo", "penis",
  "vagina", "boobs", "tits", "ass", "pussy", "cunt", "cock",

  // Violence / threats
  "kill", "murder", "shoot", "bomb", "terrorist", "suicide",
  "massacre", "genocide",

  // Abuse / spam / scam
  "hacker", "hack", "phishing", "phish", "scammer", "scam",
  "giveaway", "nitro", "freevbucks", "freerobux", "clickhere",

  // Real people / historical figures
  "hitler", "hitlerr", "adolf", "hitleer", "hltler",
  "trump", "biden", "obama", "epstein", "putin",
  "mussolini", "stalin", "mao",

  // Misc inappropriate
  "kkk", "nazi", "naz1", "nsdap", "swastika",
  "pedo", "pedophile", "nonce", "groomer",
];

export const APPROVED_ADJECTIVES = [
  "amber", "azure", "bold", "brave", "bright", "calm", "clever", "cool",
  "cozy", "crisp", "daring", "dawn", "deep", "digital", "dusk", "early",
  "epic", "fast", "fierce", "fluffy", "fresh", "frosty", "gentle", "glad",
  "gleam", "golden", "grand", "happy", "hazy", "high", "icy", "jade",
  "keen", "kind", "laser", "lavender", "lean", "light", "lively", "lunar",
  "lush", "magic", "misty", "moonlit", "neon", "nimble", "noble", "north",
  "oak", "ocean", "onyx", "open", "pastel", "peak", "pixel", "plain",
  "plum", "polar", "proud", "quick", "quiet", "radiant", "rapid", "rare",
  "retro", "rosy", "royal", "ruby", "sage", "sandy", "scarlet", "serene",
  "sharp", "shiny", "silver", "sky", "smooth", "snow", "solar", "sonic",
  "speedy", "starry", "steel", "still", "storm", "sunny", "swift", "teal",
  "tidy", "tiny", "turbo", "ultra", "vast", "velvet", "vibrant", "violet",
  "vivid", "warm", "wild", "windy", "wise", "zesty", "zippy",
];

export const APPROVED_NOUNS = [
  "arc", "atlas", "aurora", "axe", "bay", "beam", "bear", "bird", "bloom",
  "bolt", "breeze", "bridge", "brook", "byte", "canyon", "cape", "cedar",
  "chip", "circuit", "cliff", "cloud", "coast", "comet", "cove", "creek",
  "crown", "current", "dawn", "delta", "dome", "drift", "dune", "echo",
  "edge", "ember", "falcon", "field", "flame", "flash", "flint", "flow",
  "flux", "fog", "forge", "fox", "frost", "gale", "gate", "gem", "glade",
  "glow", "grove", "gulf", "harbor", "haven", "hawk", "hill", "horizon",
  "hue", "isle", "jade", "jay", "key", "kite", "lake", "lance", "leaf",
  "lens", "light", "link", "lynx", "maple", "marsh", "mast", "meadow",
  "mesa", "mist", "moon", "moss", "mountain", "nexus", "node", "nova",
  "oak", "orbit", "otter", "owl", "path", "peak", "pine", "pixel", "plain",
  "planet", "plume", "pond", "pool", "port", "pulse", "quartz", "quest",
  "rain", "rapids", "ray", "reef", "ridge", "rift", "river", "rook",
  "root", "rover", "run", "sage", "sail", "sand", "seed", "shore",
  "signal", "sky", "slate", "slope", "smoke", "snow", "spark", "spring",
  "star", "stem", "stone", "storm", "stream", "summit", "surf", "swift",
  "tide", "timber", "torch", "trail", "tree", "vale", "valley", "vine",
  "void", "wave", "willow", "wing", "wolf", "wood", "wren", "zone",
];

/**
 * Returns true if `username` contains any blocked term.
 * Strips non-alphanumeric chars and compares lowercased.
 */
export function isNameBlocked(username) {
  if (!username) return false;
  const clean = username.toLowerCase().replace(/[^a-z0-9]/g, "");
  return BLOCKED_TERMS.some(term =>
    clean.includes(term.replace(/[^a-z0-9]/g, ""))
  );
}

/**
 * SLUR_TERMS: words auto-blurred in SFW chats when a user has "Auto Blur Slurs" on.
 * Separate from BLOCKED_TERMS — these are allowed in Edgy/Anything Goes chats
 * but blurred visually in SFW chats per user's filter setting.
 */
export const SLUR_TERMS = [
  // Racial slurs
  "nigger", "nigga", "n-word", "nword", "faggot", "fag",
  "retard", "tard", "tranny", "spic", "chink", "gook",
  "kike", "wetback", "beaner", "coon", "jigaboo",
  "sandnigger", "towelhead", "raghead", "slant",
  "honky", "cracker", "whitey",
  // Sexual slurs
  "cunt", "whore", "slut", "skank",
  // Ableist
  "autist", "autistic", // only when used as insult
];

/**
 * Returns a safe auto-generated username like "BrightArc52" or "FrostyOwlDawn".
 * Randomly uses 2 or 3 word parts and sometimes appends 2–4 random digits.
 * Guaranteed to not contain any blocked term.
 */
export function generateSafeName() {
  for (let i = 0; i < 30; i++) {
    const useThreeWords = Math.random() < 0.35;
    const addNumbers    = Math.random() < 0.6;

    const adj  = APPROVED_ADJECTIVES[Math.floor(Math.random() * APPROVED_ADJECTIVES.length)];
    const noun = APPROVED_NOUNS[Math.floor(Math.random() * APPROVED_NOUNS.length)];
    const cap  = s => s.charAt(0).toUpperCase() + s.slice(1);

    let name = cap(adj) + cap(noun);
    if (useThreeWords) {
      const extra = APPROVED_ADJECTIVES[Math.floor(Math.random() * APPROVED_ADJECTIVES.length)];
      name = cap(adj) + cap(extra) + cap(noun);
    }
    if (addNumbers) {
      const digits = Math.floor(Math.random() * 9000) + 10; // 10–9999
      name += digits;
    }

    if (name.length <= 32 && !isNameBlocked(name)) return name;
  }
  return "CozyCloud42"; // ultimate fallback
}
