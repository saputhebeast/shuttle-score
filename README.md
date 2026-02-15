# 🏸 Shuttle Score — Badminton Score Tracker

A fast, mobile-first badminton score tracker built with Next.js. Track scores, sets, serves, and match history — all from your phone's browser.

## Features

- **Tap to score** — Big, mobile-friendly tap targets
- **Official rules** — 21 points, 2-point lead, 30-point cap
- **Set tracking** — Best of 3 or Best of 5
- **Serve indicator** — Always know who's serving
- **Undo support** — Accidentally tapped? No problem
- **Match point / Deuce alerts** — Visual indicators for critical moments
- **Match history** — Review past matches
- **PWA** — Add to home screen, works offline
- **Wake Lock** — Screen stays on during the game
- **Haptic feedback** — Feel each tap register

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Package Manager:** pnpm
- **Hosting:** Vercel

## Getting Started

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Build for production
pnpm build
```

Open [http://localhost:3000](http://localhost:3000) on your phone (same Wi-Fi network) to start tracking.

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Vercel auto-detects Next.js — just click **Deploy**
4. Share the URL with your team!

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout with PWA meta
│   └── page.tsx            # Main page (game orchestrator)
├── components/
│   ├── scoreboard/         # Scoreboard components
│   │   ├── score-board.tsx # Main scoreboard container
│   │   ├── team-score.tsx  # Individual team score panel
│   │   ├── set-indicator.tsx # Set progress display
│   │   └── game-controls.tsx # Undo, new game, timer
│   ├── new-game-modal.tsx  # New game setup screen
│   └── match-history.tsx   # Past matches display
├── hooks/
│   ├── use-game.ts         # Main game state hook
│   ├── use-local-storage.ts # localStorage persistence
│   └── use-wake-lock.ts    # Screen wake lock
└── lib/
    ├── types.ts            # TypeScript type definitions
    ├── constants.ts        # Game rules & config
    └── game-engine.ts      # Pure scoring logic
```

## Badminton Rules Implemented

| Rule | Implementation |
|------|---------------|
| Win a set | First to 21 points |
| Deuce | Must lead by 2 points after 20-20 |
| Score cap | First to 30 wins (no 2-point lead needed) |
| Match | Best of 3 or Best of 5 sets |
| Serve | Winner of the rally serves next |
