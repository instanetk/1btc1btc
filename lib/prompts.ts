export const ANALOGY_SYSTEM_PROMPT = `You are a philosopher-poet of sound money. You generate brief, elegant analogies that help people internalize the concept "1 BTC = 1 BTC" — the idea that Bitcoin is its own unit of account and should not be measured against fiat currencies.

Your analogies should:
- Be 2–4 sentences, evocative but accessible
- Never mention specific fiat prices, dollar amounts, or market caps
- Convey that BTC is a self-referential, absolute measure — like a kilogram is a kilogram, an hour is an hour
- AVOID clichéd metaphors: no rivers, oceans, lighthouses, north stars, mountains, anchors, or compasses. Find unexpected territory.`;

const DOMAIN_ROSTER = [
  "Draw your analogy from pure mathematics or geometry — axioms, primes, proofs, topology, fixed points.",
  "Draw your analogy from music theory — tuning, resonance, intervals, tempo, harmonics.",
  "Draw your analogy from cooking or fermentation — recipes, reduction, bread, salt, aging.",
  "Draw your analogy from childhood or memory — play, first words, learning to count, bedtime.",
  "Draw your analogy from astronomy or cosmology — pulsars, redshift, constants, orbits, dark matter.",
  "Draw your analogy from language or linguistics — grammar, mother tongues, etymology, tautology.",
  "Draw your analogy from games — chess, dice, rules, scoring systems, play itself.",
  "Draw your analogy from the human body — heartbeat, breath, circadian rhythm, bone, blood.",
  "Draw your analogy from architecture or materials — foundations, load-bearing walls, concrete curing, keystones.",
  "Draw your analogy from theater or performance — a monologue, an entrance, silence on stage, the fourth wall.",
  "Draw your analogy from mapmaking or navigation — coordinates, datums, projections, the concept of 'here'.",
  "Draw your analogy from time — clocks, seasons, geological epochs, the present moment.",
  "Draw your analogy from color theory or optics — wavelengths, primary colors, prisms, perception.",
  "Draw your analogy from friendship or love — recognition, trust, a handshake, a name.",
  "Draw your analogy from software or logic — identity functions, checksums, hash functions, return values.",
  "Draw your analogy from botany or mycology — root systems, mycorrhizal networks, seeds, annual rings.",
  "Draw your analogy from smell or taste — terroir, petrichor, umami, sense memory.",
  "Draw your analogy from textiles or craft — weaving, thread count, a knot, dyeing, patina.",
];

export function getAnalogyUserPrompt(): string {
  const domain = DOMAIN_ROSTER[Math.floor(Math.random() * DOMAIN_ROSTER.length)];
  return `Generate one analogy for "1 BTC = 1 BTC."\n\n${domain}`;
}
