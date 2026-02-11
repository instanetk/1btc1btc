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
  
    // New categories
    "Draw your analogy from metallurgy — tempering, annealing, grain structure, alloying, fatigue limits.",
    "Draw your analogy from carpentry or joinery — dovetails, grain direction, true square, leveling, shims.",
    "Draw your analogy from ceramics or glassmaking — kiln curves, vitrification, glaze chemistry, stress fractures.",
    "Draw your analogy from sculpting or stonework — chiseling, negative space, load paths, weathering, polish.",
    "Draw your analogy from photography — exposure, focal length, depth of field, contrast, dynamic range.",
    "Draw your analogy from filmmaking or editing — cuts, continuity, frame rate, montage, long takes.",
    "Draw your analogy from typography or bookmaking — kerning, leading, margins, ligatures, binding.",
    "Draw your analogy from calligraphy or handwriting — stroke order, pressure, rhythm, flourish, legibility.",
    "Draw your analogy from acoustics or signal processing — noise floor, signal-to-noise ratio, phase, filtering, aliasing.",
    "Draw your analogy from electricity — voltage, current, resistance, grounding, circuit integrity.",
    "Draw your analogy from mechanical systems — torque, inertia, bearings, tolerances, friction.",
    "Draw your analogy from control systems — feedback loops, gain, stability margins, oscillation, set points.",
    "Draw your analogy from thermodynamics — entropy, phase change, equilibrium, heat flow, irreversibility.",
    "Draw your analogy from fluid dynamics — laminar flow, turbulence, pressure gradients, viscosity, drag.",
    "Draw your analogy from chemistry — stoichiometry, catalysts, activation energy, equilibrium constants, pH.",
    "Draw your analogy from biology or evolution — selection pressure, adaptation, niche, mutation, fitness landscapes.",
    "Draw your analogy from ecology — carrying capacity, trophic webs, succession, resilience, collapse.",
    "Draw your analogy from medicine or diagnostics — baseline vitals, biomarkers, dosage, prognosis, differential diagnosis.",
    "Draw your analogy from immunology — memory cells, tolerance, autoimmunity, antibodies, response thresholds.",
    "Draw your analogy from psychology — conditioning, attention, bias, reinforcement, cognitive load.",
    "Draw your analogy from neuroscience — synapses, plasticity, firing thresholds, pattern recognition, homeostasis.",
    "Draw your analogy from education or pedagogy — scaffolding, spaced repetition, mastery, transfer, misconceptions.",
    "Draw your analogy from law — precedent, jurisdiction, burden of proof, standing, due process.",
    "Draw your analogy from ethics — duties, consequences, virtues, tradeoffs, moral hazard.",
    "Draw your analogy from economics — scarcity, marginal utility, incentives, externalities, opportunity cost.",
    "Draw your analogy from accounting — ledgers, debits and credits, reconciliation, accruals, audit trails.",
    "Draw your analogy from insurance or risk — underwriting, tail risk, deductibles, premiums, adverse selection.",
    "Draw your analogy from logistics or supply chains — bottlenecks, lead times, throughput, inventory buffers, last mile.",
    "Draw your analogy from transportation — timetables, right of way, routing, congestion, reliability.",
    "Draw your analogy from aviation or sailing — heading, trim, lift, drift, dead reckoning.",
    "Draw your analogy from seismology or geology — fault lines, plate drift, subduction, uplift, deep time.",
    "Draw your analogy from weather and climate — pressure systems, fronts, anomalies, seasonality, long-term trends.",
    "Draw your analogy from oceanography — currents, salinity, thermoclines, tides, gyres.",
    "Draw your analogy from agriculture — crop rotation, soil fertility, irrigation, harvest cycles, seed stock.",
    "Draw your analogy from urban planning — zoning, infrastructure, density, public goods, walkability.",
    "Draw your analogy from diplomacy or geopolitics — alliances, deterrence, nonalignment, signaling, spheres of influence.",
    "Draw your analogy from military strategy — logistics, attrition, force multipliers, terrain, command intent.",
    "Draw your analogy from religion or ritual — liturgy, covenant, pilgrimage, sacred calendars, vows.",
    "Draw your analogy from mythology — archetypes, trials, tricksters, fate, heroic returns.",
    "Draw your analogy from archaeology — strata, context, artifacts, dating methods, lost layers.",
    "Draw your analogy from genealogy — lineage, inheritance, branches, namesakes, ancestral memory.",
    "Draw your analogy from social networks — bridges, clusters, weak ties, contagion, centrality.",
    "Draw your analogy from negotiation — anchors, BATNA, concessions, framing, commitment.",
    "Draw your analogy from entrepreneurship — product-market fit, moat, burn rate, runway, compounding trust.",
    "Draw your analogy from craftsmanship economics — quality control, rework, tolerances, warranties, reputation.",
    "Draw your analogy from cybersecurity — threat models, attack surfaces, signatures, zero trust, key rotation.",
    "Draw your analogy from cryptography — one-way functions, nonces, signatures, collision resistance, key ownership.",
    "Draw your analogy from distributed systems — consensus, fault tolerance, partitions, finality, liveness.",
    "Draw your analogy from networks or internet routing — packets, latency, hops, congestion control, reliability.",
    "Draw your analogy from data science — baselines, variance, outliers, priors, confidence intervals.",
    "Draw your analogy from machine learning — training signals, overfitting, generalization, loss landscapes, calibration.",
    "Draw your analogy from product design — affordances, constraints, defaults, feedback, usability.",
    "Draw your analogy from service design — queues, touchpoints, handoffs, failure modes, recovery paths.",
    "Draw your analogy from fashion — silhouette, tailoring, drape, timeless pieces, seasonal trends.",
    "Draw your analogy from jewelry or watchmaking — precision, tolerances, movement, hallmarking, heirloom value.",
    "Draw your analogy from sports — rules of play, conditioning, cadence, scoring, game theory.",
    "Draw your analogy from martial arts — stance, balance, timing, leverage, disciplined repetition.",
    "Draw your analogy from mountaineering — acclimatization, fixed ropes, weather windows, summit fever, safe descent.",
    "Draw your analogy from diving — buoyancy, pressure, decompression, visibility, bottom time.",
    "Draw your analogy from survival skills — firecraft, shelter, water purification, redundancy, calm under stress.",
    "Draw your analogy from hospitality — host-guest trust, consistency, service standards, ambience, return visits.",
    "Draw your analogy from perfumery — top notes, drydown, accords, fixatives, projection.",
    "Draw your analogy from coffee or tea — extraction, grind, steep time, roast profile, terroir.",
    "Draw your analogy from baking science — hydration ratios, proofing, crumb structure, oven spring, caramelization.",
    "Draw your analogy from brewing or distillation — mash bills, cuts, maturation, barrels, proof.",
    "Draw your analogy from comedy — setup, tension, timing, misdirection, callback.",
    "Draw your analogy from poetry — meter, enjambment, refrain, image systems, compression.",
    "Draw your analogy from storytelling — stakes, conflict, arc, foreshadowing, resolution.",
    "Draw your analogy from dance — posture, tempo, partner trust, form, improvisation.",
    "Draw your analogy from sculpture in motion — balance, center of mass, gesture, stillness, release."
  ];

export function getAnalogyUserPrompt(): { prompt: string; domain: string } {
  const entry = DOMAIN_ROSTER[Math.floor(Math.random() * DOMAIN_ROSTER.length)];
  // Extract clean domain label: "Draw your analogy from <domain> — ..."
  const match = entry.match(/^Draw your analogy from (.+?)\s*[—\-]/);
  const domain = match ? match[1].trim() : "general";
  const prompt = `Generate one analogy for "1 BTC = 1 BTC."\n\n${entry}`;
  return { prompt, domain };
}
