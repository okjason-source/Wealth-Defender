/**
 * Spawning System
 * Handles enemy wave patterns and round-based spawning
 */

import { EnemyManager, EnemyType } from '../entities/enemies';

export interface WavePattern {
  enemyType: EnemyType;
  count: number;
  spawnDelay: number; // Frames between each spawn in this wave
  formation: 'line' | 'column' | 'grid' | 'random' | 'v' | 'diamond' | 'meteor';
  spacing: number;
  rowIndex?: number; // Which row this is (0-3) for vertical stacking
  rowY?: number; // Y position for this row
}

export interface RoundDefinition {
  round: number;
  waves: WavePattern[];
  totalEnemies: number;
}

export class SpawningSystem {
  private enemyManager: EnemyManager;
  private currentRound: number = 1;
  private currentWaveIndex: number = 0;
  private currentWaveSpawnIndex: number = 0;
  private spawnTimer: number = 0;
  private isSpawning: boolean = false;
  private roundDefinition: RoundDefinition | null = null;
  private enemiesSpawned: number = 0;
  private enemiesDestroyed: number = 0;
  
  constructor(
    enemyManager: EnemyManager,
    _gameWidth: number,
    _gameHeight: number
  ) {
    this.enemyManager = enemyManager;
  }
  
  startRound(round: number): void {
    this.currentRound = round;
    this.currentWaveIndex = 0;
    this.currentWaveSpawnIndex = 0;
    this.spawnTimer = 0;
    this.roundDefinition = this.generateRoundDefinition(round);
    this.isSpawning = true;
    this.enemiesSpawned = 0;
    this.enemiesDestroyed = 0;
  }
  
  update(deltaTime: number): void {
    if (!this.isSpawning || !this.roundDefinition) return;
    
    // Check if all waves are complete
    if (this.currentWaveIndex >= this.roundDefinition.waves.length) {
      this.isSpawning = false;
      return;
    }
    
    const currentWave = this.roundDefinition.waves[this.currentWaveIndex];
    
    // For line formation with count 0, spawn entire line at once
    if (currentWave.formation === 'line' && currentWave.count === 0) {
      if (this.currentWaveSpawnIndex === 0) {
        // Spawn the entire line
        this.spawnEnemyFromWave(currentWave, 0);
        this.currentWaveSpawnIndex = 1; // Mark as spawned
      } else {
        // Line already spawned, move to next wave
        this.currentWaveIndex++;
        this.currentWaveSpawnIndex = 0;
        this.spawnTimer = 0;
      }
      return;
    }
    
    // Check if current wave is complete (for non-zero counts)
    if (this.currentWaveSpawnIndex >= currentWave.count) {
      this.currentWaveIndex++;
      this.currentWaveSpawnIndex = 0;
      this.spawnTimer = 0;
      return;
    }
    
    // Spawn enemies based on wave pattern
    // Convert deltaTime to frames (assuming 60 FPS target)
    const frameDelta = deltaTime / 16.67;
    this.spawnTimer += frameDelta;
    
    if (this.spawnTimer >= currentWave.spawnDelay) {
      this.spawnEnemyFromWave(currentWave, this.currentWaveSpawnIndex);
      this.currentWaveSpawnIndex++;
      this.spawnTimer = 0;
    }
  }
  
