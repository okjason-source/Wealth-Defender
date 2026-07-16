# 🎮 Wealth Defender - Billionaire Mindset

A classic arcade shoot 'em up game inspired by Round 42, featuring 8-bit pixel art graphics and a billionaire-themed twist. Defend your wealth through 50 challenging rounds!

![Wealth Defender](https://img.shields.io/badge/Status-Playable-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Vite](https://img.shields.io/badge/Vite-5.0-purple)

## 🎯 Features

- **50 Unique Rounds** - Progressive difficulty with unique enemy patterns and formations
- **8-Bit Pixel Art** - Retro aesthetic with encoded sprites (zero external assets)
- **Billionaire Theme** - Shoot down Dollar Bills, Diamonds, Coins, Haters, and Brains
- **Lightning Laser System** - Destroy multiple enemies instantly with powerful lightning attacks
- **Bonus Maze Rounds** - Navigate through maze-like courses to collect extra lives and lasers
- **AI Bot** - Watch an AI learn and master the game with adaptive learning (press `B` to toggle)
- **Rapid Fire Combat** - Short, fast projectiles for intense action
- **Particle Effects** - Explosive visual feedback with neon-colored particles
- **Audio System** - Procedural sound generation with support for custom base64-encoded audio
- **PWA Support** - Installable Progressive Web App with offline capabilities
- **Pause System** - Take a break anytime (press `P` or `Escape`)
- **High Score Tracking** - Compete with yourself using localStorage

## 🎮 Controls

| Action | Key |
|--------|-----|
| Move | Arrow Keys or WASD |
| Auto-fire | Spacebar (hold) |
| Lightning Laser | Z key or Left Click |
| Pause | P or Escape |
| Toggle Bot | B |
| Toggle Master Level | M (toggles bot between master level and defaults) |
| Toggle Sound | L |
| Restart (Game Over/Victory) | Space, Enter, or R |

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
│   ├── audio/             # Audio system (audioManager, base64 encoding guide)
│   ├── entities/          # Game entities (player, enemies, projectiles, particles)
│   ├── graphics/          # Rendering system (palette, renderer, sprites)
│   ├── managers/          # Game managers (game loop, state)
│   ├── systems/           # Game systems (input, collision, spawning, bot, bonusMaze)
│   └── main.ts            # Entry point
├── public/                # Static assets (icons, manifest, service worker)
├── dist/                  # Production build (generated)
├── index.html             # HTML entry point
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite configuration
```

## 🎨 Game Mechanics

### Enemy Types

- **💰 Coins** - Fast, numerous swarms (10 points, 1 health)
- **💵 Dollar Bills** - Wing-shaped formations with animated flapping (25 points, 2 health)
- **💎 Diamonds** - Durable, defensive clusters with sparkling animation (50 points, 3 health)
- **😠 Haters** - Aggressive, strategic attackers (100 points, 2 health)
- **🧠 Brains** - Advanced enemies with wave movement patterns and flickering animation (75 points, 4 health)

### Enemy Behavior

- **Line Formations** - Enemies move in coordinated lines with various patterns
- **Breakaway Attacks** - Enemies can break from formations to attack directly
- **Progressive Difficulty** - Enemy speed, shooting frequency, and breakaway chances increase with cycles
- **Strategic AI** - Enemies adapt their behavior based on player position
- **Shooting Enemies** - From cycle 2 onwards, enemies can shoot projectiles at the player

### Weapons

- **Auto-fire Cannon** - Rapid-fire projectiles that shoot straight up (hold Spacebar)
- **Lightning Laser** - Powerful weapon that instantly destroys all enemies within range (Z key or Left Click)
  - Starts with 5 lasers
  - Can destroy multiple enemies simultaneously
  - Creates spectacular lightning visual effects
  - Earn "FLOCKED!" achievement for destroying 20+ enemies with one laser

### Scoring

- Destroy enemies to earn points based on type
- Complete rounds for bonus points (round number × 100)
- Bonus maze rounds award 500 points for completion
- Beat your high score!

### Lives & Progression

- Start with 3 lives
- Lose a life when hit by enemies or projectiles
- Collect extra lives in bonus maze rounds
- Complete all 50 rounds to win!
- Invincibility frames after respawning

### Bonus Rounds

- Triggered after rounds 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, and 48
- Navigate through maze-like obstacle courses
- Collect free lives (10 before round 28, 15 after)
- Collect laser pickups (10 before round 28, 15 after)
- Auto-scrolls upward - steer left/right to navigate
- Hit a wall to end the round early (still get bonus points)

## 🤖 Bot AI System

The game includes an advanced AI bot that learns and improves through machine learning:

- **Fast Learning Mode** - 25x faster skill progression (enabled by default)
- **Adaptive Skills** - Reaction speed, avoidance, and positioning improve over time
- **Master Level Toggle** - Press `M` to toggle between master level (max skills) and defaults
- **Performance Tracking** - Bot learns from each game session, tracking scores, rounds, and resource management
- **Per-Round Learning** - Bot learns enemy density patterns for each round
- **Strategic Laser Usage** - Bot learns when to use lasers based on threat assessment and resource comparison
- **Aggressive Movement** - Rapid evasion, constant horizontal patrol, and quick positioning
- **Smart Evasion** - Rapid upward movement when enemies descend, then quick return to base
- **Continuous Movement** - Bot maintains constant movement for better evasion and positioning
- **Bonus Round Navigation** - Bot can navigate bonus maze rounds, collecting items while avoiding walls

### Bot Behavior

The bot uses an intelligent movement system:
- **Constant Horizontal Patrol** - Continuously sweeps left/right along the base for evasion
- **Rapid Upward Evasion** - Moves up quickly when enemies descend directly above
- **Quick Return to Base** - Returns to bottom of screen after evading
- **Aggressive Positioning** - Faster/longer movements based on aggression level
- **Never Approaches Enemies** - Maintains safe distance while positioning for optimal shooting
- **Threat Prediction** - Predicts enemy and projectile positions for better evasion
- **Gap Finding** - Finds safe paths through enemy formations to reach optimal shooting positions

### Bot Learning System

The bot tracks and learns from:
- **Score Performance** - Improves when achieving new high scores
- **Round Progression** - Learns from reaching new rounds
- **Resource Management** - Tracks lives and lasers remaining at game end
- **Enemy Density** - Learns expected enemy counts per round
- **Laser Efficiency** - Adjusts laser usage based on effectiveness
- **Life Conservation** - Rewarded for ending games with more lives

The bot's progress is saved to localStorage and persists between sessions. Use the browser console to access additional bot controls:
- `window.bot.toggleMasterLevel()` - Toggle master level
- `window.bot.resetToDefaults()` - Reset bot to default starting values
- `window.bot.setFastLearning(enabled)` - Toggle fast learning mode

## 🛠️ Technology Stack

- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **HTML5 Canvas** - Pixel-perfect rendering with custom pixel renderer
- **Progressive Web App (PWA)** - Installable with service worker for offline support
- **Zero Dependencies** - No external game frameworks (pure TypeScript)
- **Encoded Graphics** - All sprites embedded in code as 2D arrays
- **Procedural Audio** - Sound effects generated programmatically (with support for base64-encoded audio)
- **localStorage** - Persistent high scores and bot learning data

## 📝 Development

### Key Features Implemented

- ✅ 50 rounds with unique enemy patterns and progressive difficulty
- ✅ 5 enemy types with distinct behaviors and animations
- ✅ Player movement with smooth acceleration and friction
- ✅ Auto-fire cannon and lightning laser weapons
- ✅ Advanced collision detection system
- ✅ Particle effects with explosions and confetti
- ✅ Round progression system with transitions
- ✅ Lives and scoring with bonus points
- ✅ High score tracking with localStorage
- ✅ Pause functionality
- ✅ AI bot with machine learning system
- ✅ Bonus maze rounds with collectible items
- ✅ Audio system with procedural sound generation
- ✅ PWA support with service worker
- ✅ Tab visibility handling (game continues in background)
- ✅ Victory and game over screens
- ✅ "FLOCKED!" achievement system
- ✅ Enemy shooting system (cycles 2+)
- ✅ Strategic breakaway attacks
- ✅ Wave movement patterns for Brain enemies

## 📄 License

This project is open source and available under the [MIT License](LICENSE).  All rights reserved.

## 🎵 Audio System

The game features a comprehensive audio system:

- **Procedural Sound Generation** - 8-bit style sounds generated programmatically
- **Base64 Audio Support** - Can use custom audio files encoded as base64 strings
- **Sound Types**:
  - Enemy destroyed sounds
  - Player hit sounds
  - Round start/complete jingles
  - Laser fire effects
  - Game over and victory themes
  - Bonus round music
  - Continuous enemy buzz sounds (for damaged enemies)
  - "FLOCKED!" achievement sound

See `src/audio/README.md` for instructions on adding custom audio files.

## 🙏 Acknowledgments

- Inspired by the classic 80's shooter arcade games (especially Round 42)
- Built with modern web technologies while preserving retro aesthetics
- All graphics are programmatically generated (no external assets)
- Features motivational sayings during round transitions

## 📧 Contact

For questions, suggestions, or contributions, please open an issue on GitHub.

---

**Enjoy defending your wealth! 💰🎮**
