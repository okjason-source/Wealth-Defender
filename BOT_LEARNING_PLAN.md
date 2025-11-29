# Bot Learning from Human Gameplay - Implementation Plan

## Current State Analysis

### How the Bot Currently Learns

The bot **only learns from its own gameplay**, not from human players:

- **Self-Learning Only**: Bot improves when `botAI.isBotActive()` is true
- **Performance-Based**: Learns from score, round reached, and performance metrics
- **Parameter Adjustment**: Improves `reactionSpeed`, `avoidanceSkill`, `positioningSkill`, `aggressionLevel`
- **No Human Data**: When humans play, actions are not recorded or analyzed

### Current Learning System

```typescript
// Only called when bot is active (line 906-908 in game.ts)
if (this.botAI.isBotActive()) {
  this.botAI.onGameEnd(this.score, this.round);
}
```

The bot uses simple reinforcement learning:
- Improves skills when performance is good
- Slightly reduces skills when performance is poor
- Saves progress to localStorage (~5-10 KB)

---

## Memory Requirements Analysis

### Game Parameters

- **Frame Rate**: 60 FPS
- **Max Enemies**: 100 per round (rounds 37-42)
- **Max Projectiles**: ~50-100 on screen simultaneously
- **Game Duration**: 10-30 minutes typical
  - 10 minutes = 36,000 frames
  - 30 minutes = 108,000 frames

### Data Structure Per Frame

**Minimal Recording (Essential Data Only):**
```typescript
{
  // Player state
  playerX: number,      // 8 bytes
  playerY: number,      // 8 bytes
  moveX: number,        // 8 bytes (action)
  moveY: number,        // 8 bytes (action)
  shooting: boolean,    // 1 byte
  
  // Enemy positions (max 100)
  enemies: Array<{x, y, type}>,  // 100 × 24 bytes = 2,400 bytes
  
  // Projectile positions (max 100)
  projectiles: Array<{x, y, vx, vy, type}>,  // 100 × 40 bytes = 4,000 bytes
  
  // Game state
  score: number,        // 8 bytes
  round: number,        // 8 bytes
  frameCount: number    // 8 bytes
}
```

**Per Frame: ~6.5 KB**

---

## Implementation Approaches

### Scenario 1: Record Every Frame (Full Recording)

**Memory Usage:**
- 1 minute game: 3,600 frames × 6.5 KB = **~23 MB**
- 10 minute game: 36,000 frames × 6.5 KB = **~234 MB**
- 30 minute game: 108,000 frames × 6.5 KB = **~702 MB**

**Pros:**
- Complete data capture
- Best for research/debugging
- Can replay exact gameplay

**Cons:**
- Very high memory usage
- Not practical for browser storage
- Requires IndexedDB or server upload

**Storage:** RAM only (temporary) or IndexedDB

---

### Scenario 2: Sample Every 5 Frames (Decision Points)

**Memory Usage:**
- 1 minute: 720 frames × 6.5 KB = **~4.7 MB**
- 10 minutes: 7,200 frames × 6.5 KB = **~47 MB**
- 30 minutes: 21,600 frames × 6.5 KB = **~140 MB**

**Pros:**
- Good balance between data quality and memory
- Captures decision points (bot makes decisions every 5 frames)
- Still provides detailed gameplay data

**Cons:**
- Still high memory for long games
- May miss some rapid movements

**Storage:** RAM (temporary) or IndexedDB

---

### Scenario 3: Record Only When Bot Makes Decisions

**Memory Usage:**
- Same as Scenario 2: **~47-140 MB per game**

**Pros:**
- Aligns with bot's decision-making frequency
- Natural sampling rate

**Cons:**
- Same memory concerns as Scenario 2

**Storage:** RAM (temporary) or IndexedDB

---

### Scenario 4: Compressed/Optimized (Only Nearby Entities)

