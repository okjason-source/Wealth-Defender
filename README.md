# 🎮 Wealth Defender - Billionaire Mindset

A classic arcade shoot 'em up game inspired by Round 42, featuring 8-bit pixel art graphics and a billionaire-themed twist. Defend your wealth through 42 challenging rounds!

![Wealth Defender](https://img.shields.io/badge/Status-Playable-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Vite](https://img.shields.io/badge/Vite-5.0-purple)

## 🎯 Features

- **42 Unique Rounds** - Progressive difficulty with unique enemy patterns
- **8-Bit Pixel Art** - Retro aesthetic with encoded sprites (zero external assets)
- **Billionaire Theme** - Fight against Dollar Bills, Diamonds, Coins, and Haters
- **AI Bot** - Watch an AI learn and master the game (press `B` to toggle)
- **Rapid Fire Combat** - Short, fast projectiles for intense action
- **Pause System** - Take a break anytime (press `P` or `Escape`)
- **High Score Tracking** - Compete with yourself using localStorage

## 🎮 Controls

| Action | Key |
|--------|-----|
| Move | Arrow Keys or WASD |
| Auto-fire | Spacebar (hold) |
| Targeting Laser | Z key or Left Click |
| Pause | P or Escape |
| Toggle Bot | B |
| Master Bot | M (instantly max bot skills) |

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/okjason-source/Wealth-Defender.git
cd Wealth-Defender

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

The game will open at `http://localhost:3000`

### Build

```bash
# Create production build
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## 📦 Project Structure

```
wealth-defender/
├── src/
│   ├── entities/          # Game entities (player, enemies, projectiles)
│   ├── graphics/          # Rendering system (palette, renderer, sprites)
│   ├── managers/          # Game managers (game loop, state)
│   ├── systems/           # Game systems (input, collision, spawning, bot)
│   └── main.ts            # Entry point
├── dist/                  # Production build (generated)
├── index.html             # HTML entry point
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite configuration
```

## 🎨 Game Mechanics

### Enemy Types

- **💰 Coins** - Fast, numerous swarms (10 points)
- **💵 Dollar Bills** - Wing-shaped formations (25 points)
- **💎 Diamonds** - Durable, defensive clusters (50 points)
- **😠 Haters** - Aggressive, strategic attackers (100 points)

### Scoring

- Destroy enemies to earn points
- Complete rounds for bonus points
- Beat your high score!

### Lives & Progression

- Start with 3 lives
- Lose a life when hit by enemies or projectiles
- Complete all 42 rounds to win!

## 🤖 Bot AI System

The game includes an advanced AI bot that learns and improves:

- **Fast Learning Mode** - 25x faster skill progression (enabled by default)
- **Adaptive Skills** - Reaction speed, avoidance, and positioning improve over time
- **Master Mode** - Press `M` to instantly max bot skills
- **Performance Tracking** - Bot learns from each game session

The bot's progress is saved to localStorage and persists between sessions.

## 🛠️ Technology Stack

- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **HTML5 Canvas** - Pixel-perfect rendering
- **Zero Dependencies** - No external game frameworks
- **Encoded Graphics** - All sprites embedded in code

## 📝 Development

### Key Features Implemented

- ✅ 42 rounds with unique enemy patterns
- ✅ Player movement and shooting
- ✅ Collision detection
- ✅ Particle effects
- ✅ Round progression system
- ✅ Lives and scoring
- ✅ High score tracking
- ✅ Pause functionality
- ✅ AI bot with learning system
- ✅ Bonus maze rounds

### Future Enhancements

- 🎵 Audio system (background music & sound effects)
- 🎯 Main menu and settings
- 📊 Online leaderboards
- 💪 Power-up system
- 👾 Boss battles

## 🌐 Deployment

### GitHub Pages

1. Update `vite.config.ts` with your repository name:
```typescript
export default defineConfig({
  base: '/Wealth-Defender/', // Matches repository name
  // ... rest of config
});
```

2. Build the project:
```bash
npm run build
```

3. Deploy the `dist/` folder to GitHub Pages

### Other Platforms

The game can be deployed to:
- **Netlify** - Drag and drop `dist/` folder
- **Vercel** - Connect GitHub repo for auto-deployment
- **Any static hosting** - Upload `dist/` folder contents

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Inspired by the classic arcade game **Round 42** (1986)
- Built with modern web technologies while preserving retro aesthetics
- All graphics are programmatically generated (no external assets)

## 📧 Contact

For questions, suggestions, or contributions, please open an issue on GitHub.

---

**Enjoy defending your wealth! 💰🎮**
