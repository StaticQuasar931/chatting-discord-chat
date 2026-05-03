// name-blocklist.js — Static Chat name moderation
// -----------------------------------------------------------------------
// BLOCKED_TERMS: any username containing one of these strings
//   (case-insensitive, non-alphanumeric stripped) will be rejected.
// APPROVED_ADJECTIVES / APPROVED_NOUNS: used to auto-generate safe
//   replacement usernames like "BrightArc" when a blocked name is found.
// -----------------------------------------------------------------------

export const BLOCKED_TERMS = [
  // Authority / impersonation
  "admin", "administrator", "mod", "moderator", "staff", "official",
  "support", "helpdesk", "staticteam", "staticstaff", "staticmod",
  "staticadmin", "staticofficial", "owner", "developer", "dev",

  // Slurs — add more as needed (keep lowercase, no spaces)
  "nigger", "nigga", "faggot", "retard", "tranny", "spic", "chink",
  "kike", "wetback",

  // Explicit content
  "sex", "porn", "nude", "nsfw", "xxx", "hentai",

  // Violence / threats
  "kill", "murder", "shoot", "bomb", "terrorist", "suicide",

  // Abuse / spam
  "hacker", "hack", "phishing", "phish", "scammer", "scam",
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
 * Returns a safe auto-generated username: "AdjNoun" (e.g. "BrightArc").
 * Guaranteed to not contain any blocked term.
 */
export function generateSafeName() {
  for (let i = 0; i < 20; i++) {
    const adj  = APPROVED_ADJECTIVES[Math.floor(Math.random() * APPROVED_ADJECTIVES.length)];
    const noun = APPROVED_NOUNS[Math.floor(Math.random() * APPROVED_NOUNS.length)];
    const name = adj.charAt(0).toUpperCase() + adj.slice(1) +
                 noun.charAt(0).toUpperCase() + noun.slice(1);
    if (!isNameBlocked(name)) return name;
  }
  return "CozyCloud"; // ultimate fallback
}
