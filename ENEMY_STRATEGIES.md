# Enemy Strategies & Mechanics Documentation

This document details the behavior, strategies, and mechanics for each enemy type and how they evolve throughout the 42 rounds of the game.

---

## Round Structure Overview

### Round Progression
- **Rounds 1-36**: Each enemy type cycles 9 times (4 types × 9 cycles = 36 rounds)
  - Cycle order: **Coins → Dollar Bills → Diamonds → Haters** (repeats)
  - Round 1-4: Cycle 1
  - Round 5-8: Cycle 2
  - Round 9-12: Cycle 3
  - ...continues through Round 33-36: Cycle 9

- **Rounds 37-42**: Mixed enemy types (all 4 types appear together)

### Enemy Count Progression
- **Cycle 1** (Rounds 1-4): 10 enemies per round
- **Cycle 2** (Rounds 5-8): 20 enemies per round
- **Cycle 3** (Rounds 9-12): 30 enemies per round
- **Cycle 4** (Rounds 13-16): 40 enemies per round
- **Cycle 5** (Rounds 17-20): 50 enemies per round
- **Cycle 6** (Rounds 21-24): 60 enemies per round
- **Cycle 7** (Rounds 25-28): 70 enemies per round
- **Cycle 8** (Rounds 29-32): 80 enemies per round
- **Cycle 9** (Rounds 33-36): 90 enemies per round
- **Mixed** (Rounds 37-42): 100 enemies per round

### Row Distribution
- **1-20 enemies**: 1 row
- **21-50 enemies**: 2 rows
- **51-99 enemies**: 3 rows
- **100 enemies**: 4 rows

### Speed Scaling
- **Base speed multiplier**: 1.0 (Round 1)
- **Speed increase**: +0.05 per round
- **Formula**: `1.0 + ((round - 1) * 0.05)`
- Examples:
  - Round 1: 1.0x speed
  - Round 10: ~1.45x speed
  - Round 20: ~1.95x speed
  - Round 42: ~3.05x speed

### Shooting Ability
- **Cycle 1** (Rounds 1-4): Enemies **cannot shoot**
- **Cycle 2+** (Rounds 5-42): Enemies **can shoot** projectiles

---

## Enemy Type Details

### 1. COINS 💰

#### Basic Stats
- **Health**: 1 hit
- **Size**: 8×8 pixels
- **Points**: 10 points
- **Color**: Gold/Bronze
- **Shape**: Circular

#### Movement Strategy
- **Formation**: Moves in horizontal lines
- **Line Movement**: 
  - Moves left/right as a group
  - Bounces off walls and moves down
  - Continuously moves downward
  - Wraps from bottom to top when reaching bottom
- **Base Speed**: 
  - Horizontal: 1.0 pixels/frame (scales with round)
  - Vertical: 0.15 pixels/frame (scales with round)

#### Breakaway Behavior
- **Base Breakaway Chance**: `0.0005 + (round * 0.0001)` per frame
  - Round 1: 0.0006 (0.06% per frame)
  - Round 10: 0.0015 (0.15% per frame)
  - Round 42: 0.0047 (0.47% per frame)
- **Strategic Breakaway Modifiers**:
  - **3x more likely** when:
    - Aligned horizontally with player (within 30 pixels)
    - Player is below enemy (within 60 pixels vertically)
  - **2x more likely** when:
    - Player is cornered (near left/right edges, within 20 pixels)
- **Breakaway Speed**: 2 pixels/frame
- **Breakaway Target**: Moves toward player's current position
- **Return Behavior**: After reaching target Y position, returns to original line position

#### Shooting (Cycle 2+)
- **Cooldown**: 180 frames (3 seconds at 60 FPS)
- **Shoot Chance**: 30% when cooldown is ready
- **Projectile Speed**: 1.8 pixels/frame
- **Projectile Color**: White
- **Behavior**: Only shoots when in line formation (not during breakaway)

#### Special Features
- None (basic enemy type)

---

### 2. DOLLAR BILLS 💵

#### Basic Stats
- **Health**: 2 hits
- **Size**: 12×8 pixels
- **Points**: 25 points
- **Color**: Green/White/Gold
- **Shape**: Horizontal dash with wing flapping animation

#### Movement Strategy
- **Formation**: Moves in horizontal lines
- **Line Movement**: Same as Coins
- **Animation**: 
  - **Wing Flapping**: 4-frame animation cycle
    - Frame 1: Wings up (V shape)
    - Frame 2: Wings horizontal (flat)
    - Frame 3: Wings down (inverted V)
    - Frame 4: Wings horizontal (flat) - for smooth loop
  - **Animation Speed**: 8 frames per animation frame
  - **Random Start**: Each dollar bill starts at a random animation frame

#### Breakaway Behavior
- Same as Coins (uses same breakaway system)

#### Shooting (Cycle 2+)
- Same as Coins

#### Special Features
- **Visual Distinction**: Animated wing flapping makes them more noticeable
- **Higher Health**: Requires 2 hits to destroy

---

### 3. DIAMONDS 💎

