# 1BTC=1BTC.money

A meditative web app that generates philosophical analogies about **1 BTC = 1 BTC** — the idea that Bitcoin should be understood as its own unit of account, not through the lens of fiat conversion. Each analogy is ephemeral unless you choose to immortalize it on-chain as an NFT for 10,000 sats.

> *A river doesn't ask how many buckets it equals. It simply flows — complete, indivisible, and certain of its own depth. One bitcoin knows what it is.*

Built with Next.js 15, Coinbase OnchainKit, wagmi/viem, and Anthropic Claude. Deployed on Base.

## How It Works

1. **Generate** — Claude produces a brief philosophical analogy drawn from 99 thematic domains (nature, physics, mathematics, philosophy, human experience)
2. **Reflect** — The text is ephemeral by default. Browse minted and unminted thoughts in the gallery
3. **Mint** — Immortalize a thought as a fully on-chain SVG NFT for 10,000 sats (dynamically priced via Chainlink oracles)
4. **Upvote** — One vote per wallet per token, stored on-chain. Gallery sorts by top or newest
5. **Collect** — Share to X, trade on OpenSea

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React, CSS Modules |
| Wallet | Coinbase OnchainKit, wagmi, viem |
| AI | Anthropic Claude Sonnet 4.6 |
| Chain | Base (ERC-721 with on-chain SVG metadata) |
| Oracles | Chainlink cbBTC/USD + ETH/USD price feeds |
| Database | MongoDB (analogies, gallery, notification tokens, sync state) |
| Contract | Solidity, Foundry |
| Analytics | Matomo (self-hosted, privacy-focused) |

## Getting Started

### Prerequisites

- Node.js 20+
- Yarn (node-modules linker)
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
# Public (exposed to the browser)
NEXT_PUBLIC_ONCHAINKIT_API_KEY=     # Coinbase API key for OnchainKit
NEXT_PUBLIC_PROJECT_NAME=           # App title in metadata
NEXT_PUBLIC_CONTRACT_ADDRESS=       # Deployed contract address
NEXT_PUBLIC_DEPLOY_BLOCK=           # Block at deployment (sync/backfill start point)
NEXT_PUBLIC_SITE_URL=               # Canonical site URL (notification deep links)
NEXT_PUBLIC_MATOMO_URL=             # (Optional) Self-hosted Matomo analytics URL

# Server-only
ANTHROPIC_API_KEY=                  # Claude API key for analogy generation
MONGODB_URI=                        # MongoDB connection string
BASE_RPC_URL=                       # (Recommended) Base RPC for server reads + chain sync
NOTIFICATION_TRIGGER_SECRET=        # Bearer secret for POST /api/notifications/trigger
CRON_SECRET=                        # Bearer secret for POST /api/cron/sync
```

> `BASE_RPC_URL` falls back to the public `https://mainnet.base.org`, which is
> rate-limited and caps `eth_getLogs` at 1000 blocks. Use a dedicated RPC in
> production so the chain sync and OG image rendering stay reliable.

### Commands

```bash
yarn dev        # Development server at http://localhost:3000
yarn build      # Production build
yarn start      # Start production server
yarn lint       # ESLint
yarn backfill   # Reconcile the MongoDB gallery from on-chain events
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

- **Dynamic pricing** — 10,000 sats converted to ETH via Chainlink cbBTC/USD and ETH/USD feeds
- **On-chain art** — SVG with logo, analogy text, and 4 randomized orbital ellipses (seeded by `keccak256(tokenId)`)
- **Upvoting** — One vote per wallet per token, stored on-chain
- **Royalties** — 10% ERC-2981 on secondary sales
- **Security** — Ownable2Step ownership, Pausable minting, reentrancy guard, oracle staleness checks (1hr) + price bounds, input validation (1-1000 chars), excess ETH refunds

## Architecture

```
app/
  layout.tsx              # Server component — metadata, fonts, Matomo script
  providers.tsx           # Client — OnchainKit + CDS ThemeProvider
  (main)/page.tsx         # Main page — hero, generate, mint, galleries
  (main)/nft/[tokenId]/   # NFT page with OG metadata for social sharing
  (frame)/frame/          # Farcaster mini-app frames (feed + per-token)
  api/
    generate/             # POST — Claude analogy generation (rate limited via MongoDB)
    analogies/            # GET — unminted analogies from MongoDB
    analogies/[id]/mint   # POST — record a mint (verified on-chain before write)
    gallery/              # GET — minted gallery from MongoDB (sort/paginate)
    gallery/upvote/       # POST — sync a token's upvote count from the contract
    ticker/               # GET — BTC price ticker + latest NFT
    webhook/              # POST — Farcaster notification token webhook (signed)
    notifications/trigger # POST — manually fire weekly notifications (bearer auth)
    cron/sync             # POST — run/repair the chain sync (bearer auth)
    og/[tokenId]          # GET — OG image rendered from the on-chain SVG
    og/feed/[tokenId]     # GET — OG image rendered from MongoDB (contract fallback)
