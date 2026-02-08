# 1BTC1BTC.money — Mini PRD

## Vision

A meditative, single-page web app that generates ephemeral philosophical analogies about the concept **1 BTC = 1 BTC** — the idea that Bitcoin should be understood as its own unit of account, not through the lens of fiat conversion. Each analogy is fleeting unless the user chooses to immortalize it onchain as an NFT for 1,000 SATS.

---

## Core User Flow

```
[Land → Browse Gallery] → [Connect Wallet] → [Generate Analogy] → [Read / Reflect] → [Mint or Let Go] → [Upvote Others]
```

1. **Land on page** — The hero section shows the generate action, but directly below it the **Gallery** displays previously minted analogies sorted by most upvoted. This immediately communicates what the app is about, provides social proof, and gives visitors a reason to stay even before generating their own.
2. **Gallery** — A masonry or vertical card layout of minted analogies. Each card shows the analogy text, mint # (token ID), minter's ENS/address (via OnchainKit `<Identity>`), and an **upvote count** with a vote button. Sorted by upvotes (descending) by default, with an option to sort by "newest." Upvoting requires a connected wallet (one vote per wallet per NFT, stored onchain).
3. **Generate** — An LLM produces a brief (2–4 sentence) analogy or philosophical description of "1 BTC = 1 BTC." The text appears with a subtle fade-in animation in the hero section.
4. **Ephemeral by default** — The generated text is not stored anywhere. If the user navigates away or generates a new one, it's gone forever. A gentle visual cue (e.g., a slow dissolve timer or sand-falling motif) reinforces impermanence.
5. **Mint** — If the user connects their wallet and clicks "Mint this thought," the analogy is minted as an onchain NFT. Cost: **1,000 SATS** (dynamically priced via Chainlink oracle). The contract enforces a **25% resale royalty** (ERC-2981). After minting, the new NFT appears at the top of the Gallery in the "newest" sort.
6. **Upvote** — Connected wallets can upvote any minted analogy (one vote per wallet per token). Upvotes are stored onchain in the contract for permanence and verifiability. The Gallery re-sorts in real time.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 14+ (App Router)** | Standard for OnchainKit |
| Onchain SDK | **OnchainKit by Coinbase** | Wallet connect, identity, transaction components |
| Chain | **Base** (Coinbase L2) | Low fees, OnchainKit native support |
| Smart Contract | **Solidity (ERC-721 + ERC-2981)** | NFT with royalty enforcement |
| LLM Provider | **Anthropic API (Claude)** | Analogy generation via server-side route |
| Styling | **Coinbase Design System (CDS)** `@coinbase/cds-web` | Replaces Tailwind. Cross-platform React components, ThemeProvider with custom dark theme, atomic CSS with zero runtime overhead |
| Metadata Storage | **Fully onchain** (base64 SVG) | Self-contained, no external dependencies |
| Gallery Data | **Viem event logs** (MVP) | Read `AnalogyMinted` + `Upvoted` events from contract; V2 upgrade path to a subgraph |

---

## Smart Contract Spec

### `OnebtcOnebtc.sol` (ERC-721 + ERC-2981 + Chainlink + Upvotes)

```
- name: "1BTC=1BTC"
- symbol: "ONEBTC"
- MINT_COST_SATS: 1000 (constant)
- royaltyBps: 2500 (25%)
- royaltyRecipient: deployer / treasury address
- priceFeed: Chainlink AggregatorV3Interface (BTC/ETH on Base)

Storage:
- mapping(uint256 => string) public analogies;         // tokenId → analogy text
- mapping(uint256 => uint256) public upvotes;           // tokenId → vote count
- mapping(uint256 => mapping(address => bool)) public hasVoted; // prevent double-voting
- uint256 public totalSupply;                            // auto-incrementing token ID

Functions:
- getMintPriceInETH() → view, returns current ETH cost of 1000 SATS
- mint(string calldata analogy) → payable, public
  - Reads Chainlink oracle for BTC/ETH price
  - Calculates ETH equivalent of 1000 SATS
  - Requires msg.value >= calculated price (with 1% tolerance)
  - Stores analogy text in mapping
  - Mints ERC-721 token
  - Refunds excess ETH
- upvote(uint256 tokenId) → public
  - Requires wallet connected (msg.sender != 0)
  - Requires !hasVoted[tokenId][msg.sender]
  - Increments upvotes[tokenId]
  - Sets hasVoted[tokenId][msg.sender] = true
  - Emits Upvoted(tokenId, msg.sender) event
- getAnalogy(uint256 tokenId) → view, returns analogy text
- getUpvotes(uint256 tokenId) → view, returns vote count
- tokenURI(uint256 tokenId) → view, returns base64-encoded JSON with embedded SVG
- royaltyInfo() → ERC-2981 standard (25% to treasury)
- withdraw() → owner only, withdraw accumulated ETH

Events:
- AnalogyMinted(uint256 indexed tokenId, address indexed minter, string analogy)
- Upvoted(uint256 indexed tokenId, address indexed voter)

Max supply: unlimited (each mint is unique generative text)
```

