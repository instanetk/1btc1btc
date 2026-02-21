# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

1BTC1BTC is a Next.js 15 app where users generate AI-powered philosophical analogies about "1 BTC = 1 BTC" and mint them as fully on-chain SVG NFTs on Base. Built with Coinbase OnchainKit, wagmi/viem, and Anthropic Claude for generation. MongoDB stores unminted analogies; the contract is the source of truth for minted NFTs.

## Commands

```bash
yarn dev      # Start development server at http://localhost:3000
yarn build    # Production build
yarn start    # Start production server
yarn lint     # ESLint (next/core-web-vitals + next/typescript)
```

### Contract (Foundry)

```bash
cd contracts
forge build   # Compile Solidity
forge test    # Run test suite
forge script script/Deploy.s.sol --rpc-url <RPC> --broadcast --verify  # Deploy
```

Package manager is **Yarn with PnP** (Plug'n'Play) — no `node_modules` directory. Dependencies resolve through `.pnp.cjs`.

## Environment Variables

Set in `.env`:
- `NEXT_PUBLIC_ONCHAINKIT_API_KEY` — Coinbase API key for OnchainKit
- `NEXT_PUBLIC_PROJECT_NAME` — app title in metadata
- `NEXT_PUBLIC_CONTRACT_ADDRESS` — deployed contract address
- `NEXT_PUBLIC_DEPLOY_BLOCK` — block number at contract deployment (gallery queries start here to avoid scanning full chain)
- `ANTHROPIC_API_KEY` — Claude API key for analogy generation
- `MONGODB_URI` — MongoDB connection string
- `BTC_USD_FEED` / `ETH_USD_FEED` — optional Chainlink feed overrides for Deploy.s.sol (defaults to Base Mainnet feeds)

## Architecture

### App Router Structure

```
layout.tsx (Server Component — metadata, fonts, global CSS)
  └─ providers.tsx (Client — OnchainKitProvider + CDS ThemeProvider)
       └─ page.tsx (Client — hero, generate, mint, galleries)
```

### API Routes

- **`POST /api/generate`** — generates analogy via Claude Sonnet 4.5, picks random domain from 99 categories, saves to MongoDB. Rate limited: 1 req/IP/3s.
- **`GET /api/analogies`** — fetches unminted analogies from MongoDB (latest 50).
- **`POST /api/analogies/[id]/mint`** — marks analogy as minted in MongoDB with minter address, txHash, tokenId.

### Data Flow

1. **Generate**: User clicks Generate → `/api/generate` → Claude API → analogy text + MongoDB save → display
2. **Mint**: MintButton → `useMintPrice()` for dynamic price → contract `mint(analogy)` with 2% buffer → decode `AnalogyMinted` event for tokenId → POST `/api/analogies/[id]/mint`
3. **Gallery (minted)**: `useGallery()` hook → contract `AnalogyMinted` + `Upvoted` events via chunked `eth_getLogs` (1000-block windows) → sort/paginate
4. **Gallery (unminted)**: Fetch `/api/analogies` from MongoDB → display with compact mint buttons
5. **NFT viewer**: Click gallery card → `NftModal` → `tokenURI()` → decode base64 JSON → extract SVG data URI → render

## Contract (`contracts/src/OnebtcOnebtc.sol`)

ERC721 with fully on-chain SVG metadata. Inherits Ownable2Step (two-step ownership transfer), Pausable, and ReentrancyGuard. Key functions:

| Function | Description |
|---|---|
| `mint(string analogy)` | Payable. Dynamic price via Chainlink oracles. Pausable, reentrancy guard, oracle staleness check (1hr), input validation (1-1000 chars). Refunds excess. |
| `upvote(uint256 tokenId)` | One vote per wallet per token. |
| `getMintPriceInEth()` | Converts 10,000 sats → USD → ETH using Chainlink BTC/USD and ETH/USD feeds. Enforces price bounds (0.001–1 ETH) to guard against oracle malfunction. |
| `tokenURI(uint256 tokenId)` | Returns base64 JSON data URI with embedded base64 SVG. SVG includes logo, analogy text, 4 randomized orbital ellipses (seeded by `keccak256(tokenId)`), token number, branding. |
| `withdraw()` | Owner-only ETH withdrawal. Emits `Withdrawn` event. |
| `pause()` / `unpause()` | Owner-only emergency controls to halt/resume minting. |

Events: `AnalogyMinted(uint256 indexed tokenId, address indexed minter, string analogy)`, `Upvoted(uint256 indexed tokenId, address indexed voter)`, `Withdrawn(address indexed to, uint256 amount)`.

