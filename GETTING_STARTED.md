# Getting Started

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

## Development

Start the development server:
```bash
npm run dev
```

This will:
- Start Vite dev server on http://localhost:3000
- Open the game in your browser automatically
- Enable hot module replacement for instant updates

## Build

Create a production build:
```bash
npm run build
```

The built files will be in the `dist/` directory.

## Preview Production Build

Preview the production build locally:
```bash
npm run preview
```

## Project Structure

```
src/
  graphics/          # Graphics system (palette, renderer, sprites)
  managers/          # Game managers (game loop, score, etc.)
  entities/          # Game entities (player, enemies, projectiles)
  systems/           # Game systems (input, collision, spawning)
  scenes/            # Game scenes (menu, gameplay, game over)
  main.ts            # Entry point
```

## Current Status

✅ Phase 1 Complete:
- Project setup with TypeScript + Vite
- Billionaire Mindset color palette
- Pixel-perfect renderer
- Encoded sprite system
- Basic game loop
- All enemy type sprites (Dollar Bills, Diamonds, Coins, Haters)
- Player sprite

## Next Steps

Phase 2: Core Gameplay Systems
- Implement player movement
- Add weapon systems
- Create enemy entities
- Implement collision detection

