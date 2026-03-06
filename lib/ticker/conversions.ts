export interface TickerItem {
  value: string;
  unit: string;
  tooltip: string;
  category: "live" | "historical" | "absurd" | "punchline";
}

export interface ConversionDef {
  unit: string;
  tooltip: string;
  category: "live" | "historical" | "absurd";
  compute: (btcUsd: number) => number;
}

// --- Live Market Conversions ---
// Unit prices are hardcoded for MVP; only BTC/USD is fetched live.
export const liveConversions: ConversionDef[] = [
  {
    unit: "cows",
    tooltip: "Based on today's CME live cattle futures",
    category: "live",
    compute: (btc) => btc / 2500,
  },
  {
    unit: "oz gold",
    tooltip: "The original 'sound money'",
    category: "live",
    compute: (btc) => btc / 2400,
  },
  {
    unit: "Big Macs",
    tooltip: "The Economist's favorite unit of account",
    category: "live",
    compute: (btc) => btc / 5.69,
  },
  {
    unit: "barrels of oil",
    tooltip: "Based on today's WTI crude price",
    category: "live",
    compute: (btc) => btc / 72,
  },
  {
    unit: "gallons of milk",
    tooltip: "Based on USDA national average",
    category: "live",
    compute: (btc) => btc / 4.35,
  },
  {
    unit: "Costco hot dogs",
    tooltip: "The hot dog price hasn't changed since 1985",
    category: "live",
    compute: (btc) => btc / 1.5,
  },
  {
    unit: "oz silver",
    tooltip: "Historically, 'a day's wage'",
    category: "live",
    compute: (btc) => btc / 32,
  },
  {
    unit: "acres of US farmland",
    tooltip: "Based on USDA national average farmland value",
    category: "live",
    compute: (btc) => btc / 4800,
  },
];

// --- Historical / Fixed Conversions ---
// These reference historical units of money and exchange.
export const historicalConversions: ConversionDef[] = [
  {
    unit: "Roman legionary annual salaries",
    tooltip: "A Roman legionary earned ~225 denarii per year",
    category: "historical",
    compute: (btc) => btc / 2000,
  },
  {
    unit: "cowrie shells",
    tooltip: "The world's oldest and most widespread currency",
    category: "historical",
    compute: (btc) => btc / 0.008,
  },
  {
    unit: "tulip bulbs (1637 peak)",
    tooltip: "At the peak of the mania, one bulb bought a canal house",
    category: "historical",
    compute: (btc) => btc / 13500,
  },
  {
    unit: "knight's ransoms (c. 1200)",
    tooltip: "The going rate to free a captured knight, c. 1200",
    category: "historical",
    compute: (btc) => btc / 120000,
  },
  {
    unit: "beaver pelts",
    tooltip: "Official currency of the Hudson's Bay Company",
    category: "historical",
    compute: (btc) => btc / 2,
  },
  {
    unit: "rai stones",
    tooltip: "Too heavy to move, so ownership was tracked socially — sound familiar?",
    category: "historical",
    compute: (btc) => btc / 300000,
  },
  {
    unit: "salt bars",
    tooltip: "The word 'salary' comes from the Latin 'salarium' — salt money",
    category: "historical",
    compute: (btc) => btc / 1.5,
  },
];

// --- Absurd / Philosophical Conversions ---
export const absurdConversions: ConversionDef[] = [
  {
    unit: "days of heartbeats",
    tooltip: "Your heart doesn't price its beats in dollars either",
    category: "absurd",
    compute: (btc) => btc / 385, // ~$385 per day at global median wage
  },
  {
    unit: "lightning bolts",
    tooltip: "Each one carries about 1 billion joules",
    category: "absurd",
    compute: (btc) => btc / 0.53,
  },
  {
    unit: "bananas",
    tooltip: "The universal scale reference (banana for scale)",
    category: "absurd",
    compute: (btc) => btc / 0.25,
  },
  {
    unit: "full moons",
    tooltip: "664 years of moonrise",
    category: "absurd",
    compute: (btc) => btc / 12.18, // ~$12.18 per lunar cycle at global median
  },
  {
    unit: "grains of rice",
    tooltip: "Enough to fill a small room",
    category: "absurd",
    compute: (btc) => btc / 0.0004,
  },
  {
    unit: "% of all Unix time",
    tooltip: "Bitcoin is younger than Unix time, but it might outlast it",
    category: "absurd",
    // Percentage of seconds since Unix epoch that BTC price represents
    compute: () => {
      const secondsSinceEpoch = Math.floor(Date.now() / 1000);
      return (1 / secondsSinceEpoch) * 100 * 1e9; // scaled for readability
    },
  },
  {
    unit: "hours of human labor",
    tooltip: "15 years of full-time work at the global median wage",
    category: "absurd",
    compute: (btc) => btc / 3.1,
  },
  {
    unit: "copies of the Bitcoin whitepaper",
    tooltip: "The whitepaper costs almost nothing. Its idea is priceless.",
    category: "absurd",
    compute: (btc) => btc / 0.9, // 9 pages × $0.10/page
  },
];