ERC2981 royalties: 10% to deployer on secondary sales.

Chainlink feeds (Base Mainnet): cbBTC/USD `0x07DA...9f9D`, ETH/USD `0x7104...0de9`.

## Components

| Component | Purpose |
|---|---|
| `Gallery` | Minted NFT grid. Uses `useGallery()`. Sort toggle (top/newest), pagination (9/page). |
| `GalleryCard` | Single minted card. Shows analogy, minter identity (OnchainKit `Identity`/`Avatar`/`Name`), mint number, upvote button. Click opens `NftModal`. |
| `NftModal` | Fullscreen modal. Fetches `tokenURI` from contract, decodes SVG, renders artwork. Shows minter identity, `UpvoteButton`, OpenSea "Buy" link. |
| `GeneratedGallery` | Unminted analogies from MongoDB. Paginated. |
| `GeneratedCard` | Unminted card with domain label and compact mint button. |
| `MintButton` | Handles wallet check → price fetch → contract write → event decode → API update. States: idle/pending/confirming/minted. |
| `UpvoteButton` | Small outline button with triangle icon + count. Checks `hasVoted` via contract. Optimistic count update. |
| `ConnectButton` | Shows "Connect Wallet" or truncated address. Click toggles connection. |
| `WalletModal` | Lists available wallet connectors (MetaMask, Coinbase Wallet, etc). Auto-closes on connect. |
| `AnalogyDisplay` | Shows generated analogy text with loading spinner and placeholder states. |
| `GenerateButton` | Triggers `/api/generate`. Loading state. |
| `GallerySortToggle` | Two-button toggle for Top/Newest sort. |
| `OrbitalBackground` | Canvas animation: 7 elliptical orbits, 40 stars, radial glow. Respects `prefers-reduced-motion`. |

## Hooks

| Hook | Purpose |
|---|---|
| `useGallery()` | Fetches `AnalogyMinted` + `Upvoted` events in 1000-block chunks. Returns sorted, paginated `GalleryItem[]` with tokenId, analogy, minter, upvotes. |
| `useMintPrice()` | Reads `getMintPriceInEth()` from contract. Auto-refreshes every 30s. Returns `priceInWei` and `priceInETH`. |
| `useUpvote(tokenId, address)` | Reads `hasVoted`, writes `upvote()`. Returns `hasVoted`, `isPending`, `isSuccess`, `upvote()`. |

## Key Libraries

- `@coinbase/onchainkit` — wallet UI, Identity/Avatar/Name components, provider
- `wagmi` — React hooks: `useAccount`, `useWriteContract`, `useReadContract`, `useWaitForTransactionReceipt`, `usePublicClient`
- `viem` — `parseAbiItem`, `decodeEventLog`, `formatEther`, chain definitions
- `@tanstack/react-query` — data fetching cache (wagmi dependency)
- `@anthropic-ai/sdk` — Claude API for analogy generation (server-side only)
- `mongoose` — MongoDB ODM for analogy records

## Conventions

- Path alias: `@/*` maps to project root (`tsconfig.json`)
- All components are `"use client"`. Only `layout.tsx` is a server component.
- CSS Modules for component styles, global styles in `globals.css`
- Design tokens: `--color-bg: #0A0A0A`, `--color-text: #F5F0E8`, `--color-accent: #F7931A` (Bitcoin orange), `--color-text-muted: #666`, `--color-border: #1A1A1A`
- Cards: dark semi-transparent (`rgba(0,0,0,0.6)`), subtle white borders, 12px radius
- Modals: fixed backdrop with blur, centered with slide-up animation, z-index 200
- Buttons: upvote/buy use matching style (`padding: 4px 8px`, `border-radius: 6px`, `border: 1px solid #E5E5E5`)
- Responsive: mobile-first, breakpoints at 480px/640px/960px, grid auto-adjusts 1→2→3 columns
- Webpack externals in `next.config.ts` for `pino-pretty`, `lokijs`, `encoding`
- ESLint: unused variables prefixed with `_` are allowed
- Contract ABI in `lib/contract.ts` is a minimal subset — only functions/events used by the frontend
- Chain config centralized in `lib/constants.ts` (`CHAIN`, `CHAIN_ID`) — all files import from there
- RPC limit: Coinbase RPC caps `eth_getLogs` at 1000 blocks per request — `useGallery` chunks accordingly
- `NftModal` uses `<img>` (not `next/image`) for base64 SVG data URIs — eslint-disable is intentional
- MongoDB connection uses global singleton pattern for serverless connection pooling (`lib/mongodb.ts`)
