# 1BTC=1BTC.money

A meditative web app that generates philosophical analogies about **1 BTC = 1 BTC** — the idea that Bitcoin should be understood as its own unit of account, not through the lens of fiat conversion. Each analogy is ephemeral unless you choose to immortalize it on-chain as an NFT for 1,000 sats.

> *A river doesn't ask how many buckets it equals. It simply flows — complete, indivisible, and certain of its own depth. One bitcoin knows what it is.*

Built with Next.js 15, Coinbase OnchainKit, wagmi/viem, and Anthropic Claude. Deployed on Base.

## How It Works

1. **Generate** — Claude produces a brief philosophical analogy drawn from 99 thematic domains (nature, physics, mathematics, philosophy, human experience)
2. **Reflect** — The text is ephemeral by default. Browse minted and unminted thoughts in the gallery
3. **Mint** — Immortalize a thought as a fully on-chain SVG NFT for 1,000 sats (dynamically priced via Chainlink oracles)
4. **Upvote** — One vote per wallet per token, stored on-chain. Gallery sorts by top or newest
5. **Collect** — Share to X, trade on OpenSea

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React, CSS Modules |
| Wallet | Coinbase OnchainKit, wagmi, viem |
| AI | Anthropic Claude Sonnet 4.5 |
| Chain | Base (ERC-721 with on-chain SVG metadata) |
| Oracles | Chainlink cbBTC/USD + ETH/USD price feeds |
| Database | MongoDB (unminted analogy storage) |
| Contract | Solidity, Foundry |
| Analytics | Plausible (self-hosted, privacy-focused) |

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn (PnP — no `node_modules`)
- [Foundry](https://book.getfoundry.sh/) (for contract development)

### Install & Run

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create a `.env` file:

```
NEXT_PUBLIC_ONCHAINKIT_API_KEY=     # Coinbase API key for OnchainKit
NEXT_PUBLIC_PROJECT_NAME=           # App title in metadata
NEXT_PUBLIC_CONTRACT_ADDRESS=       # Deployed contract address
NEXT_PUBLIC_DEPLOY_BLOCK=           # Block number at contract deployment
ANTHROPIC_API_KEY=                  # Claude API key for analogy generation
MONGODB_URI=                        # MongoDB connection string
NEXT_PUBLIC_PLAUSIBLE_HOST=         # (Optional) Self-hosted Plausible analytics URL
```

### Commands

```bash
yarn dev        # Development server at http://localhost:3000
yarn build      # Production build
yarn start      # Start production server
yarn lint       # ESLint
```

### Contract

```bash
cd contracts
forge build                                                      # Compile
forge test                                                       # Run tests
forge script script/Deploy.s.sol --rpc-url <RPC> --broadcast --verify  # Deploy
```

## Smart Contract

`OnebtcOnebtc.sol` — ERC-721 with fully on-chain SVG metadata. Analogy text is stored in contract storage and rendered as a self-contained SVG — no IPFS, no external dependencies.

- **Dynamic pricing** — 1,000 sats converted to ETH via Chainlink cbBTC/USD and ETH/USD feeds
- **On-chain art** — SVG with logo, analogy text, and 4 randomized orbital ellipses (seeded by `keccak256(tokenId)`)
- **Upvoting** — One vote per wallet per token, stored on-chain
- **Royalties** — 25% ERC-2981 on secondary sales
- **Security** — Reentrancy guard, oracle staleness checks (1hr), input validation (1-1000 chars), excess ETH refunds

## Architecture

```
app/
  layout.tsx            # Server component — metadata, fonts, Plausible script
  providers.tsx         # Client — OnchainKit + CDS ThemeProvider
  page.tsx              # Main page — hero, generate, mint, galleries
  api/
    generate/           # POST — Claude analogy generation (rate limited: 1 req/IP/3s)
    analogies/          # GET — unminted analogies from MongoDB
    analogies/[id]/mint # POST — mark analogy as minted with txHash + tokenId
    og/[tokenId]        # GET — dynamic OG image for NFT sharing
  nft/[tokenId]/        # NFT page with OG metadata for social sharing
components/             # Client components (gallery, mint, upvote, wallet, modal, etc.)
hooks/                  # useGallery, useMintPrice, useUpvote
lib/                    # Contract config, constants, MongoDB, analytics
contracts/              # Foundry project — Solidity contract + tests + deploy scripts
```

### Data Flow

1. **Generate**: User clicks Generate → `/api/generate` → Claude API → analogy text + MongoDB save → display
2. **Mint**: MintButton → `useMintPrice()` for dynamic price → contract `mint(analogy)` → decode `AnalogyMinted` event → update MongoDB
3. **Gallery (minted)**: `useGallery()` → contract events via chunked `eth_getLogs` (1000-block windows) → sort/paginate
4. **Gallery (unminted)**: `/api/analogies` from MongoDB → display with compact mint buttons
5. **NFT viewer**: Gallery card click → `NftModal` → `tokenURI()` → decode base64 JSON → render SVG

## License

MIT