  private spawnEnemyFromWave(wave: WavePattern, index: number): void {
    // For meteor formation (coins >= 50), spawn individual falling enemies
    if (wave.formation === 'meteor') {
      // Spawn individual coin at random X position at top
      const randomX = 5 + Math.random() * (200 - 10 - 8); // Random X, leave margins
      const speedMultiplier = 1.0 + ((this.currentRound - 1) * 0.05);
      const cycle = Math.floor((this.currentRound - 1) / 4) + 1;
      const canShoot = cycle >= 2;
      
      this.enemyManager.spawnFallingEnemy(
        wave.enemyType,
        randomX,
        0, // Top of screen - always at the very top
        speedMultiplier,
        canShoot
      );
      this.enemiesSpawned++;
      return;
    }
    
    // For line formation, spawn entire row at once (only on first index)
    if (wave.formation === 'line' && index === 0) {
      // Use the row Y position if specified, otherwise default to top
      // Rows are stacked vertically: row 0 at top, row 1 below it, etc.
      const finalYPos = wave.rowY !== undefined ? wave.rowY : 0;
      
      const breakChance = 0.0005 + (this.currentRound * 0.0001);
      
      // Calculate speed multiplier based on round (starts at 1.0, increases with each round)
      // Round 1: 1.0x, Round 10: ~1.5x, Round 20: ~2.0x, Round 42: ~3.0x, Round 50: ~3.45x
      const speedMultiplier = 1.0 + ((this.currentRound - 1) * 0.05);
      
      // Cycle 2 (rounds 5-8) and beyond can shoot projectiles
      const cycle = Math.floor((this.currentRound - 1) / 4) + 1;
      const canShoot = cycle >= 2;
      
      this.enemyManager.spawnEnemyLine(
        wave.enemyType,
        finalYPos,
        wave.count,
        breakChance,
        speedMultiplier,
        canShoot,
        cycle
      );
      this.enemiesSpawned += wave.count;
    }
  }
  
  onEnemyDestroyed(): void {
    this.enemiesDestroyed++;
  }
  
