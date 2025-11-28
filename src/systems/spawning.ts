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
      // CRITICAL: ALL enemies must start at the very top (y=0) for playability
      // Even with multiple rows, they should all start at the top
      // The vertical spacing was causing enemies to start too low, making rounds unplayable
      const finalYPos = 0; // Always start at the very top - DO NOT CHANGE
      
      const breakChance = 0.0005 + (this.currentRound * 0.0001);
      
      // Calculate speed multiplier based on round (starts at 1.0, increases with each round)
      // Round 1: 1.0x, Round 10: ~1.5x, Round 20: ~2.0x, Round 42: ~3.0x
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
    
    // 42 rounds total:
    // - Rounds 1-36: Each of 4 types cycles 9 times (4 types × 9 = 36 rounds)
    // - Rounds 37-42: Mixed types (6 rounds)
    
    // Brain replacement levels: 
    // Level 3 (diamonds), 5 (coins), 10 (dollars), 16 (haters), 19 (diamonds), 
    // then continuing the pattern: 22 (coins), 26 (dollars), 30 (haters), 33 (diamonds), 36 (haters)
    const brainLevels = [3, 5, 10, 16, 19, 22, 26, 30, 33, 36];
    const isBrainLevel = brainLevels.includes(round);
    
    let enemyType: EnemyType;
    let isMixed = false;
    
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
    } else {
      // Rounds 37-42: Mixed types
      isMixed = true;
      enemyType = EnemyType.COIN; // Default, but we'll handle mixed separately
    }
    
    // Enemy count progression:
    // Cycle 1 (rounds 1-4): 10 enemies
    // Cycle 2 (rounds 5-8): 20 enemies
    // Cycle 3 (rounds 9-12): 30 enemies
    // ...
    // Cycle 9 (rounds 33-36): 90 enemies
    // Mixed (rounds 37-42): 100 enemies
    
    let enemiesPerRow: number;
    if (round <= 36) {
      const cycle = Math.floor((round - 1) / 4) + 1; // Which cycle (1-9)
      enemiesPerRow = cycle * 10; // 10, 20, 30, ..., 90
    } else {
      enemiesPerRow = 100; // Mixed rounds
    }
    
    // Determine number of rows based on enemy count
    // More enemies = more rows to fit them on screen
    let rowsPerRound = 1;
    if (enemiesPerRow > 20) {
      rowsPerRound = 2;
    }
    if (enemiesPerRow > 50) {
      rowsPerRound = 3;
    }
    if (enemiesPerRow >= 100) {
      rowsPerRound = 4; // Multiple rows for 100 enemies
    }
    
    // Spawn rows with specified enemy count per row
    if (isMixed && round >= 37) {
      // Mixed rounds: spawn different types in different rows
      const mixedTypes = [
        EnemyType.COIN,
        EnemyType.DOLLAR_BILL,
        EnemyType.DIAMOND,
        EnemyType.HATER,
      ];
      const enemiesPerMixedRow = Math.ceil(enemiesPerRow / rowsPerRound);
      
      for (let row = 0; row < rowsPerRound; row++) {
        const typeForRow = mixedTypes[row % 4]; // Cycle through types
        // Check if coins >= 50 for meteor formation
        const useMeteor = typeForRow === EnemyType.COIN && enemiesPerMixedRow >= 50;
        // Haters get tighter spacing for more intense gameplay
        const spacing = typeForRow === EnemyType.HATER 
          ? Math.max(6, 14 - Math.floor(enemiesPerRow / 20))
          : Math.max(8, 18 - Math.floor(enemiesPerRow / 15));
        waves.push({
          enemyType: typeForRow,
          count: enemiesPerMixedRow,
          spawnDelay: useMeteor ? 15 : 0, // Spawn delay for meteor formation (continuous drops)
          formation: useMeteor ? 'meteor' : 'line',
          spacing: spacing,
        });
      }
    } else {
      // Single type rounds: distribute enemies across rows
      const enemiesPerRowActual = Math.ceil(enemiesPerRow / rowsPerRound);
      
      // Check if coins >= 50 for meteor formation
      const useMeteor = enemyType === EnemyType.COIN && enemiesPerRow >= 50;
      
      if (useMeteor) {
        // Meteor formation: spawn individual coins continuously
        for (let i = 0; i < enemiesPerRowActual; i++) {
          waves.push({
            enemyType: enemyType,
            count: 1, // Spawn one at a time
            spawnDelay: 15, // Delay between each coin drop (creates continuous rain)
            formation: 'meteor',
            spacing: 0, // Not used for meteor
          });
        }
      } else if (enemyType === EnemyType.HATER) {
        // Haters: spawn in tighter formation for left-to-right wrap-around pattern
        // More enemies per row, tighter spacing for more intense gameplay
        const haterSpacing = Math.max(6, 14 - Math.floor(enemiesPerRow / 20)); // Tighter spacing
        for (let row = 0; row < rowsPerRound; row++) {
          waves.push({
            enemyType: enemyType,
            count: enemiesPerRowActual,
            spawnDelay: 0,
            formation: 'line',
            spacing: haterSpacing, // Tighter spacing for haters
          });
        }
      } else if (enemyType === EnemyType.BRAIN) {
        // Brains: spawn in line formation with wave movement pattern
        const brainSpacing = Math.max(8, 18 - Math.floor(enemiesPerRow / 15));
        for (let row = 0; row < rowsPerRound; row++) {
          waves.push({
            enemyType: enemyType,
            count: enemiesPerRowActual,
            spawnDelay: 0,
            formation: 'line',
            spacing: brainSpacing,
          });
        }
      } else {
        // Normal line formation for other types
        for (let row = 0; row < rowsPerRound; row++) {
          waves.push({
            enemyType: enemyType,
            count: enemiesPerRowActual,
            spawnDelay: 0,
            formation: 'line',
            spacing: Math.max(8, 18 - Math.floor(enemiesPerRow / 15)), // Tighter spacing for more enemies
          });
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