**Memory Usage:**
- Record only enemies/projectiles within 100 pixels of player
- Reduces to ~2 KB per frame
- 10 minutes: **~14 MB**
- 30 minutes: **~42 MB**

**Pros:**
- Focuses on relevant data (what player can see/react to)
- Significant memory reduction
- Still captures important gameplay context

**Cons:**
- May miss strategic positioning decisions
- Requires distance calculations

**Storage:** RAM (temporary) or IndexedDB

---

### Scenario 5: Event-Based Recording (State Changes Only)

**Memory Usage:**
- Record only when player moves, shoots, or significant events occur
- ~0.5-1 KB per event
- 10 minutes: **~5-10 MB**
- 30 minutes: **~15-30 MB**

**Pros:**
- Most memory-efficient
- Captures all meaningful actions
- Natural compression (no redundant data)

**Cons:**
- Requires event detection logic
- May need to reconstruct full state for analysis

**Storage:** RAM (temporary) or IndexedDB

---

### Scenario 6: Process & Discard (Recommended)

**Memory Usage:**
- During game: **~50-200 MB** in RAM (temporary)
- After processing: **~1-5 KB** (just learned parameters)
- localStorage: **~5-10 KB** (same as current bot learning data)

**How It Works:**
1. Record gameplay in memory during session
2. Process/analyze after game ends
3. Extract patterns and update bot parameters
4. Discard raw recording, keep only learned parameters

**Pros:**
- Minimal persistent storage
- Works within browser localStorage limits
- Can use any recording approach above
- No long-term storage concerns

**Cons:**
- Requires processing time after game
- Can't replay exact gameplay later
- Need to implement analysis algorithms

**Storage:** RAM (temporary) → localStorage (processed data only)

---

## Browser Storage Limits

| Storage Type | Typical Limit | Best For |
|--------------|---------------|----------|
| localStorage | 5-10 MB per domain | Small data, bot parameters |
| sessionStorage | 5-10 MB per session | Temporary game data |
| IndexedDB | 50 MB+ (varies by browser) | Large recordings |
| RAM | Limited by device | Temporary processing |

**Recommendation:** Use RAM for temporary recording, localStorage for processed results.

---

## Learning Approaches

### Option A: Imitation Learning

**How It Works:**
- Record human actions and game states
- Train bot to predict human actions in similar situations
- Bot mimics human decision-making

**Data Needed:**
- Game state (enemies, projectiles, player position)
- Human actions (movement, shooting decisions)
- Outcome (score, round reached)

**Memory:** Medium (need state-action pairs)

**Complexity:** High (requires ML model or pattern matching)

---

### Option B: Strategy Extraction

**How It Works:**
- Analyze successful human games
- Extract rules/patterns (preferred positions, target priorities, movement patterns)
- Apply extracted strategies to bot logic

**Data Needed:**
- Game state snapshots at key moments
- Performance metrics
- Pattern analysis results

**Memory:** Low (only store extracted patterns)

**Complexity:** Medium (requires pattern analysis algorithms)

---

### Option C: Hybrid Approach

**How It Works:**
- Combine self-learning with human demonstrations
- Use human play to guide exploration
- Bot learns from both its own experience and human examples

**Data Needed:**
- Both human gameplay recordings and bot performance data
- Comparative analysis

**Memory:** Medium-High

**Complexity:** High (most sophisticated)

---

## Recommended Implementation Plan

### Phase 1: Basic Recording (Event-Based)

**Goal:** Record human gameplay without overwhelming memory

**Implementation:**
1. Add `GameplayRecorder` class
2. Record events: player movement, shooting, enemy positions, projectiles
3. Store in memory during gameplay
4. Process after game ends
5. Extract simple patterns (e.g., "player prefers bottom-center position")

**Memory:** ~5-10 MB per game (temporary)

**Storage:** Process and discard, save only extracted insights

---

### Phase 2: Pattern Analysis