#### Basic Stats
- **Health**: 3 hits
- **Size**: 8×8 pixels
- **Points**: 50 points
- **Color**: Blue/Crystal
- **Shape**: Pod/diamond shape

#### Movement Strategy
- **Formation**: Moves in horizontal lines
- **Line Movement**: Same as Coins

#### Breakaway Behavior
- Same as Coins (uses same breakaway system)

#### Shooting (Cycle 2+)
- Same as Coins

#### Special Features
- **Highest Health**: Requires 3 hits to destroy
- **Highest Points**: Worth 50 points (most valuable single enemy)

---

### 4. HATERS 😠

#### Basic Stats
- **Health**: 2 hits
- **Size**: 8×10 pixels
- **Points**: 100 points
- **Color**: Red/Purple
- **Shape**: Two-legged face

#### Movement Strategy
- **Formation**: Moves in horizontal lines
- **Line Movement**: Same as Coins

#### Breakaway Behavior
- Same as Coins (uses same breakaway system)

#### Shooting (Cycle 2+)
- Same as Coins

#### Special Features
- **Highest Points**: Worth 100 points (most valuable enemy)
- **Visual Distinction**: Two-legged face design

---

## Line Movement Mechanics

### Horizontal Movement
- **Base Speed**: 1.0 pixels/frame (scales with round)
- **Direction**: Starts moving right, reverses on wall bounce
- **Wall Bounce**: 
  - When line hits left/right wall, direction reverses
  - Line also gets additional downward push (5x vertical speed)

### Vertical Movement
- **Base Speed**: 0.15 pixels/frame (scales with round)
- **Continuous**: Always moving downward
- **Wrap-Around**: When line Y position exceeds game height, resets to Y = 0 (top)

### Spacing
- **Base Spacing**: 18 pixels between enemies
- **Dynamic Adjustment**: 
  - If enemies don't fit, spacing reduces to minimum 8 pixels
  - Formula: `Math.max(8, 18 - Math.floor(enemyCount / 15))`
  - More enemies = tighter spacing

---

## Strategic AI System

### Coordinated Attacks
The `EnemyLine` class implements strategic coordinated attacks:

#### Attack Types

1. **Pincer Attack**
   - **Trigger**: Line is above player (20-50 pixels above)
   - **Chance**: 10% per check
   - **Behavior**: Leftmost and rightmost enemies break away simultaneously
   - **Cooldown**: 180 frames between coordinated attacks

2. **Flanking Maneuver**
   - **Trigger**: Strategic timer > 300 frames
   - **Chance**: 5% per check
   - **Behavior**: Enemy from side opposite to line movement breaks away
   - **Cooldown**: 180 frames

3. **Pressure Attack**
   - **Trigger**: Line is close to player vertically (30-80 pixels above)
   - **Chance**: 8% per check
   - **Behavior**: 3 central enemies break away simultaneously
   - **Cooldown**: 180 frames

### Individual Breakaway AI

#### Breakaway Decision
- **Base Chance**: `0.0005 + (round * 0.0001)` per frame
- **Strategic Modifiers**:
  - **3x multiplier** when:
    - Horizontally aligned with player (within 30 pixels)
    - Player is below enemy (within 60 pixels)
  - **2x multiplier** when:
    - Player is cornered (near edges, within 20 pixels)

#### Breakaway Movement
- **Target**: Player's current position
- **Speed**: 2 pixels/frame
- **Behavior**: Moves directly toward player
- **Return Trigger**: Reaches target Y position (gameHeight - 30)
- **Return Behavior**: Moves back to original line position

---

## Shooting Mechanics (Cycle 2+)

### Shooting Rules
- **Activation**: Only in Cycle 2+ (Rounds 5-42)
- **Condition**: Enemy must be in line formation (not breaking away)
- **Cooldown**: 180 frames (3 seconds at 60 FPS)
- **Shoot Chance**: 30% when cooldown is ready
  - If doesn't shoot, cooldown resets to 30% of max (54 frames)

### Projectile Properties
- **Speed**: 1.8 pixels/frame
- **Color**: White
- **Size**: 1×4 pixels
- **Targeting**: Aimed at player's current position
- **Behavior**: Linear trajectory toward player

### Difficulty Balancing
- **Reduced Frequency**: Only 30% chance to shoot
- **Cooldown**: 180 frames prevents constant shooting
- **Speed**: 1.8 pixels/frame (slower than player projectiles)
- **Not All Enemies**: Random chance prevents all enemies shooting simultaneously

---

## Damage & Visual Feedback

### Damage System
- **Health Reduction**: Each hit reduces health by 1
- **Color Change**: When health < maxHealth, enemy sprite gets damage tint (reddish)
- **Destruction**: When health <= 0, enemy is destroyed

### Destruction Effects
- **Particle Explosion**: 8 particles at enemy center
- **Explosion Colors**:
  - Coins: Gold
  - Dollar Bills: Emerald Green
  - Diamonds: Sapphire Blue
  - Haters: Crimson Red

---

## Configuration Parameters

### Tunable Values

