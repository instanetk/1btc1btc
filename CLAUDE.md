# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

1btc1btc is a Next.js 15 web application built with Coinbase's OnchainKit for blockchain interactions on the Base network. Bootstrapped with `create-onchain`.

## Commands

```bash
yarn dev      # Start development server at http://localhost:3000
yarn build    # Production build
yarn start    # Start production server
yarn lint     # ESLint (next/core-web-vitals + next/typescript)
```

Package manager is **Yarn with PnP** (Plug'n'Play) — no `node_modules` directory. Dependencies resolve through `.pnp.cjs`.

## Environment Variables

Set in `.env`:
- `NEXT_PUBLIC_ONCHAINKIT_API_KEY` — required for OnchainKit functionality (Coinbase API key)
- `NEXT_PUBLIC_PROJECT_NAME` — app title used in metadata

## Architecture

Next.js App Router with the provider pattern:

```
layout.tsx (Server Component)
  └─ RootProvider (Client) — wraps app with OnchainKitProvider
       └─ page.tsx (Client) — main UI with Wallet component
```

- **`app/rootProvider.tsx`** — configures `OnchainKitProvider` with Base chain, auto theme mode, and modal wallet display. All OnchainKit/wagmi context flows from here.
- **`app/page.tsx`** — client component (`"use client"`) rendering the Wallet connector and landing content.
- **`app/layout.tsx`** — server component handling metadata, Google Fonts (Inter, Source Code Pro), and global CSS.

Key dependencies: `@coinbase/onchainkit` (UI components + provider), `wagmi` (React hooks for Ethereum), `viem` (TypeScript Ethereum library), `@tanstack/react-query`.

## Conventions

- Path alias: `@/*` maps to project root (configured in `tsconfig.json`)
- CSS Modules for component styles (`page.module.css`), global styles in `globals.css`
- Dark mode supported via `prefers-color-scheme` in CSS
- Webpack externals configured in `next.config.ts` for `pino-pretty`, `lokijs`, `encoding` (Node.js module compatibility)
- ESLint: unused variables prefixed with `_` are allowed
