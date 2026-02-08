import { base } from "wagmi/chains";

export const CHAIN = base;
export const CHAIN_ID = base.id; // 8453

// Contract address — updated after deployment
export const CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`) ??
  "0x0000000000000000000000000000000000000000";

// Chainlink price feed addresses on Base Mainnet
export const CHAINLINK_ETH_USD_FEED =
  "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70" as const;
export const CHAINLINK_CBBTC_USD_FEED =
  "0x07DA0E54543a844a80ABE69c8A12F22B3aA59f9D" as const;

// Mint cost in satoshis
export const MINT_COST_SATS = 1000;

// Royalty basis points (25%)
export const ROYALTY_BPS = 2500;