---

## LLM Prompt (Server-Side — `/api/generate`)

```
System:
You are a philosopher-poet of sound money. You generate brief, elegant 
analogies that help people internalize the concept "1 BTC = 1 BTC" — 
the idea that Bitcoin is its own unit of account and should not be 
measured against fiat currencies.

Your analogies should:
- Be 2–4 sentences, evocative but accessible
- Draw from nature, physics, mathematics, philosophy, or human experience
- Never mention specific fiat prices, dollar amounts, or market caps
- Convey that BTC is a self-referential, absolute measure — like 
  a kilogram is a kilogram, an hour is an hour
- Vary widely in metaphor and tone (sometimes cosmic, sometimes intimate,
  sometimes mathematical, sometimes playful)
- Never repeat yourself

User:
Generate one analogy for "1 BTC = 1 BTC."
```

**Example output:**
> *A river doesn't ask how many buckets it equals. It simply flows — complete, indivisible, and certain of its own depth. One bitcoin knows what it is.*

---

## UI Design Prompt

Use this prompt with an AI design/code generation service to produce the frontend:

```
Design a single-page web application called "1BTC=1BTC.money" using 
Coinbase Design System (CDS) as the component library.

SETUP:
- Install: @coinbase/cds-web, @coinbase/cds-icons
- Import global styles:
    import '@coinbase/cds-icons/fonts/web/icon-font.css'
    import '@coinbase/cds-web/globalStyles'
- Wrap app in <ThemeProvider> with a CUSTOM dark theme and 
  <MediaQueryProvider>
- All CDS components must be client components ("use client")

CUSTOM THEME:
Create a custom CDS theme extending defaultTheme with these overrides:
- Background primary: #0A0A0A
- Background secondary: #111111 (gallery cards)
- Foreground primary: #F5F0E8 (warm off-white text)
- Foreground secondary: #666666 (muted text)
- Accent / positive color: #F7931A (Bitcoin orange) — used for mint 
  button, upvote active state, and subtle highlights
- Border color: #1A1A1A
- activeColorScheme: "dark"

TYPOGRAPHY:
- Use CDS <Text> component throughout with font prop variants:
  - Title: font="title1" for the hero analogy text
  - Headers: font="title3" for section headers like "Minted Thoughts"
  - Body: font="body" for gallery card text
  - Caption: font="caption" for minter addresses, token IDs
- For the "1 BTC = 1 BTC" header, use <Text font="title3"> with 
  letter-spacing override via style prop and uppercase transform.
  Keep it small, whisper-like.
- The hero analogy text should feel large and contemplative — use 
  font="title1" centered, max-width 640px

CDS COMPONENT MAPPING:
- Layout: <VStack>, <HStack>, <Box>, <Grid>, <GridColumn> for 
  all structural layout. No raw divs unless necessary.
- Buttons:
  - "Generate": <Button variant="secondary"> (ghost-like appearance)
  - "Mint this thought · 1000 SATS": <Button variant="positive"> 
    styled with Bitcoin orange background. Wraps OnchainKit 
    <Transaction> internally.
  - Upvote: <IconButton> with a custom arrow-up icon
- Cards: <ContentCard> with <ContentCardBody> for each gallery NFT
- Sort toggle: <SegmentedTabs> with "Top" and "Newest" options
- Spacing: Use CDS gap, padding, and spacer props (numeric scale) 
  instead of arbitrary pixel values
- Text: <Text> for all typography — never raw <p> or <span>
- Feedback: <Spinner> for loading states during generation and 
  gallery fetch
- Toast: <Toast> for mint success confirmation
- Divider: <Divider> between hero section and gallery

LAYOUT (single page, scrollable):

HERO SECTION (100vh, vertically centered using VStack):
1. Title: <Text font="title3"> "1 BTC = 1 BTC" — uppercase, 
   letterspaced, small, centered
2. Generated analogy: <Text font="title1"> centered in a <Box> 
   with maxWidth 640px. Fade-in animation via CSS transitions.
   Placeholder when empty: "A thought awaits." in foregroundSecondary
3. Button row: <HStack gap={2}> containing:
   - <Button variant="secondary">Generate</Button>
   - <Button variant="positive">Mint this thought · 1000 SATS</Button>
     (only visible after generation)
4. Wallet: OnchainKit <ConnectWallet> positioned top-right via 
   absolute positioning in a <Box>
5. Background: #0A0A0A with a faint animated grain texture overlay 
   (CSS-based, not a CDS component)
6. Scroll hint: subtle downward chevron or <Text font="caption"> 
   "↓ Gallery"

GALLERY SECTION (below the fold):
7. Header row: <HStack> with <Text font="title3">"Minted Thoughts"</Text> 
   and <SegmentedTabs> for sort toggle ("Top" | "Newest")
8. Grid: <Grid> with responsive columns (1 mobile, 2 tablet, 3 desktop) 
   via useBreakpoints hook or GridColumn span props
9. Each card: <ContentCard> containing:
   - <ContentCardBody>:
     - <Text font="body"> for analogy text
     - <HStack> bottom row:
       - Minter identity via OnchainKit <Identity> (avatar + truncated 
         address) 
       - <Text font="caption"> mint number "#42"
       - <IconButton> upvote arrow with <Text font="caption"> count
   - Card background: bgSecondary (#111111)
   - Subtle hover: slight scale or border-color change
   - Bitcoin-orange upvote icon when user has voted
10. Empty state: <VStack> centered — <Text font="body" 
    color="foregroundSecondary">"No thoughts minted yet. Be the first."

INTERACTIONS:
- On "Generate" click: current text fades out (0.5s), <Spinner> briefly, 
  new text fades in (1.5s)
- On "Mint" click: OnchainKit transaction flow. On success, 
  <Toast variant="positive"> "This thought now lives forever onchain." 
  with block explorer link. Gallery refreshes.
- On "Upvote" click: OnchainKit transaction. On success, icon turns 
  Bitcoin-orange, count increments with subtle animation. Disabled if 
  already voted.
- If no wallet connected on Mint/Upvote, trigger wallet connection first.
- Sort toggle: <SegmentedTabs> re-sorts gallery with crossfade.

RESPONSIVE:
- Use CDS <MediaQueryProvider> and useBreakpoints hook
- Mobile: single column gallery, stacked buttons, smaller title font
- Tablet+: 2-3 column grid, horizontal button row

TECH CONSTRAINTS:
- Built with Next.js App Router + Coinbase CDS (@coinbase/cds-web) 
  + OnchainKit React components
- CDS components require "use client" directive
- ThemeProvider and MediaQueryProvider at app root (providers.tsx)
- All LLM calls happen server-side via /api/generate route
- No client-side API keys exposed
```