  generateRoundDefinition(round: number): RoundDefinition {
    const waves: WavePattern[] = [];
    
    // 50 rounds total:
    // - Rounds 1-36: Each of 4 types cycles 9 times (4 types × 9 = 36 rounds)
    // - Rounds 37-42: Mixed types (6 rounds) - Coins, Dollar Bills, Diamonds, Haters
    // - Rounds 43-50: Mixed types with brains (8 rounds) - Includes brains with other types
    
    // Brain replacement levels: 
    // Level 3 (diamonds), 5 (coins), 10 (dollars), 16 (haters), 19 (diamonds), 
    // then continuing the pattern: 22 (coins), 26 (dollars), 30 (haters), 33 (diamonds), 36 (haters)
    const brainLevels = [3, 5, 10, 16, 19, 22, 26, 30, 33, 36];
    const isBrainLevel = brainLevels.includes(round);
    
    let enemyType: EnemyType;
    let isMixed = false;
    let includeBrainsInMixed = false; // Flag for rounds 43-50 to include brains in mixed
    
    if (round <= 36) {
      // Cycles: Each type appears 9 times
      // Round 1-4: Cycle 1 (Coins, Dollar Bills, Diamonds, Haters)
      // Round 5-8: Cycle 2 (Coins, Dollar Bills, Diamonds, Haters)
      // etc.
      const typeCycle = [
        EnemyType.COIN,
        EnemyType.DOLLAR_BILL,
        EnemyType.DIAMOND,
        EnemyType.HATER,
      ];
      enemyType = typeCycle[(round - 1) % 4];
      
      // Replace with brain if this is a brain level
      if (isBrainLevel) {
        enemyType = EnemyType.BRAIN;
      }
    } else if (round <= 42) {
      // Rounds 37-42: Mixed types (no brains)
      isMixed = true;
      includeBrainsInMixed = false;
      enemyType = EnemyType.COIN; // Default, but we'll handle mixed separately
    } else {
      // Rounds 43-50: Mixed types with brains
      isMixed = true;
      includeBrainsInMixed = true;
      enemyType = EnemyType.COIN; // Default, but we'll handle mixed separately
    }
    
    // Enemy count progression (DOUBLED from original):
    // Cycle 1 (rounds 1-4): 20 enemies (was 10)
    // Cycle 2 (rounds 5-8): 40 enemies (was 20)
    // Cycle 3 (rounds 9-12): 60 enemies (was 30)
    // ...
    // Cycle 9 (rounds 33-36): 180 enemies (was 90)
    // Mixed (rounds 37-42): 200 enemies (was 100)
    // Mixed with brains (rounds 43-50): Progressive from 200 to 340 enemies
    
    // Calculate cycle for row distribution
    const cycle = round <= 36 ? Math.floor((round - 1) / 4) + 1 : Math.floor((round - 1) / 4) + 1;
    
    let enemiesPerRow: number;
    if (round <= 36) {
      enemiesPerRow = cycle * 20; // 20, 40, 60, ..., 180 (doubled)
    } else if (round <= 42) {
      enemiesPerRow = 200; // Mixed rounds (doubled from 100)
    } else {
      // Mixed rounds with brains 43-50: Progressive difficulty
      // Round 43: 200, 44: 220, 45: 240, 46: 260, 47: 280, 48: 300, 49: 320, 50: 340
      const mixedBrainRoundIndex = round - 42; // 1-8
      enemiesPerRow = 200 + (mixedBrainRoundIndex - 1) * 20;
    }
    
    // Smart row system: Progressive rows based on cycle
    // Each row fits max 20 enemies (ideal), rows are stacked vertically
    // Cycle 1 (rounds 1-4): 1 row of 20
    // Cycle 2 (rounds 5-8): 2 rows of 20
    // Cycle 3 (rounds 9-12): 3 rows of 20
    // Cycle 4+ (rounds 13+): 4 rows (some rows may have more than 20 if needed)
    const enemiesPerRowMax = 20; // Maximum enemies per row (ideal target)
    let rowsPerRound: number;
    
    if (cycle === 1) {
      rowsPerRound = 1; // 1 row of 20
    } else if (cycle === 2) {
      rowsPerRound = 2; // 2 rows of 20
    } else if (cycle === 3) {
      rowsPerRound = 3; // 3 rows of 20
    } else {
      rowsPerRound = 4; // 4 rows (may have more than 20 per row if needed)
    }
    
    // Calculate vertical spacing between rows (stack them on top of each other)
    const rowSpacing = 20; // Vertical spacing between rows
    const topMargin = 5; // Start at top of screen (same as score position)
    
    // Spawn rows with specified enemy count per row
    if (isMixed && round >= 37) {
      // Mixed rounds: spawn different types in different rows
      let mixedTypes: EnemyType[];
      if (includeBrainsInMixed) {
        // Rounds 43-50: Include brains in the mix (5 types total)
        mixedTypes = [
          EnemyType.COIN,
          EnemyType.DOLLAR_BILL,
          EnemyType.DIAMOND,
          EnemyType.HATER,
          EnemyType.BRAIN,
        ];
      } else {
        // Rounds 37-42: Regular mixed types (4 types, no brains)
        mixedTypes = [
          EnemyType.COIN,
          EnemyType.DOLLAR_BILL,
          EnemyType.DIAMOND,
          EnemyType.HATER,
        ];
      }
      // Distribute enemies across rows
      // Strategy: Keep last 3 rows at 20 each, put remainder in 1st row (top, furthest from player)
      // Distribute from top (row 0) first
      for (let row = 0; row < rowsPerRound; row++) {
        let enemiesForThisRow: number;
        if (cycle <= 3) {
          // Cycles 1-3: Even distribution, max 20 per row
          enemiesForThisRow = Math.min(enemiesPerRowMax, Math.ceil(enemiesPerRow / rowsPerRound));
        } else {
          // Cycle 4+: Keep last 3 rows at 20, remainder goes to 1st row (top)
          if (row === 0) {
            // 1st row (top, furthest from player) gets the remainder
            const lastThreeRowsTotal = 3 * enemiesPerRowMax; // 60 enemies
            enemiesForThisRow = Math.max(0, enemiesPerRow - lastThreeRowsTotal);
          } else {
            enemiesForThisRow = enemiesPerRowMax; // Last 3 rows get 20 each
          }
        }
        
        const typeForRow = mixedTypes[row % mixedTypes.length]; // Cycle through types
        // Check if coins >= 100 for meteor formation (doubled from 50)
        const useMeteor = typeForRow === EnemyType.COIN && enemiesForThisRow >= 100;
        // Haters get tighter spacing for more intense gameplay
        const spacing = typeForRow === EnemyType.HATER 
          ? Math.max(6, 14 - Math.floor(enemiesPerRow / 20))
          : Math.max(8, 18 - Math.floor(enemiesPerRow / 15));
        // Calculate Y position for this row (stacked vertically, row 0 is top/furthest from player)
        const rowY = topMargin + (row * rowSpacing);
        waves.push({
          enemyType: typeForRow,
          count: enemiesForThisRow,
          spawnDelay: useMeteor ? 15 : 0, // Spawn delay for meteor formation (continuous drops)
          formation: useMeteor ? 'meteor' : 'line',
          spacing: spacing,
          rowIndex: row,
          rowY: rowY,
        });
      }
    } else {
      // Single type rounds: distribute enemies across rows
      // Strategy: Keep first 3 rows at 20 each, put remainder in 4th row (bottom, closest to player)
      // Distribute from top (row 0) first
      
      // Check if coins >= 100 for meteor formation (doubled from 50)
      const useMeteor = enemyType === EnemyType.COIN && enemiesPerRow >= 100;
      
      if (useMeteor) {
        // Meteor formation: spawn individual coins continuously
        // Meteors spawn from top, distribute total count across spawns
        const totalMeteorSpawns = enemiesPerRow; // Total number of meteors to spawn
        for (let i = 0; i < totalMeteorSpawns; i++) {
          waves.push({
            enemyType: enemyType,
            count: 1, // Spawn one at a time
            spawnDelay: 15, // Delay between each coin drop (creates continuous rain)
            formation: 'meteor',
            spacing: 0, // Not used for meteor
            rowIndex: 0, // Meteors spawn at top
            rowY: topMargin,
          });
        }
      } else {
        // Calculate enemies per row based on distribution strategy
        for (let row = 0; row < rowsPerRound; row++) {
          let enemiesForThisRow: number;
          if (cycle <= 3) {
            // Cycles 1-3: Even distribution, max 20 per row
            enemiesForThisRow = Math.min(enemiesPerRowMax, Math.ceil(enemiesPerRow / rowsPerRound));
          } else {
            // Cycle 4+: Keep last 3 rows at 20, remainder goes to 1st row (top, furthest from player)
            if (row === 0) {
              // 1st row (top, furthest from player) gets the remainder
              const lastThreeRowsTotal = 3 * enemiesPerRowMax; // 60 enemies
              enemiesForThisRow = Math.max(0, enemiesPerRow - lastThreeRowsTotal);
            } else {
              enemiesForThisRow = enemiesPerRowMax; // Last 3 rows get 20 each
            }
          }
          
          const rowY = topMargin + (row * rowSpacing);
          
          if (enemyType === EnemyType.HATER) {
            // Haters: spawn in tighter formation for left-to-right wrap-around pattern
            const haterSpacing = Math.max(6, 14 - Math.floor(enemiesPerRow / 20)); // Tighter spacing
            waves.push({
              enemyType: enemyType,
              count: enemiesForThisRow,
              spawnDelay: 0,
              formation: 'line',
              spacing: haterSpacing,
              rowIndex: row,
              rowY: rowY,
            });
          } else if (enemyType === EnemyType.BRAIN) {
            // Brains: spawn in line formation with wave movement pattern
            const brainSpacing = Math.max(8, 18 - Math.floor(enemiesPerRow / 15));
            waves.push({
              enemyType: enemyType,
              count: enemiesForThisRow,
              spawnDelay: 0,
              formation: 'line',
              spacing: brainSpacing,
              rowIndex: row,
              rowY: rowY,
            });
          } else {
            // Normal line formation for other types (diamonds, coins, dollar bills)
            waves.push({
              enemyType: enemyType,
              count: enemiesForThisRow,
              spawnDelay: 0,
              formation: 'line',
              spacing: Math.max(8, 18 - Math.floor(enemiesPerRow / 15)), // Tighter spacing for more enemies
              rowIndex: row,
              rowY: rowY,
            });
          }
        }
      }
    }
    
    // Calculate total enemies
    const totalEnemies = waves.reduce((sum, wave) => sum + wave.count, 0);
    
    return {
      round,
      waves,
      totalEnemies,
    };
  }
  
  isRoundComplete(): boolean {
    // Round is complete when:
    // 1. All waves have finished spawning
    // 2. There are no active enemies on screen
    if (!this.isSpawning && this.enemyManager.getEnemyCount() === 0) {
      return true;
    }
    return false;
  }
  
  getCurrentRound(): number {
    return this.currentRound;
  }
  
  getRoundDefinition(): RoundDefinition | null {
    return this.roundDefinition;
  }
}