#### Breakaway System
- **Base Breakaway Chance**: `0.0005 + (round * 0.0001)`
  - Location: `src/systems/spawning.ts:103`
- **Breakaway Speed**: `2` pixels/frame
  - Location: `src/entities/enemies.ts:38`
- **Strategic Modifiers**: 3x and 2x multipliers
  - Location: `src/entities/enemies.ts:147-155`

#### Shooting System
- **Shoot Cooldown**: `180` frames
  - Location: `src/entities/enemies.ts:56`
- **Shoot Chance**: `0.3` (30%)
  - Location: `src/entities/enemies.ts:57`
- **Projectile Speed**: `1.8` pixels/frame
  - Location: `src/entities/enemies.ts:380`

#### Line Movement
- **Base Horizontal Speed**: `1.0` pixels/frame
  - Location: `src/entities/enemyLine.ts:13`
- **Base Vertical Speed**: `0.15` pixels/frame
  - Location: `src/entities/enemyLine.ts:14`
- **Enemy Spacing**: `18` pixels (base), `8` pixels (minimum)
  - Location: `src/entities/enemyLine.ts:17`

#### Coordinated Attacks
- **Cooldown**: `180` frames
  - Location: `src/entities/enemyLine.ts:22`
- **Pincer Chance**: `0.1` (10%)
  - Location: `src/entities/enemyLine.ts:175`
- **Flanking Chance**: `0.05` (5%)
  - Location: `src/entities/enemyLine.ts:188`
- **Pressure Chance**: `0.08` (8%)
  - Location: `src/entities/enemyLine.ts:200`

#### Animation
- **Dollar Bill Animation Speed**: `8` frames per frame
  - Location: `src/entities/enemies.ts:50`

---

## Fine-Tuning Recommendations

### Making Enemies More Aggressive
1. **Increase Breakaway Chance**: Modify base chance in `spawning.ts:103`
2. **Increase Strategic Modifiers**: Change 3x/2x multipliers in `enemies.ts:147-155`
3. **Reduce Coordinated Attack Cooldown**: Lower `180` in `enemyLine.ts:22`
4. **Increase Coordinated Attack Chances**: Raise percentages in `enemyLine.ts`

### Making Enemies Less Aggressive
1. **Decrease Breakaway Chance**: Lower base chance
2. **Remove Strategic Modifiers**: Set multipliers to 1.0
3. **Increase Coordinated Attack Cooldown**: Raise above 180
4. **Decrease Coordinated Attack Chances**: Lower percentages

### Adjusting Shooting Difficulty
1. **Increase Shoot Chance**: Raise `0.3` to `0.5` or higher
2. **Decrease Cooldown**: Lower `180` to `120` or lower
3. **Increase Projectile Speed**: Raise `1.8` to `2.5` or higher
4. **Remove Random Chance**: Set shoot chance to `1.0` (always shoot)

### Adjusting Movement Speed
1. **Base Speed**: Modify `1.0` and `0.15` in `enemyLine.ts`
2. **Speed Scaling**: Change `0.05` multiplier in `spawning.ts:107`
3. **Breakaway Speed**: Modify `2` in `enemies.ts:38`

---

## Round-by-Round Breakdown

### Cycle 1 (Rounds 1-4)
- **Enemies**: 10 per round
- **Shooting**: ❌ Disabled
- **Speed**: 1.0x - 1.15x
- **Breakaway**: Low (0.0006 - 0.0009 per frame)

### Cycle 2 (Rounds 5-8)
- **Enemies**: 20 per round
- **Shooting**: ✅ Enabled (30% chance, 180 frame cooldown)
- **Speed**: 1.2x - 1.35x
- **Breakaway**: Low-Medium (0.0010 - 0.0013 per frame)

### Cycle 3 (Rounds 9-12)
- **Enemies**: 30 per round
- **Shooting**: ✅ Enabled
- **Speed**: 1.4x - 1.55x
- **Breakaway**: Medium (0.0014 - 0.0017 per frame)

### Cycle 4-9 (Rounds 13-36)
- **Enemies**: 40-90 per round (increasing by 10 each cycle)
- **Shooting**: ✅ Enabled
- **Speed**: 1.6x - 2.75x (increasing)
- **Breakaway**: Medium-High (0.0018 - 0.0041 per frame)

### Mixed Rounds (Rounds 37-42)
- **Enemies**: 100 per round (all 4 types mixed)
- **Shooting**: ✅ Enabled
- **Speed**: 2.8x - 3.05x
- **Breakaway**: High (0.0042 - 0.0047 per frame)

---

## Notes for Fine-Tuning

1. **Breakaway Chance**: Currently scales linearly with round. Consider exponential scaling for later rounds.
2. **Shooting**: Only 30% chance prevents overwhelming the player. Adjust carefully.
3. **Coordinated Attacks**: Currently only 3 types. Could add more strategic patterns.
4. **Speed Scaling**: Linear scaling may feel too slow in early rounds or too fast in later rounds.
5. **Enemy Count**: Current spacing formula ensures all enemies fit, but may feel cramped at 100 enemies.