---

## File Structure

```
1btc1btc/
├── app/
│   ├── layout.tsx          # Root layout, CDS global styles, fonts
│   ├── page.tsx            # Main page (hero + gallery) — "use client"
│   ├── api/
│   │   └── generate/
│   │       └── route.ts    # LLM endpoint (Anthropic API call)
│   └── providers.tsx       # OnchainKit + Wagmi + CDS ThemeProvider + MediaQueryProvider
├── components/
│   ├── AnalogyDisplay.tsx  # Hero text display with fade animations (CDS <Text>, <Box>)
│   ├── GenerateButton.tsx  # <Button variant="secondary"> triggers /api/generate
│   ├── MintButton.tsx      # <Button variant="positive"> wrapping OnchainKit <Transaction>
│   ├── Gallery.tsx         # <Grid> of minted NFT cards, sorted by upvotes/newest
│   ├── GalleryCard.tsx     # <ContentCard> — analogy text, minter identity, upvote
│   ├── UpvoteButton.tsx    # <IconButton> onchain upvote via <Transaction>, shows count
│   ├── GallerySortToggle.tsx # CDS <SegmentedTabs> — "Top" and "Newest"
│   └── GrainOverlay.tsx    # CSS-based subtle background texture (not a CDS component)
├── contracts/
│   └── OnebtcOnebtc.sol    # ERC-721 + ERC-2981 + Chainlink + Upvotes
├── hooks/
│   ├── useGallery.ts       # Reads contract events to build gallery data
│   ├── useMintPrice.ts     # Reads current ETH price from contract
│   └── useUpvote.ts        # Upvote transaction logic
├── lib/
│   ├── constants.ts        # Contract address, ABI, chain config
│   ├── prompts.ts          # System prompt for analogy generation
│   ├── contract.ts         # Contract ABI + typed helpers
│   └── theme.ts            # Custom CDS theme (dark, Bitcoin-orange accent)
├── public/
│   └── og-image.png        # Social preview image
├── next.config.js
└── .env.local              # ANTHROPIC_API_KEY, NEXT_PUBLIC_ONCHAINKIT_API_KEY, etc.
```