components/               # Client components (gallery, mint, upvote, wallet, modal, etc.)
hooks/                    # useGallery, useMintPrice, useUpvote, useTickerData, ...
lib/
  models/                # Mongoose models (Analogy, NotificationToken, SyncState, RateLimit)
  notifications/          # Chain sync, weekly scheduler, Farcaster send
  server/                # Shared chain client, sharp config, rate limiter, auth, mem logger
  ...                    # Contract config, constants, MongoDB, prompts, analytics
instrumentation.ts       # Starts background jobs (chain sync, scheduler, memory logger)
contracts/               # Foundry project — Solidity contract + tests + deploy scripts
```

### Data Flow

1. **Generate**: User clicks Generate → `/api/generate` (per-IP + global rate limit) → Claude API → analogy text + MongoDB save → display
2. **Mint**: MintButton → `useMintPrice()` for dynamic price → contract `mint(analogy)` → decode `AnalogyMinted` → `POST /api/analogies/[id]/mint`, which **verifies the tx on-chain** before recording the minter/tokenId
3. **Gallery (minted)**: `useGallery()` → `/api/gallery` (MongoDB) → sort/paginate. MongoDB is kept in step with the contract by the [chain sync](#background-jobs--sync)
4. **Gallery (unminted)**: `/api/analogies` from MongoDB → display with compact mint buttons
5. **Upvote**: `useUpvote()` → contract `upvote(tokenId)` → `POST /api/gallery/upvote`, which sets the count from the **authoritative on-chain value** (never a client-supplied delta)
6. **NFT viewer**: Gallery card click → `NftModal` → `tokenURI()` → decode base64 JSON → render SVG

## Background Jobs & Sync

Background work runs in-process, started from `instrumentation.ts` when the server boots (Node runtime only):

- **Chain sync** (`lib/notifications/chainSync.ts`) — every 60s, scans new contract events in ≤1000-block chunks from a **cursor persisted in MongoDB** (`SyncState`), so it survives restarts and never replays or skips events. It:
  - reconciles minted NFTs into MongoDB (so the gallery shows them even if the client's post-mint update never landed),
  - sets each token's upvote count to the authoritative on-chain value, and
  - sends upvote + milestone notifications to minters (rate-limited 1/hr).
- **Notification scheduler** (`node-cron`) — weekly "top thought" and "absurd conversion" pushes.
- **Memory logger** — periodic `rss`/heap logging for OOM diagnostics.

### Manual operations

```bash
# Full reconcile: rebuild gallery + upvote counts from the deploy block (no notifications)
curl -XPOST https://<host>/api/cron/sync \
  -H "Authorization: Bearer $CRON_SECRET" -d '{"full":true}'

# One-off incremental sync
curl -XPOST https://<host>/api/cron/sync \
  -H "Authorization: Bearer $CRON_SECRET" -d '{}'

# Trigger weekly notifications manually
curl -XPOST https://<host>/api/notifications/trigger \
  -H "Authorization: Bearer $NOTIFICATION_TRIGGER_SECRET" -d '{"type":"weekly-top"}'
```

`yarn backfill` performs the same reconcile from a local shell.

## Deployment

Containerized via a multi-stage `Dockerfile` and shipped to a droplet by GitHub Actions (CI builds and pushes the image to GHCR; the deploy workflow pulls it and runs `docker compose up -d`).

- **glibc base (`node:20-slim`)** — required so `sharp`'s native libvips binary matches the runtime. (An Alpine/musl base caused steady memory retention under OG-image load.)
- **Memory containment** — `docker-compose.yml` sets `mem_limit` + `NODE_OPTIONS=--max-old-space-size` and `MALLOC_ARENA_MAX=2`, so memory pressure recycles the container instead of OOM-killing the host.
- **OG images** — `sharp` is configured with `cache(false)` + `concurrency(1)` (`lib/server/sharp.ts`) to bound peak memory.

## License

MIT