**Goal:** Extract actionable strategies from recordings

**Implementation:**
1. Analyze successful games (high score, deep rounds)
2. Identify patterns:
   - Preferred positioning zones
   - Target selection priorities
   - Movement patterns in different situations
   - Threat avoidance strategies
3. Update bot parameters based on patterns

**Memory:** ~1-5 KB (stored patterns)

**Storage:** localStorage (same as current bot learning)

---

### Phase 3: Advanced Learning (Optional)

**Goal:** Implement imitation learning or neural network

**Implementation:**
1. Build state-action mapping
2. Train model to predict human actions
3. Integrate with bot decision-making

**Memory:** Varies (model size)

**Storage:** IndexedDB or server

---

## Technical Considerations

### When to Record

**Option 1: Always Record Human Games**
- Pros: Captures all gameplay data
- Cons: Memory usage even for casual play

**Option 2: Opt-In Recording**
- Pros: User controls when to record
- Cons: May miss good gameplay sessions

**Option 3: Record Only High-Performance Games**
- Pros: Focus on best examples
- Cons: May not capture diverse strategies

**Recommendation:** Option 3 - Record games that beat bot's best score or reach new rounds.

---

### Data Processing

**Real-Time Processing:**
- Process during gameplay (lower memory, but may impact performance)

**Post-Game Processing:**
- Process after game ends (better performance, but requires temporary storage)

**Recommendation:** Post-game processing to avoid impacting gameplay.

---

### Privacy & Storage

**Local-Only:**
- All data stays in browser
- No server uploads
- Privacy-friendly

**Cloud Sync (Future):**
- Upload to server for cross-device learning
- Requires user consent
- More storage available

**Recommendation:** Start with local-only, add cloud sync as optional feature later.

---

## Implementation Checklist

### Phase 1: Recording System
- [ ] Create `GameplayRecorder` class
- [ ] Implement event-based recording
- [ ] Add recording toggle (opt-in or automatic)
- [ ] Store recordings in memory during gameplay
- [ ] Add recording status indicator in UI

### Phase 2: Analysis System
- [ ] Create `GameplayAnalyzer` class
- [ ] Implement pattern extraction algorithms
- [ ] Identify successful strategies
- [ ] Update bot parameters based on analysis
- [ ] Save learned patterns to localStorage

### Phase 3: Integration
- [ ] Integrate learned patterns into bot decision-making
- [ ] Test bot improvement from human gameplay
- [ ] Add UI to show learning progress
- [ ] Add option to clear/reset learned data

### Phase 4: Advanced Features (Optional)
- [ ] Implement imitation learning
- [ ] Add neural network model
- [ ] Cloud sync for cross-device learning
- [ ] Replay system for recorded games

---

## Memory Usage Summary

| Approach | Memory per 10-min Game | Storage | Best For |
|----------|------------------------|---------|----------|
| Every frame | ~234 MB | RAM/IndexedDB | Research/debugging |
| Every 5 frames | ~47 MB | RAM/IndexedDB | Good balance |
| Event-based | ~5-10 MB | RAM/IndexedDB | Production |
| **Process & discard** | **~50-200 MB temp, ~5 KB saved** | **localStorage** | **Recommended** |

---

## Next Steps

1. **Review this plan** and decide on approach
2. **Start with Phase 1** (basic recording)
3. **Test memory usage** with different recording strategies
4. **Implement Phase 2** (pattern analysis)
5. **Iterate** based on results

---

## Questions to Consider

1. **Recording Frequency:** Every frame, every 5 frames, or event-based?
2. **Storage Strategy:** Process & discard, or save recordings?
3. **Learning Method:** Strategy extraction, imitation learning, or hybrid?
4. **User Control:** Always record, opt-in, or automatic for high scores?
5. **Privacy:** Local-only or cloud sync?

---

**Last Updated:** 2024
**Status:** Planning Phase - No implementation yet