---

## CDS Setup Reference

### Installation

```bash
npm install @coinbase/cds-web @coinbase/cds-icons
```

### `lib/theme.ts` — Custom Dark Theme

```ts
import { defaultTheme } from '@coinbase/cds-web/themes/defaultTheme';

export const onebtcTheme = {
  ...defaultTheme,
  colors: {
    ...defaultTheme.colors,
    // Override dark color scheme values
    dark: {
      ...defaultTheme.colors.dark,
      background: '#0A0A0A',
      backgroundSecondary: '#111111',
      foreground: '#F5F0E8',
      foregroundSecondary: '#666666',
      positive: '#F7931A',        // Bitcoin orange for accent/CTA
      border: '#1A1A1A',
    },
  },
};
```

> **Note:** The exact theme token structure should be verified against `cds.coinbase.com/getting-started/theming/` at build time, as CDS theme tokens may differ from the above shorthand. The intent is: dark background, warm off-white text, Bitcoin-orange accent mapped to the `positive` variant.

### `app/providers.tsx`

```tsx
'use client';
import { ThemeProvider, MediaQueryProvider } from '@coinbase/cds-web/system';
import { onebtcTheme } from '@/lib/theme';
// + OnchainKit providers (WagmiProvider, QueryClientProvider, etc.)

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MediaQueryProvider>
      <ThemeProvider theme={onebtcTheme} activeColorScheme="dark">
        {/* OnchainKit / Wagmi providers here */}
        {children}
      </ThemeProvider>
    </MediaQueryProvider>
  );
}
```

### `app/layout.tsx` — Global Styles

```tsx
import '@coinbase/cds-icons/fonts/web/icon-font.css';
import '@coinbase/cds-web/globalStyles';
// Do NOT import defaultFontStyles — we use the custom theme fonts

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### Key CDS Imports for Components

```tsx
// Layout
import { VStack, HStack, Box, Grid, GridColumn } from '@coinbase/cds-web/layout';
import { Divider } from '@coinbase/cds-web/layout';

// Typography
import { Text } from '@coinbase/cds-web/typography';

// Buttons
import { Button } from '@coinbase/cds-web/buttons';
import { IconButton } from '@coinbase/cds-web/buttons';

// Cards
import { ContentCard, ContentCardBody } from '@coinbase/cds-web/cards';

// Navigation
import { SegmentedTabs } from '@coinbase/cds-web/navigation';

// Feedback
import { Spinner } from '@coinbase/cds-web/feedback';
import { Toast } from '@coinbase/cds-web/overlay';

// Hooks
import { useBreakpoints } from '@coinbase/cds-web/hooks';
```

---

## Environment Variables

```env
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_ONCHAINKIT_API_KEY=...       # Coinbase Developer Platform key
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=1BTC1BTC
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...       # After deployment
NEXT_PUBLIC_CHAIN_ID=8453                # Base mainnet
```

---

## MVP Scope (What to Build First)

1. ✅ Next.js app with OnchainKit wallet connection on Base
2. ✅ `/api/generate` route calling Anthropic API (Claude Sonnet) with the system prompt
3. ✅ Hero section UI with generate + display + fade animations
4. ✅ Smart contract: ERC-721 with mint(string), upvote(uint256), Chainlink oracle pricing, ERC-2981 royalties at 25%, fully onchain metadata (base64 SVG)
5. ✅ Mint button wired to OnchainKit `<Transaction>` component
6. ✅ Gallery section: read minted NFTs from contract events, display sorted by upvotes (default) or newest
7. ✅ Upvote button wired to onchain transaction (one vote per wallet per token)
8. ✅ `useGallery` hook: index `AnalogyMinted` and `Upvoted` events to build gallery state
9. ⬜ Deploy contract to Base Sepolia (testnet) first, then mainnet

### Out of Scope (V2)

- Social sharing (generate OG image per analogy)
- Multiple language support
- Audio narration of analogies
- "Collect" existing mints from other users
- SATS-native payment (Lightning integration)
- Subgraph / indexer for faster gallery loading at scale
- **Semantic hashtags** — Use a second LLM call (or structured output from the first) to extract 3-5 thematic tags from each generated analogy (e.g. "#wine #scarcity #taste #1947"). Store tags off-chain in a KV store keyed by tokenId. Enable gallery filtering/grouping by tag. The generation domain (math, music, cooking, etc.) can serve as a coarse tag in the interim.

---

## Resolved Decisions

### 1. Payment denomination → Chainlink Oracle
Use a **Chainlink BTC/ETH price feed on Base** to dynamically calculate the ETH equivalent of 1,000 SATS at mint time. The contract reads the oracle, computes the price, and validates `msg.value` meets or exceeds it. This keeps the "1000 SATS" promise honest regardless of market movement.

**Implementation notes:**
- Chainlink BTC/ETH feed on Base: `0x64c911996D3c6aC71f9b455B1E8E7266BcbD848F` (verify at deploy time)
- Contract calculates: `mintPrice = (1000 * 1e18) / (btcEthPrice * 1e8)` (adjusted for decimals)
- Include a small tolerance buffer (~1%) for price movement between UI display and tx confirmation
- Add a `maxMintPrice` failsafe so users aren't overcharged if the oracle malfunctions
- The UI should display the current ETH cost dynamically, refreshing every ~30 seconds

### 2. Metadata storage → Fully Onchain
All analogy text is stored in a `mapping(uint256 => string)` inside the contract. The `tokenURI()` function returns a **base64-encoded JSON** with an embedded **base64-encoded SVG** that renders the analogy text in a styled visual format (dark background, serif font, Bitcoin orange accent).

**Rationale:** The texts are <500 bytes each, making gas costs negligible on Base L2. A project about self-referential truth shouldn't depend on external infrastructure. The NFT is fully self-contained and renderable anywhere — no IPFS pinning, no broken links, no dependencies.

**SVG template (generated by tokenURI):**
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">
  <rect width="800" height="800" fill="#0A0A0A"/>
  <text x="400" y="80" text-anchor="middle" fill="#F7931A" 
        font-family="sans-serif" font-size="18" letter-spacing="4">
    1 BTC = 1 BTC
  </text>
  <foreignObject x="80" y="200" width="640" height="500">
    <p xmlns="http://www.w3.org/1999/xhtml" 
       style="color:#F5F0E8; font-family:Georgia,serif; font-size:22px; 
              text-align:center; line-height:1.6;">
      {ANALOGY_TEXT}
    </p>
  </foreignObject>
  <text x="400" y="740" text-anchor="middle" fill="#333" 
        font-family="sans-serif" font-size="12">
    #{TOKEN_ID} · 1BTC1BTC.money
  </text>
</svg>
```

### 3. Royalty enforcement → ERC-2981 (simple)
Implement ERC-2981 only for MVP. Most major marketplaces (OpenSea, Blur, Coinbase NFT) honor it on Base. Operator Filter Registry can be added in V2 if needed.

### 4. LLM provider → Claude Sonnet (Anthropic)
Use **Claude Sonnet 4.5** (`claude-sonnet-4-5-20250929`) via the Anthropic API for analogy generation. Sonnet provides the poetic quality this project demands at reasonable cost (~$0.003/generation).

### 5. Testnet first → Yes
Deploy to **Base Sepolia** first for end-to-end testing, then migrate to Base mainnet.

---

## Remaining Open Questions

### 1. Treasury / royalty recipient
What wallet address should receive mint proceeds and 25% resale royalties?

### 2. Anthropic API key provisioning
Claude Code will need an `ANTHROPIC_API_KEY` in `.env.local`. Confirm you have one or need to create one at console.anthropic.com.

### 3. Coinbase Developer Platform key
OnchainKit requires a CDP API key. Confirm you have one or need to create one at portal.cdp.coinbase.com.

---

*PRD version: 0.1 · Created: February 2026 · Target: Claude Code execution*
