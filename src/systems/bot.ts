/**
 * Bot AI System
 * Controls the player automatically to play the game
 */

import { Player } from '../entities/player';
import { Enemy, EnemyType } from '../entities/enemies';
import { Projectile, ProjectileType } from '../entities/projectiles';
import { BonusMaze, MazeWall } from './bonusMaze';

export class BotAI {
  private isActive: boolean = false;
  private lastDecisionTime: number = 0;
  private decisionInterval: number = 5; // Make decisions every 5 frames
  
  // Learning/Adaptive system
  private gamesPlayed: number = 0;
  private bestScore: number = 0;
  private bestRound: number = 0;
  private totalScore: number = 0;
  private averageScore: number = 0;
  
  // Adaptive parameters (improve over time)
  // MASTER MODE: Start with much higher initial values for faster progression
  private reactionSpeed: number = 1.5; // Multiplier for decision making (higher = faster) - START HIGHER
  private avoidanceSkill: number = 1.4; // How well it avoids threats (higher = better) - START HIGHER
  private positioningSkill: number = 1.4; // How well it positions for shooting (higher = better) - START HIGHER
  private aggressionLevel: number = 0.6; // How aggressively it targets/shoots enemies (0-1) - NOT about moving closer
  
  // Laser usage parameters
  private laserConservationLevel: number = 0.4; // How conservative with lasers (0-1, higher = more conservative) - Lowered for more freedom
  private laserUsageThreshold: number = 0.5; // Threshold for using lasers (0-1, higher = only in emergencies) - Lowered for more strategic use
  private lastLaserUseRound: number = 0; // Track which round lasers were last used
  
  // Fast learning mode - dramatically increases learning rates
  private fastLearningMode: boolean = true; // Enable fast learning by default
  private learningMultiplier: number = 25.0; // 25x faster learning!
  
  // Performance tracking
  private lastGameRound: number = 0;
  
  // Game state tracking for learning
  private lasersUsedThisGame: number = 0; // Track how many lasers were used
  private lasersAvailableAtStart: number = 5; // Track starting laser count
  private maxEnemyCountThisGame: number = 0; // Track peak enemy density
  private averageEnemyCountThisGame: number = 0; // Track average enemy density
  private enemyCountSamples: number = 0; // Number of samples for average
  private totalEnemyCountThisGame: number = 0; // Sum for average calculation
  private bestLivesAtEnd: number = 3; // Best lives remaining at game end
  private bestLasersAtEnd: number = 5; // Best lasers remaining at game end
  
  // Per-round enemy tracking for learning
  private enemyCountsByRound: Map<number, { max: number; avg: number; samples: number; total: number }> = new Map();
  private currentRound: number = 1; // Track current round for per-round tracking
  private currentRoundEnemyMax: number = 0; // Max enemies in current round
  private currentRoundEnemyTotal: number = 0; // Total for average in current round
  private currentRoundEnemySamples: number = 0; // Samples for current round
  
  // Patrol/evasion behavior - constant horizontal movement
  private patrolDirection: number = 1; // 1 = right, -1 = left
  private lastPatrolChange: number = 0;
  private patrolChangeInterval: number = 120; // Change direction every 120 frames (2 seconds at 60fps)
  private lastMoveX: number = 0; // Remember last movement to continue between decisions
  private lastMoveY: number = 0;
  
  constructor() {
    this.loadLearningData();
  }
  
  /**
   * Set bot to master level instantly (max skills)
   */
  setMasterLevel(): void {
    this.reactionSpeed = 2.0;
    this.avoidanceSkill = 2.0;
    this.positioningSkill = 2.0;
    this.aggressionLevel = 0.85;
    this.saveLearningData();
    console.log('Bot set to MASTER LEVEL!');
  }
  
  /**
   * Reset bot to default starting values (turns off master level)
   */
  resetToDefaults(): void {
    this.reactionSpeed = 1.5;
    this.avoidanceSkill = 1.4;
    this.positioningSkill = 1.4;
    this.aggressionLevel = 0.6;
    this.saveLearningData();
    console.log('Bot reset to default values!');
    console.log('Skills - Reaction:', this.reactionSpeed, 'Avoidance:', this.avoidanceSkill, 'Positioning:', this.positioningSkill, 'Aggression:', this.aggressionLevel);
  }
  
  /**
   * Toggle master level on/off
   * If at master level, resets to defaults. Otherwise, sets to master level.
   */
  toggleMasterLevel(): void {
    // Check if currently at master level (all skills at max)
    const isAtMasterLevel = 
      this.reactionSpeed >= 2.0 &&
      this.avoidanceSkill >= 2.0 &&
      this.positioningSkill >= 2.0 &&
      this.aggressionLevel >= 0.85;
    
    if (isAtMasterLevel) {
      // Currently at master level - reset to defaults
      this.resetToDefaults();
    } else {
      // Not at master level - set to master level
      this.setMasterLevel();
    }
  }
  
  /**
   * Toggle fast learning mode
   */
  setFastLearning(enabled: boolean): void {
    this.fastLearningMode = enabled;
    this.learningMultiplier = enabled ? 25.0 : 1.0;
    console.log(`Fast learning mode: ${enabled ? 'ON (25x speed)' : 'OFF'}`);
  }
  
  /**
   * Load bot learning data from localStorage
   */
  private loadLearningData(): void {
    try {
      const saved = localStorage.getItem('round50_bot_learning');
      if (saved) {
        const data = JSON.parse(saved);
        this.gamesPlayed = data.gamesPlayed || 0;
        this.bestScore = data.bestScore || 0;
        this.bestRound = data.bestRound || 0;
        this.totalScore = data.totalScore || 0;
        this.averageScore = data.averageScore || 0;
        // Load with higher defaults if not saved
        this.reactionSpeed = data.reactionSpeed || 1.5;
        this.avoidanceSkill = data.avoidanceSkill || 1.4;
        this.positioningSkill = data.positioningSkill || 1.4;
        this.aggressionLevel = data.aggressionLevel || 0.6;
        this.laserConservationLevel = data.laserConservationLevel !== undefined ? data.laserConservationLevel : 0.4;
        this.laserUsageThreshold = data.laserUsageThreshold !== undefined ? data.laserUsageThreshold : 0.5;
        this.lastLaserUseRound = data.lastLaserUseRound || 0;
        this.fastLearningMode = data.fastLearningMode !== undefined ? data.fastLearningMode : true;
        this.learningMultiplier = this.fastLearningMode ? 25.0 : 1.0;
        this.bestLivesAtEnd = data.bestLivesAtEnd !== undefined ? data.bestLivesAtEnd : 3;
        this.bestLasersAtEnd = data.bestLasersAtEnd !== undefined ? data.bestLasersAtEnd : 5;
        
        // Load per-round enemy data
        if (data.enemyCountsByRound && Array.isArray(data.enemyCountsByRound)) {
          this.enemyCountsByRound.clear();
          for (const item of data.enemyCountsByRound) {
            this.enemyCountsByRound.set(item.round, {
              max: item.max,
              avg: item.avg,
              samples: item.samples,
              total: item.total
            });
          }
        }
        
        console.log('Bot learning data loaded:', {
          games: this.gamesPlayed,
          skillLevel: Math.round(this.getSkillLevel() * 100) + '%',
          fastLearning: this.fastLearningMode ? 'ON (25x)' : 'OFF'
        });
      } else {
        // First time - use higher starting values
        this.reactionSpeed = 1.5;
        this.avoidanceSkill = 1.4;
        this.positioningSkill = 1.4;
        this.aggressionLevel = 0.6;
        this.laserConservationLevel = 0.4;
        this.laserUsageThreshold = 0.5;
        this.lastLaserUseRound = 0;
        this.fastLearningMode = true;
        this.learningMultiplier = 25.0;
      }
    } catch (e) {
      console.warn('Failed to load bot learning data:', e);
    }
  }
  
  /**
   * Save bot learning data to localStorage
   */
  private saveLearningData(): void {
    try {
      const data = {
        gamesPlayed: this.gamesPlayed,
        bestScore: this.bestScore,
        bestRound: this.bestRound,
        totalScore: this.totalScore,
        averageScore: this.averageScore,
        reactionSpeed: this.reactionSpeed,
        avoidanceSkill: this.avoidanceSkill,
        positioningSkill: this.positioningSkill,
        aggressionLevel: this.aggressionLevel,
        laserConservationLevel: this.laserConservationLevel,
        laserUsageThreshold: this.laserUsageThreshold,
        lastLaserUseRound: this.lastLaserUseRound,
        fastLearningMode: this.fastLearningMode,
        bestLivesAtEnd: this.bestLivesAtEnd,
        bestLasersAtEnd: this.bestLasersAtEnd,
        enemyCountsByRound: Array.from(this.enemyCountsByRound.entries()).map(([round, data]) => ({
          round,
          max: data.max,
          avg: data.avg,
          samples: data.samples,
          total: data.total
        })),
      };
      localStorage.setItem('round50_bot_learning', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save bot learning data:', e);
    }
  }
  
  toggle(): void {
    this.isActive = !this.isActive;
    if (this.isActive) {
      // Reset movement state when bot is activated
      this.resetMovementState();
    }
  }
  
  isBotActive(): boolean {
    return this.isActive;
  }
  
  /**
   * Reset bot movement state (called when game restarts or bot is activated)
   */
  resetMovementState(): void {
    this.lastMoveX = 0;
    this.lastMoveY = 0;
    this.patrolDirection = 1; // Start moving right
    this.lastPatrolChange = 0;
    this.lastDecisionTime = 0; // Force immediate decision on next update
    this.lastLaserUseRound = 0; // Reset laser usage tracking
    
    // Reset game state tracking for new game
    this.lasersUsedThisGame = 0;
    this.maxEnemyCountThisGame = 0;
    this.averageEnemyCountThisGame = 0;
    this.enemyCountSamples = 0;
    this.totalEnemyCountThisGame = 0;
    this.currentRound = 1;
    this.currentRoundEnemyMax = 0;
    this.currentRoundEnemyTotal = 0;
    this.currentRoundEnemySamples = 0;
  }
  
  /**
   * Called when a game ends - analyze performance and improve
   * @param score Final score
   * @param round Final round reached
   * @param livesRemaining Lives remaining at game end
   * @param lasersRemaining Lasers remaining at game end
   */
  onGameEnd(score: number, round: number, livesRemaining: number = 0, lasersRemaining: number = 0): void {
    this.lastGameRound = round;
    this.gamesPlayed++;
    this.totalScore += score;
    this.averageScore = this.totalScore / this.gamesPlayed;
    
    // Calculate average enemy count for this game
    if (this.enemyCountSamples > 0) {
      this.averageEnemyCountThisGame = this.totalEnemyCountThisGame / this.enemyCountSamples;
    }
    
    // Save final round's enemy data before game ends
    if (this.currentRoundEnemySamples > 0) {
      const finalRoundAvg = this.currentRoundEnemyTotal / this.currentRoundEnemySamples;
      const existingData = this.enemyCountsByRound.get(this.currentRound);
      
      if (existingData) {
        // Update existing data (average of all games played)
        const totalSamples = existingData.samples + this.currentRoundEnemySamples;
        const combinedAvg = (existingData.avg * existingData.samples + finalRoundAvg * this.currentRoundEnemySamples) / totalSamples;
        existingData.max = Math.max(existingData.max, this.currentRoundEnemyMax);
        existingData.avg = combinedAvg;
        existingData.samples = totalSamples;
        existingData.total = existingData.total + this.currentRoundEnemyTotal;
      } else {
        // First time seeing this round
        this.enemyCountsByRound.set(this.currentRound, {
          max: this.currentRoundEnemyMax,
          avg: finalRoundAvg,
          samples: this.currentRoundEnemySamples,
          total: this.currentRoundEnemyTotal
        });
      }
    }
    
    // Calculate performance relative to bests
    const scoreRatio = this.bestScore > 0 ? score / this.bestScore : 1.0;
    const roundRatio = this.bestRound > 0 ? round / this.bestRound : 1.0;
    const performanceRatio = (scoreRatio + roundRatio) / 2;
    
    // Apply learning multiplier for fast learning mode
    const learningMult = this.fastLearningMode ? this.learningMultiplier : 1.0;
    
    // Update bests
    if (score > this.bestScore) {
      this.bestScore = score;
      this.improveSkills(0.15 * learningMult); // Big improvement for new best score (25x faster!)
    }
    if (round > this.bestRound) {
      this.bestRound = round;
      this.improveSkills(0.1 * learningMult); // Improvement for reaching new round (25x faster!)
    }
    
    // Learn from resource management (lives and lasers)
    if (livesRemaining > this.bestLivesAtEnd) {
      this.bestLivesAtEnd = livesRemaining;
      // Reward for conserving lives - improve avoidance skill
      this.improveSkills(0.08 * learningMult);
      if (!this.fastLearningMode) {
        console.log('Bot learned: Better life conservation!');
      }
    } else if (livesRemaining < this.bestLivesAtEnd * 0.5 && this.gamesPlayed > 3) {
      // Punish for poor life conservation (if significantly worse than best)
      this.improveSkills(-0.005 * learningMult);
    }
    
    if (lasersRemaining > this.bestLasersAtEnd) {
      this.bestLasersAtEnd = lasersRemaining;
      // Reward for conserving lasers - improve laser usage strategy
      this.improveSkills(0.05 * learningMult);
      if (!this.fastLearningMode) {
        console.log('Bot learned: Better laser conservation!');
      }
    }
    
    // Learn from laser usage efficiency
    const laserEfficiency = this.lasersUsedThisGame > 0 
      ? (score / this.lasersUsedThisGame) / 1000 // Points per laser used
      : 0;
    
    if (laserEfficiency > 50 && this.lasersUsedThisGame > 0) {
      // Good laser efficiency - slightly lower conservation (use lasers more)
      this.laserConservationLevel = Math.max(0.2, this.laserConservationLevel - 0.01 * learningMult);
      if (!this.fastLearningMode) {
        console.log('Bot learned: Lasers are effective, using them more!');
      }
    } else if (laserEfficiency < 20 && this.lasersUsedThisGame > 2) {
      // Poor laser efficiency - be more conservative
      this.laserConservationLevel = Math.min(0.7, this.laserConservationLevel + 0.01 * learningMult);
      if (!this.fastLearningMode) {
        console.log('Bot learned: Lasers not effective, conserving more!');
      }
    }
    
    // Learn from enemy density patterns (overall and per-round)
    // If bot performed well with high enemy density, improve positioning/aggression
    if (this.maxEnemyCountThisGame > 30 && performanceRatio > 0.8) {
      // Handled high enemy density well - improve positioning and aggression
      this.improveSkills(0.03 * learningMult);
      if (!this.fastLearningMode) {
        console.log('Bot learned: Better handling of high enemy density!');
      }
    } else if (this.maxEnemyCountThisGame > 30 && performanceRatio < 0.5) {
      // Struggled with high enemy density - improve avoidance
      this.avoidanceSkill = Math.min(2.0, this.avoidanceSkill + 0.02 * learningMult);
      if (!this.fastLearningMode) {
        console.log('Bot learned: Need better evasion for high enemy density!');
      }
    }
    
    // Learn from per-round enemy patterns
    // Analyze which rounds had unusually high/low enemy counts and adjust strategy
    for (const [roundNum, roundData] of this.enemyCountsByRound.entries()) {
      if (roundData.samples >= 2) { // Need at least 2 samples to learn patterns
        // If this round typically has many enemies and bot struggled, improve avoidance
        if (roundData.avg > 25 && round <= roundNum && performanceRatio < 0.6) {
          this.avoidanceSkill = Math.min(2.0, this.avoidanceSkill + 0.01 * learningMult);
          if (!this.fastLearningMode && round === roundNum) {
            console.log(`Bot learned: Round ${roundNum} has high enemy density (avg: ${Math.round(roundData.avg)}), improving evasion!`);
          }
        }
        // If bot handled a high-density round well, reward
        if (roundData.avg > 25 && round > roundNum && performanceRatio > 0.8) {
          this.improveSkills(0.02 * learningMult);
          if (!this.fastLearningMode) {
            console.log(`Bot learned: Successfully handled round ${roundNum} with ${Math.round(roundData.avg)} avg enemies!`);
          }
        }
      }
    }
    
    // Learn from round progression
    // If bot reached higher rounds with fewer resources, it's learning efficiency
    if (round > this.bestRound * 0.8 && (livesRemaining + lasersRemaining) < 3) {
      // Reached high round with low resources - learned efficiency
      this.improveSkills(0.04 * learningMult);
      if (!this.fastLearningMode) {
        console.log('Bot learned: Better resource efficiency!');
      }
    }
    
    // Gradual improvement based on performance
    if (score > this.averageScore * 0.8) {
      this.improveSkills(0.05 * learningMult); // Small improvement for above-average performance (25x faster!)
    }
    
    // Learn from poor performance (punishment for bad games) - reduced in fast learning mode
    if (performanceRatio < 0.5 && this.gamesPlayed > 3) {
      // If performance is less than 50% of best, slightly reduce skills
      // This teaches the bot that certain strategies don't work
      // In fast learning mode, reduce punishment
      const punishment = this.fastLearningMode ? -0.001 : -0.01;
      this.improveSkills(punishment);
      if (!this.fastLearningMode) {
        console.log('Bot learned from poor performance');
      }
    }
    
    // Always slight improvement (learning from experience) - 25x faster!
    this.improveSkills(0.02 * learningMult);
    
    // Save learning data after each game
    this.saveLearningData();
    
    console.log(`Bot Stats - Games: ${this.gamesPlayed}, Best Score: ${this.bestScore}, Best Round: ${this.bestRound}, Avg Score: ${Math.round(this.averageScore)}`);
    console.log(`Bot Skills - Reaction: ${this.reactionSpeed.toFixed(2)}, Avoidance: ${this.avoidanceSkill.toFixed(2)}, Positioning: ${this.positioningSkill.toFixed(2)}`);
    console.log(`Game Analysis - Lives: ${livesRemaining}, Lasers: ${lasersRemaining}, Lasers Used: ${this.lasersUsedThisGame}, Max Enemies: ${this.maxEnemyCountThisGame}, Avg Enemies: ${Math.round(this.averageEnemyCountThisGame)}`);
    
    // Show per-round enemy data for rounds played
    if (this.enemyCountsByRound.size > 0) {
      const roundsPlayed = Array.from(this.enemyCountsByRound.keys()).sort((a, b) => a - b);
      const recentRounds = roundsPlayed.slice(-5); // Show last 5 rounds
      console.log(`Per-Round Enemy Data (last 5 rounds):`);
      for (const roundNum of recentRounds) {
        const data = this.enemyCountsByRound.get(roundNum);
        if (data) {
          console.log(`  Round ${roundNum}: Max ${data.max}, Avg ${Math.round(data.avg)}, Samples ${data.samples}`);
        }
      }
    }
  }
  
  /**
   * Get expected enemy count for a round (based on learned patterns)
   * Returns average enemy count if known, otherwise null
   */
  getExpectedEnemyCountForRound(round: number): number | null {
    const roundData = this.enemyCountsByRound.get(round);
    if (roundData && roundData.samples >= 2) {
      return roundData.avg;
    }
    return null;
  }
  
  /**
   * Improve bot skills based on performance
   * @param amount Positive for improvement, negative for punishment
   */
  private improveSkills(amount: number): void {
    // Improve reaction speed (faster decisions)
    // Can improve up to 2.0, but never below 1.0 (higher minimum for better baseline)
    this.reactionSpeed = Math.max(1.0, Math.min(2.0, this.reactionSpeed + amount * 0.1));
    
    // Improve avoidance (better at dodging)
    // Can improve up to 2.0, but never below 1.0 (higher minimum for better baseline)
    this.avoidanceSkill = Math.max(1.0, Math.min(2.0, this.avoidanceSkill + amount * 0.15));
    
    // Improve positioning (better at shooting enemies)
    // Can improve up to 2.0, but never below 1.0 (higher minimum for better baseline)
    this.positioningSkill = Math.max(1.0, Math.min(2.0, this.positioningSkill + amount * 0.12));
    
    // Adjust aggression based on performance
    // Aggression = better target prioritization and faster alignment, NOT moving closer
    if (this.lastGameRound > 5) {
      this.aggressionLevel = Math.max(0.3, Math.min(0.9, this.aggressionLevel + amount * 0.05));
    } else {
      this.aggressionLevel = Math.max(0.3, Math.min(0.9, this.aggressionLevel - amount * 0.02));
    }
  }
  
  /**
   * Get current skill level (0-1)
   */
  getSkillLevel(): number {
    return (this.reactionSpeed + this.avoidanceSkill + this.positioningSkill) / 6.0;
  }
  
  /**
   * Update bot AI - decides where to move, when to shoot, and when to use lasers
   */
  update(
    player: Player,
    enemies: Enemy[],
    enemyProjectiles: Projectile[],
    gameWidth: number,
    gameHeight: number,
    frameCount: number,
    currentRound: number = 1,
    lives: number = 3
  ): { moveX: number; moveY: number; shouldShoot: boolean; shouldUseLaser: boolean } {
    if (!this.isActive) {
      return { moveX: 0, moveY: 0, shouldShoot: false, shouldUseLaser: false };
    }
    
    // Make decisions at intervals (faster with improved reaction speed)
    // Master level bots make decisions almost every frame
    const adjustedInterval = Math.max(1, this.decisionInterval / this.reactionSpeed);
    if (frameCount - this.lastDecisionTime < adjustedInterval) {
      // Even between decisions, continue last movement and keep shooting
      // This ensures constant movement even when making decisions frequently
      // But only if we have valid movement (not stale from previous game)
      if (this.lastMoveX !== 0 || this.lastMoveY !== 0) {
        return { moveX: this.lastMoveX, moveY: this.lastMoveY, shouldShoot: true, shouldUseLaser: false };
      }
      // If no valid movement, make a decision immediately
    }
    
    this.lastDecisionTime = frameCount;
    
    const playerBounds = player.getBounds();
    const playerCenterX = playerBounds.x + playerBounds.width / 2;
    const playerCenterY = playerBounds.y + playerBounds.height / 2;
    
    // Strategy: Stay in bottom half, constantly evade horizontally, position below enemies for shooting
    let moveX = 0;
    let moveY = 0;
    let shouldShoot = true;
    
    // Define bottom half constraint (stay below this Y position)
    const bottomHalfY = gameHeight / 2; // 75 pixels for 150 height game
    const preferredBottomY = gameHeight * 0.92; // Prefer staying at the very bottom (along the base)
    
    // Update patrol direction periodically for constant horizontal evasion
    if (frameCount - this.lastPatrolChange > this.patrolChangeInterval) {
      // Randomly change direction or reverse if near edge
      if (playerCenterX < gameWidth * 0.2 || playerCenterX > gameWidth * 0.8) {
        this.patrolDirection *= -1; // Reverse direction near edges
      } else if (Math.random() < 0.3) {
        this.patrolDirection *= -1; // 30% chance to randomly reverse
      }
      this.lastPatrolChange = frameCount;
    }
    
    // Find nearest threat (projectile or close enemy)
    // Use predicted positions for better evasion
    // PROJECTILES GET PRIORITY - check them first and more aggressively
    let nearestThreat: Projectile | Enemy | null = null;
    let nearestThreatDistance = Infinity;
    let nearestThreatPredictedPos: { x: number; y: number } | null = null;
    
    // Projectiles: Much larger detection range (they move fast!)
    const projectileDetectionRange = 100 * this.avoidanceSkill; // Increased from 60
    // Enemies: Standard detection range (not used in this scope, but kept for clarity)
    
    // PRIORITY: Check projectiles first (they're the most dangerous)
    for (const projectile of enemyProjectiles) {
      if (projectile.type !== ProjectileType.ENEMY) continue;
      
      const projBounds = projectile.getBounds();
      const projX = projBounds.x + projBounds.width / 2;
      const projY = projBounds.y + projBounds.height / 2;
      
      // Check if projectile is heading toward player
      const dx = playerCenterX - projX;
      const dy = playerCenterY - projY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // For projectiles, use simpler but more aggressive detection
      // Most projectiles come straight down, so check if it's above player
      const isAbovePlayer = projY < playerCenterY;
      const horizontalDistance = Math.abs(dx);
      
      // Predict projectile position (projectiles move fast, predict 10 frames ahead)
      const projVx = projectile.vx;
      const projVy = projectile.vy;
      const predictionFrames = 10; // Predict further ahead
      const futureProjX = projX + projVx * predictionFrames;
      const futureProjY = projY + projVy * predictionFrames;
      
      // Check if projectile will be near player's X position
      const futureHorizontalDistance = Math.abs(futureProjX - playerCenterX);
      const futureVerticalDistance = futureProjY - playerCenterY; // Positive = below player
      
      // AGGRESSIVE DETECTION: Any projectile above player and within horizontal range
      // OR any projectile that will be near player's position
      const willBeNearPlayer = futureHorizontalDistance < 25 && futureVerticalDistance > -10 && futureVerticalDistance < 30;
      const isThreatening = (isAbovePlayer && horizontalDistance < 30) || willBeNearPlayer;
      
      if (distance < projectileDetectionRange && isThreatening) {
        // Projectile is a threat - prioritize it
        if (distance < nearestThreatDistance) {
          nearestThreat = projectile;
          nearestThreatDistance = distance;
          // Predict projectile position
          nearestThreatPredictedPos = {
            x: futureProjX,
            y: futureProjY
          };
        }
      }
    }
    
    // Check for close enemies (breakaway enemies are especially dangerous)
    // Use predicted positions to anticipate enemy movement
    // Only check enemies if no immediate projectile threat (projectiles take priority!)
    if (nearestThreatDistance > 50) { // Increased threshold - projectiles take absolute priority
      for (const enemy of enemies) {
        // Predict enemy position (look 10 frames ahead)
        const predictedPos = this.predictEnemyPosition(enemy, 10);
        const dx = playerCenterX - predictedPos.x;
        const dy = playerCenterY - predictedPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if enemy is breakaway (moving toward player) - these are high priority
        const isBreakaway = this.isBreakawayEnemy(enemy, playerCenterX, playerCenterY);
        const threatLevel = this.getEnemyThreatLevel(enemy, playerCenterX, playerCenterY, predictedPos);
        
        // Breakaway enemies or high-threat enemies within range
        if ((isBreakaway && distance < 60) || (threatLevel > 0.3 && distance < 40)) {
          if (distance < nearestThreatDistance) {
            nearestThreat = enemy;
            nearestThreatDistance = distance;
            nearestThreatPredictedPos = predictedPos;
          }
        }
      }
    }
    
    // PRIORITY 0: ALWAYS EVADE THREATS FIRST - Never forget to evade!
    if (nearestThreat) {
      // Check if threat is a projectile (projectiles need special handling)
      const isProjectile = 'type' in nearestThreat && nearestThreat.type === ProjectileType.ENEMY;
      
      // Use predicted position if available, otherwise use current position
      let threatX: number;
      let threatY: number;
      
      if (nearestThreatPredictedPos) {
        threatX = nearestThreatPredictedPos.x;
        threatY = nearestThreatPredictedPos.y;
      } else {
        const threatBounds = nearestThreat.getBounds();
        threatX = threatBounds.x + threatBounds.width / 2;
        threatY = threatBounds.y + threatBounds.height / 2;
      }
      
      // Calculate optimal escape direction (improved with avoidance skill)
      const dx = playerCenterX - threatX;
      const dy = playerCenterY - threatY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Get threat velocity
      const threatVx = 'vx' in nearestThreat ? nearestThreat.vx : 0;
      const threatVy = 'vy' in nearestThreat ? nearestThreat.vy : 0;
      
      // PROJECTILE EVASION: Prioritize vertical movement (up/down)
      if (isProjectile) {
        // For projectiles, prioritize vertical evasion (up/down movement)
        // Move away from the projectile vertically
        
        // Determine which direction to move (up or down)
        // If projectile is above player, move down. If below, move up.
        if (threatY < playerCenterY) {
          // Projectile is above - move down
          moveY = 1.0; // Move down
        } else {
          // Projectile is below - move up
          moveY = -1.0; // Move up
        }
        
        // For projectiles, use maximum vertical speed
        moveY *= this.avoidanceSkill * 1.5; // Strong vertical evasion
        
        // Horizontal movement for projectiles (only if projectile is very close horizontally)
        if (Math.abs(dx) < 10) {
          // Projectile is very close horizontally - move away horizontally
          moveX = dx > 0 ? -1.0 : 1.0; // Move away horizontally
          moveX *= this.avoidanceSkill;
        } else {
          // No horizontal movement - pure vertical evasion
          moveX = 0;
        }
        
        // Clamp movement
        moveX = Math.max(-1, Math.min(1, moveX));
        moveY = Math.max(-1, Math.min(1, moveY));
        
        // PROJECTILES: No gap-finding, no return-to-base - pure evasion only
        // Skip all other logic when evading projectiles
      } else {
        // ENEMY EVASION: Prioritize vertical movement (up/down)
        // Calculate perpendicular escape direction (prioritize vertical)
        let escapeX = threatVy; // Perpendicular to threat velocity (vertical priority)
        let escapeY = -threatVx;
        let escapeLength = Math.sqrt(escapeX * escapeX + escapeY * escapeY);
        
        // If enemy has no clear velocity, escape vertically away
        if (escapeLength < 0.1) {
          escapeX = 0;
          escapeY = dy > 0 ? 1 : -1; // Move away vertically
          escapeLength = 1;
        }
        
        if (escapeLength > 0) {
          // Enemies: strong vertical priority (1.5x), reduced horizontal (0.6x)
          moveX = (escapeX / escapeLength) * this.avoidanceSkill * 0.6;
          moveY = (escapeY / escapeLength) * this.avoidanceSkill * 1.5;
          
          // Also add component away from threat (prioritize vertical escape)
          moveX += (dx / distance) * 0.3 * this.avoidanceSkill;
          moveY += (dy / distance) * 0.7 * this.avoidanceSkill;
        } else {
          // Fallback: escape vertically
          const escapeDistance = Math.sqrt(dx * dx + dy * dy);
          if (escapeDistance > 0) {
            moveX = (dx / escapeDistance) * this.avoidanceSkill * 0.5;
            moveY = (dy / escapeDistance) * this.avoidanceSkill * 1.2;
          } else {
            moveX = 0;
            moveY = dy > 0 ? 1 : -1;
          }
        }
        
        // Clamp movement
        moveX = Math.max(-1, Math.min(1, moveX));
        moveY = Math.max(-1, Math.min(1, moveY));
        
        // AFTER evading enemies, check if we can find a gap to move toward shooting position
        // Only consider gap-finding if threat is not immediate
        if (nearestThreatDistance > 40) { // Increased threshold for enemies (was 30)
          // Find best target for shooting
          let bestTarget: Enemy | null = null;
          let bestScore = -Infinity;
          
          for (const enemy of enemies) {
            const enemyBounds = enemy.getBounds();
            const enemyX = enemyBounds.x + enemyBounds.width / 2;
            const enemyY = enemyBounds.y + enemyBounds.height / 2;
            
            const dx = enemyX - playerCenterX;
            const dy = enemyY - playerCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Score targets: prefer enemies above player
            let score = 100 / (distance + 1);
            if (dy < 0) score += 40; // Bonus for enemies above
            if (Math.abs(dx) < 15) score += 50; // Bonus for horizontal alignment
            
            if (score > bestScore) {
              bestScore = score;
              bestTarget = enemy;
            }
          }
          
          // Try to find a gap toward the shooting position
          if (bestTarget) {
            const gapDirection = this.findGapToShootingPosition(
              playerCenterX,
              playerCenterY,
              enemies,
              enemyProjectiles,
              bestTarget,
              gameWidth,
              gameHeight
            );
            
            if (gapDirection) {
              // Found a gap! Make a stride toward shooting position
              // Blend evasion with gap movement (60% gap, 40% evasion)
              moveX = moveX * 0.4 + gapDirection.x * 0.6 * this.positioningSkill;
              moveY = moveY * 0.4 + gapDirection.y * 0.6 * this.positioningSkill;
              
              // Clamp movement
              moveX = Math.max(-1, Math.min(1, moveX));
              moveY = Math.max(-1, Math.min(1, moveY));
            } else {
              // No clear gap found, check if we can return to base
              const bottom25PercentY = gameHeight * 0.75;
              let enemiesInBottom25Percent = false;
              
              for (const enemy of enemies) {
                const enemyBounds = enemy.getBounds();
                const enemyY = enemyBounds.y + enemyBounds.height / 2;
                if (enemyY > bottom25PercentY) {
                  enemiesInBottom25Percent = true;
                  break;
                }
              }
              
              // If no enemies in bottom 25% and we're above base, try to return while evading
              if (!enemiesInBottom25Percent && playerCenterY < preferredBottomY) {
                moveY = Math.max(0.2, moveY * 0.7); // Reduce upward evasion slightly
              }
            }
          } else {
            // No target, check if we can return to base
            const bottom25PercentY = gameHeight * 0.75;
            let enemiesInBottom25Percent = false;
            
            for (const enemy of enemies) {
              const enemyBounds = enemy.getBounds();
              const enemyY = enemyBounds.y + enemyBounds.height / 2;
              if (enemyY > bottom25PercentY) {
                enemiesInBottom25Percent = true;
                break;
              }
            }
            
            if (!enemiesInBottom25Percent && playerCenterY < preferredBottomY) {
              moveY = Math.max(0.2, moveY * 0.7);
            }
          }
          // If enemy threat is very close (< 40 pixels), pure evasion only - no gap finding
        }
      } // End of else block for isProjectile
    } else {
      // No immediate projectile threat - but still check for close enemies and position to shoot
      // Continue constant horizontal patrol for evasion even when no threats
      if (enemies.length === 0) {
        // No enemies - AGGRESSIVE: long fast horizontal sweeps along the base
        const sweepSpeed = 1.0 + (this.aggressionLevel * 0.5); // 1.0 to 1.5x speed
        moveX = this.patrolDirection * sweepSpeed * this.avoidanceSkill;
        
        // Return to base if above it
        if (playerCenterY < preferredBottomY) {
          const returnSpeed = 0.7 + (this.aggressionLevel * 0.3); // Faster return with aggression
          moveY = returnSpeed * this.positioningSkill; // Move down to base
        } else {
          moveY = 0.2 * this.positioningSkill; // Stay at base
        }
      } else if (enemies.length > 0) {
        // First, check for enemies that are too close (collision risk)
        let nearestEnemy: Enemy | null = null;
        let nearestEnemyDistance = Infinity;
        const collisionThreshold = 25; // Distance to consider as collision risk
        
        for (const enemy of enemies) {
          const enemyBounds = enemy.getBounds();
          const enemyX = enemyBounds.x + enemyBounds.width / 2;
          const enemyY = enemyBounds.y + enemyBounds.height / 2;
          
          const dx = enemyX - playerCenterX;
          const dy = enemyY - playerCenterY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < nearestEnemyDistance) {
            nearestEnemyDistance = distance;
            nearestEnemy = enemy;
          }
        }
        
        // If enemy is too close, prioritize avoiding collision
        // AGGRESSIVE EVASION: Allow rapid upward movement if enemy is descending
        if (nearestEnemy && nearestEnemyDistance < collisionThreshold) {
          const enemyBounds = nearestEnemy.getBounds();
          const enemyX = enemyBounds.x + enemyBounds.width / 2;
          const enemyY = enemyBounds.y + enemyBounds.height / 2;
          
          const dx = playerCenterX - enemyX;
          const dy = playerCenterY - enemyY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Check if enemy is descending (moving down toward player)
          // Enemy is above player (enemyY < playerY) and moving down (vy > 0)
          const enemyVy = nearestEnemy.vy || 0.1; // Default downward movement
          const isEnemyDescending = enemyY < playerCenterY && enemyVy > 0;
          const isEnemyCloseAbove = enemyY < playerCenterY && Math.abs(dx) < 15;
          
          if (distance > 0) {
            if (isEnemyDescending && isEnemyCloseAbove && distance < 30) {
              // RAPID UPWARD EVASION: Enemy descending directly above - move up quickly!
              // Aggression makes this faster
              const evasionSpeed = 1.5 + (this.aggressionLevel * 0.5); // 1.5 to 2.0 speed
              moveX = (dx > 0 ? 1 : -1) * evasionSpeed * this.avoidanceSkill; // Horizontal escape
              moveY = -evasionSpeed * this.avoidanceSkill; // Rapid upward movement
              
              // Also move horizontally away from enemy
              if (Math.abs(dx) > 3) {
                moveX = (dx / Math.abs(dx)) * evasionSpeed * this.avoidanceSkill;
              }
            } else {
              // Normal evasion - prioritize horizontal escape
              const evasionSpeed = 1.2 + (this.aggressionLevel * 0.3); // Faster with aggression
              moveX = (dx / distance) * this.avoidanceSkill * evasionSpeed; // Strong horizontal escape
              moveY = (dy / distance) * this.avoidanceSkill * 0.4; // Reduced vertical movement
              
              // Always prefer horizontal escape
              if (Math.abs(dx) > 5) {
                moveY *= 0.3; // Further reduce vertical if we can escape horizontally
              }
            }
          }
        } else {
          // No collision risk - find best target for shooting
          let bestTarget: Enemy | null = null;
          let bestScore = -Infinity;
          
          for (const enemy of enemies) {
            const enemyBounds = enemy.getBounds();
            const enemyX = enemyBounds.x + enemyBounds.width / 2;
            const enemyY = enemyBounds.y + enemyBounds.height / 2;
            
            const dx = enemyX - playerCenterX;
            const dy = enemyY - playerCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Score targets: prefer enemies ABOVE player (so we can shoot up at them)
            // Prioritize horizontal alignment and enemies in upper half
            let score = 100 / (distance + 1); // Closer is better (but not too close)
            if (distance < collisionThreshold) {
              score -= 100; // Heavy penalty for enemies too close - never approach!
            }
            
            // FIXED: Prefer enemies ABOVE player (enemyY < playerY means enemy is above)
            // Player should be BELOW enemies to shoot up at them
            if (dy < 0) score += 40; // BIG bonus for enemies above player (dy < 0 means enemy above)
            if (enemyY < playerCenterY) score += 30; // Prefer enemies above player (enemyY < playerY)
            
            // Prioritize horizontal alignment (left/right alignment)
            if (Math.abs(dx) < 15) score += 50; // BIG bonus for horizontal alignment (can shoot straight up)
            if (Math.abs(dx) < 30) score += 20; // Medium bonus for near alignment
            
            // Prefer enemies in upper half of screen (where they spawn)
            if (enemyY < bottomHalfY) score += 15; // Bonus for enemies in upper half
            
            // Penalize enemies that are too close vertically (collision risk)
            if (Math.abs(dy) < 20) score -= 20; // Penalty for enemies at similar vertical level (too close)
            
            // With better positioning skill, prefer enemies that are easier to hit
            if (this.positioningSkill > 1.5) {
              // Advanced: prefer enemies that are moving predictably
              score += 10;
              
              // Master level: prefer enemies that are in line formation (easier to hit)
              const enemyBounds = enemy.getBounds();
              // Check if enemy is likely in a line (has similar Y to other enemies)
              const similarYEnemies = enemies.filter(e => {
                const eBounds = e.getBounds();
                return Math.abs(eBounds.y - enemyBounds.y) < 5;
              }).length;
              if (similarYEnemies > 2) {
                score += 15; // Bonus for enemies in formations
              }
            }
            
            // Master level: prioritize high-value targets (diamonds, haters)
            if (this.positioningSkill > 1.8) {
              if (enemy.type === EnemyType.DIAMOND) score += 20; // Diamonds (high value)
              if (enemy.type === EnemyType.HATER) score += 25; // Haters (high value, dangerous)
            }
            
            if (score > bestScore) {
              bestScore = score;
              bestTarget = enemy;
            }
          }
        
        if (bestTarget) {
          // Use predicted position for better targeting (especially for BRAIN wave patterns)
          const predictedPos = this.predictEnemyPosition(bestTarget, 15);
          const enemyX = predictedPos.x;
          const enemyY = predictedPos.y;
          
          // Positioning: align horizontally below enemy, stay in bottom half
          const dx = enemyX - playerCenterX;
          const dy = enemyY - playerCenterY; // Negative if enemy is above player (good!)
          const currentDistance = Math.sqrt(dx * dx + dy * dy);
          
          // Safe distance - NEVER approach closer than this
          const safeDistance = 35; // Minimum safe distance from enemies
          
          // PRIORITY 1: Horizontal alignment (left/right positioning)
          // AGGRESSIVE MOVEMENT: Faster/longer movements based on aggression
          const baseMovementSpeed = this.positioningSkill;
          const aggressiveMultiplier = 1.0 + (this.aggressionLevel * 0.6); // 1.0 to 1.6x speed
          
          if (Math.abs(dx) > 2) {
            // Move horizontally to align with enemy - AGGRESSIVE: rapid long moves
            moveX = (dx > 0 ? 1 : -1) * baseMovementSpeed * aggressiveMultiplier;
            // Add patrol component even when aligning (ensures constant movement)
            moveX += this.patrolDirection * 0.4 * this.avoidanceSkill * aggressiveMultiplier;
          } else {
            // Already aligned - AGGRESSIVE: long fast horizontal sweeps
            const sweepSpeed = 1.2 + (this.aggressionLevel * 0.5); // 1.2 to 1.7x speed
            moveX = this.patrolDirection * sweepSpeed * this.avoidanceSkill;
          }
          
          // PRIORITY 2: Return to base after evading OR stay at base
          // Check if enemies are in bottom 25% (waiting for wrap-around)
          const bottom25PercentY = gameHeight * 0.75; // 112.5 pixels for 150 height
          let enemiesInBottom25Percent = false;
          
          for (const enemy of enemies) {
            const enemyBounds = enemy.getBounds();
            const enemyY = enemyBounds.y + enemyBounds.height / 2;
            if (enemyY > bottom25PercentY) {
              enemiesInBottom25Percent = true;
              break;
            }
          }
          
          if (playerCenterY < preferredBottomY) {
            // Above base - check if safe to return
            if (!enemiesInBottom25Percent) {
              // No enemies in bottom 25% - RAPID RETURN to base
              const returnSpeed = 0.8 + (this.aggressionLevel * 0.4); // 0.8 to 1.2x speed
              moveY = returnSpeed * this.positioningSkill; // Fast downward movement to reach base
          } else {
              // Enemies in bottom 25% - stay above and wait for wrap-around
              // Maintain current position or slight upward bias
              moveY = -0.2 * this.positioningSkill; // Slight upward to stay above
            }
          } else {
            // At or near the base - maintain position at bottom
            moveY = 0.2 * this.positioningSkill; // Slight downward bias to stay at base
          }
          
          // PRIORITY 3: Maintain safe distance - AGGRESSIVE EVASION (ALWAYS EVADE FIRST!)
          // Check if enemy is descending and close
          const enemyVy = bestTarget.vy || 0.1; // Enemy vertical velocity (positive = descending)
          const isEnemyDescending = enemyY < playerCenterY && enemyVy > 0; // Enemy above and moving down
          const isEnemyCloseAbove = enemyY < playerCenterY && Math.abs(dx) < 20; // Enemy directly above
          
          if (currentDistance < safeDistance) {
            // Too close! PURE EVASION ONLY - Never try to return to base when evading!
            const escapeDx = playerCenterX - enemyX;
            const escapeDy = playerCenterY - enemyY;
            const escapeDist = Math.sqrt(escapeDx * escapeDx + escapeDy * escapeDy);
            
            if (escapeDist > 0) {
              if (isEnemyDescending && isEnemyCloseAbove) {
                // Enemy descending above - RAPID UPWARD EVASION (pure evasion, no return to base)
                const evasionSpeed = 1.6 + (this.aggressionLevel * 0.4); // 1.6 to 2.0x speed
                moveX = (escapeDx / escapeDist) * evasionSpeed * this.avoidanceSkill;
                moveY = -evasionSpeed * this.avoidanceSkill; // Rapid upward - pure evasion only
                // Don't try to return to base when actively evading descending enemy!
              } else {
                // Normal escape - strong horizontal, minimal vertical (pure evasion)
                const escapeSpeed = 1.5 + (this.aggressionLevel * 0.3); // Faster with aggression
                moveX = (escapeDx / escapeDist) * escapeSpeed * this.avoidanceSkill;
                moveY = (escapeDy / escapeDist) * 0.3 * this.avoidanceSkill;
                // Pure evasion when too close - don't try to return to base
              }
            }
            // When too close, evasion takes absolute priority - return to base logic is skipped
          }
          // If safe distance maintained, return to base logic in PRIORITY 2 will handle it
          
          // Aggression now means: faster target acquisition and better target prioritization
          // NOT moving closer - that's handled above with safe distance
          // Aggression is already reflected in shooting (shouldShoot = true) and faster alignment
        } else {
          // No good target - AGGRESSIVE: long fast horizontal sweeps
          const sweepSpeed = 1.0 + (this.aggressionLevel * 0.5); // 1.0 to 1.5x speed
          moveX = this.patrolDirection * sweepSpeed * this.avoidanceSkill;
          
          // Return to base if above it, but check for enemies in bottom 25%
          const bottom25PercentY = gameHeight * 0.75;
          let enemiesInBottom25Percent = false;
          
          for (const enemy of enemies) {
            const enemyBounds = enemy.getBounds();
            const enemyY = enemyBounds.y + enemyBounds.height / 2;
            if (enemyY > bottom25PercentY) {
              enemiesInBottom25Percent = true;
              break;
            }
          }
          
          if (playerCenterY < preferredBottomY) {
            if (!enemiesInBottom25Percent) {
              // No enemies in bottom 25% - return to base
              const returnSpeed = 0.7 + (this.aggressionLevel * 0.3); // Faster return with aggression
              moveY = returnSpeed * this.positioningSkill; // Move down to base
            } else {
              // Enemies in bottom 25% - stay above (wait for wrap-around)
              moveY = -0.1 * this.positioningSkill; // Slight upward to stay above
            }
          } else {
            moveY = 0.2 * this.positioningSkill; // Stay at base
          }
        }
        }
      }
    }
    
    // Allow upward movement for evasion, but prefer staying in bottom half
    // Only prevent going too high if not actively evading
    const newY = playerBounds.y + moveY * player.speed;
    // Allow upward movement if moving up (evading), but encourage return to base
    if (newY + playerBounds.height / 2 < bottomHalfY && moveY >= 0) {
      // Not actively evading upward - encourage staying in bottom half
      // But don't force - allow upward evasion when needed
    }
    
    // Keep player in bounds
    const newX = playerBounds.x + moveX * player.speed;
    
    if (newX < 0 || newX + playerBounds.width > gameWidth) {
      moveX = 0;
      // Reverse patrol direction when hitting edge
      this.patrolDirection *= -1;
      this.lastPatrolChange = frameCount;
    }
    
    // Ensure we don't go below screen or above bottom half
    const finalY = playerBounds.y + moveY * player.speed;
    if (finalY < 0) {
      moveY = 0;
    }
    if (finalY + playerBounds.height > gameHeight) {
      moveY = 0;
    }
    
    // Final check: if somehow above bottom half, force down
    if (playerCenterY < bottomHalfY) {
      moveY = Math.max(0.4, moveY || 0.4);
    }
    
    // Ensure minimum movement - bot should NEVER be completely still
    // Even when perfectly positioned, maintain constant horizontal patrol
    if (Math.abs(moveX) < 0.3) {
      moveX = this.patrolDirection * 0.8 * this.avoidanceSkill;
    }
    
    // Store movement for continuation between decision frames
    this.lastMoveX = moveX;
    this.lastMoveY = moveY;
    
    // Track enemy count for learning (overall and per-round)
    const currentEnemyCount = enemies.length;
    
    // Detect round change and save previous round's data
    if (currentRound !== this.currentRound) {
      // Round changed - save previous round's enemy data
      if (this.currentRoundEnemySamples > 0) {
        const prevRoundAvg = this.currentRoundEnemyTotal / this.currentRoundEnemySamples;
        const existingData = this.enemyCountsByRound.get(this.currentRound);
        
        if (existingData) {
          // Update existing data (average of all games played)
          const totalSamples = existingData.samples + this.currentRoundEnemySamples;
          const combinedAvg = (existingData.avg * existingData.samples + prevRoundAvg * this.currentRoundEnemySamples) / totalSamples;
          existingData.max = Math.max(existingData.max, this.currentRoundEnemyMax);
          existingData.avg = combinedAvg;
          existingData.samples = totalSamples;
          existingData.total = existingData.total + this.currentRoundEnemyTotal;
        } else {
          // First time seeing this round
          this.enemyCountsByRound.set(this.currentRound, {
            max: this.currentRoundEnemyMax,
            avg: prevRoundAvg,
            samples: this.currentRoundEnemySamples,
            total: this.currentRoundEnemyTotal
          });
        }
      }
      
      // Reset for new round
      this.currentRound = currentRound;
      this.currentRoundEnemyMax = 0;
      this.currentRoundEnemyTotal = 0;
      this.currentRoundEnemySamples = 0;
    }
    
    // Track overall enemy count
    if (currentEnemyCount > this.maxEnemyCountThisGame) {
      this.maxEnemyCountThisGame = currentEnemyCount;
    }
    this.totalEnemyCountThisGame += currentEnemyCount;
    this.enemyCountSamples++;
    
    // Track per-round enemy count
    if (currentEnemyCount > this.currentRoundEnemyMax) {
      this.currentRoundEnemyMax = currentEnemyCount;
    }
    this.currentRoundEnemyTotal += currentEnemyCount;
    this.currentRoundEnemySamples++;
    
    // Track starting laser count (first time we check, when game just started)
    if (this.lasersAvailableAtStart === 5 && this.enemyCountSamples === 1) {
      // Game just started (first sample), record initial laser count
      const initialLaserCount = player.getLaserCount();
      if (initialLaserCount > 0) {
        this.lasersAvailableAtStart = initialLaserCount;
      }
    }
    
    // LASER USAGE DECISION - Use lasers strategically as last resort
    let shouldUseLaser = false;
    const laserCount = player.getLaserCount();
    
    // Only consider using laser if we have lasers available
    if (laserCount > 0) {
      // Calculate threat level (0-1)
      let threatLevel = 0;
      
      // Factor 1: Number of enemies close to player
      const closeEnemyThreshold = 40;
      let closeEnemies = 0;
      for (const enemy of enemies) {
        const enemyBounds = enemy.getBounds();
        const enemyX = enemyBounds.x + enemyBounds.width / 2;
        const enemyY = enemyBounds.y + enemyBounds.height / 2;
        const dx = playerCenterX - enemyX;
        const dy = playerCenterY - enemyY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < closeEnemyThreshold) {
          closeEnemies++;
        }
      }
      threatLevel += Math.min(closeEnemies / 5, 0.4); // Up to 40% from close enemies
      
      // Factor 2: Number of enemy projectiles threatening player
      let threateningProjectiles = 0;
      for (const projectile of enemyProjectiles) {
        if (projectile.type !== ProjectileType.ENEMY) continue;
        const projBounds = projectile.getBounds();
        const projX = projBounds.x + projBounds.width / 2;
        const projY = projBounds.y + projBounds.height / 2;
        const dx = playerCenterX - projX;
        const dy = playerCenterY - projY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 30) {
          threateningProjectiles++;
        }
      }
      threatLevel += Math.min(threateningProjectiles / 3, 0.3); // Up to 30% from projectiles
      
      // Factor 3: Low health (lives remaining)
      if (lives <= 1) {
        threatLevel += 0.3; // 30% bonus if on last life
      } else if (lives === 2) {
        threatLevel += 0.15; // 15% bonus if on second-to-last life
      }
      
      // Factor 4: High round number (harder rounds)
      if (currentRound > 20) {
        threatLevel += 0.1; // 10% bonus for high rounds
      } else if (currentRound > 10) {
        threatLevel += 0.05; // 5% bonus for medium rounds
      }
      
      // Factor 5: Many enemies in laser range (potential multi-kill)
      let enemiesInLaserRange = 0;
      for (const enemy of enemies) {
        const enemyBounds = enemy.getBounds();
        const enemyX = enemyBounds.x + enemyBounds.width / 2;
        const enemyY = enemyBounds.y + enemyBounds.height / 2;
        const dx = playerCenterX - enemyX;
        const dy = playerCenterY - enemyY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= 80) { // Laser range
          enemiesInLaserRange++;
        }
      }
      if (enemiesInLaserRange >= 3) {
        threatLevel += 0.2; // 20% bonus if can hit 3+ enemies
      } else if (enemiesInLaserRange >= 2) {
        threatLevel += 0.1; // 10% bonus if can hit 2+ enemies
      }
      
      // Clamp threat level to 0-1
      threatLevel = Math.min(1.0, threatLevel);
      
      // STRATEGIC RESOURCE COMPARISON: Compare lasers vs lives to determine trade-off
      // If we have more lasers than lives, use lasers more liberally to protect lives
      // If we have more lives than lasers, be more conservative and risk taking damage
      let resourceComparisonModifier = 0;
      
      if (laserCount > lives) {
        // More lasers than lives: use lasers to protect lives (more willing to use)
        // Example: 5 lasers, 1 life → very willing to use laser to protect that life
        const laserToLifeRatio = laserCount / Math.max(lives, 1);
        resourceComparisonModifier = Math.min(0.2, (laserToLifeRatio - 1) * 0.1); // Up to +0.2 bonus
      } else if (lives > laserCount) {
        // More lives than lasers: conserve lasers, risk taking damage (less willing to use)
        // Example: 3 lives, 1 laser → be conservative, save the laser
        const lifeToLaserRatio = lives / Math.max(laserCount, 1);
        resourceComparisonModifier = -Math.min(0.15, (lifeToLaserRatio - 1) * 0.05); // Up to -0.15 penalty
      }
      // If lasers == lives, no modifier (balanced resources)
      
      // CONSERVATION: Don't use lasers too frequently (but allow more strategic use)
      const roundsSinceLastLaser = currentRound - this.lastLaserUseRound;
      const minRoundsBetweenLasers = Math.max(2, Math.floor(8 * this.laserConservationLevel)); // 2-3 rounds (reduced from 3-7)
      
      // DECISION: Use laser if threat level exceeds threshold AND enough rounds have passed
      // More permissive: allow use if threat is moderate-high OR emergency situation
      const canUseLaser = roundsSinceLastLaser >= minRoundsBetweenLasers || threatLevel > 0.85; // Emergency override (lowered from 0.9)
      
      // Apply resource comparison modifier to threshold (lower threshold = more willing to use)
      const adjustedThreshold = this.laserUsageThreshold - resourceComparisonModifier;
      const shouldUseBasedOnThreat = threatLevel > adjustedThreshold;
      
      // Additional factor: If we have many lasers (3+), be slightly more willing to use them
      const laserAbundanceBonus = laserCount >= 3 ? 0.05 : 0; // Small bonus if we have plenty
      const adjustedThreatLevel = threatLevel + laserAbundanceBonus;
      
      // Use laser if conditions are met (with adjusted threat level and threshold)
      if (canUseLaser && (adjustedThreatLevel > adjustedThreshold || shouldUseBasedOnThreat)) {
        shouldUseLaser = true;
        this.lastLaserUseRound = currentRound;
        this.lasersUsedThisGame++; // Track laser usage for learning
      }
    }
    
    return { moveX, moveY, shouldShoot, shouldUseLaser };
  }

  /**
   * Predict where an enemy will be in the near future based on its movement pattern
   * @param enemy The enemy to predict
   * @param lookAheadFrames How many frames ahead to predict (default 10)
   * @returns Predicted position {x, y}
   */
  private predictEnemyPosition(enemy: Enemy, lookAheadFrames: number = 10): { x: number; y: number } {
    const enemyBounds = enemy.getBounds();
    let predictedX = enemyBounds.x + enemyBounds.width / 2;
    let predictedY = enemyBounds.y + enemyBounds.height / 2;
    
    // Use velocity to predict movement
    const vx = enemy.vx;
    const vy = enemy.vy;
    
    // Check if enemy is breakaway (moving independently with significant velocity)
    const speed = Math.sqrt(vx * vx + vy * vy);
    const isBreakaway = speed > 0.5; // Breakaway enemies move faster
    
    if (isBreakaway) {
      // Breakaway enemy: predict based on velocity
      predictedX += vx * lookAheadFrames;
      predictedY += vy * lookAheadFrames;
    } else if (enemy.type === EnemyType.BRAIN) {
      // BRAIN enemies have wave pattern - estimate wave movement
      // Wave pattern: oscillates up/down with amplitude 2-5px and frequency 0.02-0.05
      // We can't access patternTime directly, but we can estimate based on current position
      // For simplicity, assume they continue their current vertical trend
      // The wave pattern is relatively slow, so we use a conservative estimate
      const waveEstimate = Math.sin(lookAheadFrames * 0.03) * 3; // Rough estimate
      predictedY += waveEstimate;
      // BRAIN enemies in line still move horizontally with the line
      predictedX += vx * lookAheadFrames;
    } else {
      // Normal line enemy: predict based on line movement (velocity)
      predictedX += vx * lookAheadFrames;
      predictedY += vy * lookAheadFrames;
    }
    
    // Clamp to game bounds
    predictedX = Math.max(0, Math.min(predictedX, 200)); // Assuming gameWidth = 200
    predictedY = Math.max(0, Math.min(predictedY, 150)); // Assuming gameHeight = 150
    
    return { x: predictedX, y: predictedY };
  }
  
  /**
   * Check if an enemy is a breakaway enemy (moving independently toward player)
   */
  private isBreakawayEnemy(enemy: Enemy, playerX: number, playerY: number): boolean {
    const speed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
    if (speed < 0.5) return false; // Too slow to be breakaway
    
    const enemyBounds = enemy.getBounds();
    const enemyX = enemyBounds.x + enemyBounds.width / 2;
    const enemyY = enemyBounds.y + enemyBounds.height / 2;
    
    // Check if enemy is moving toward player
    const dx = playerX - enemyX;
    const dy = playerY - enemyY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 5) return false; // Already very close
    
    // Check if velocity is pointing toward player (within 45 degrees)
    const dotProduct = (dx * enemy.vx + dy * enemy.vy) / (distance * speed);
    return dotProduct > 0.7; // Moving toward player
  }
  
  /**
   * Find gaps between threats that lead toward shooting positions
   * Returns the best gap direction to move through, or null if no safe gap found
   */
  private findGapToShootingPosition(
    playerCenterX: number,
    playerCenterY: number,
    enemies: Enemy[],
    enemyProjectiles: Projectile[],
    targetEnemy: Enemy | null,
    _gameWidth: number,
    gameHeight: number
  ): { x: number; y: number } | null {
    if (!targetEnemy) return null;
    
    const targetBounds = targetEnemy.getBounds();
    const targetX = targetBounds.x + targetBounds.width / 2;
    
    // Calculate desired shooting position (below target, horizontally aligned)
    const desiredX = targetX;
    const desiredY = Math.min(gameHeight * 0.92, playerCenterY); // Stay near bottom
    
    // Calculate direction toward shooting position
    const dx = desiredX - playerCenterX;
    const dy = desiredY - playerCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 5) return null; // Already at position
    
    // Sample points along the path to shooting position
    const samplePoints = 8;
    const playerSize = 8; // Approximate player size for collision checking
    const safetyMargin = 12; // Extra margin for safety
    
    // Check multiple potential paths (straight, left curve, right curve)
    const pathOptions: { x: number; y: number; score: number }[] = [];
    
    for (let pathOffset = -1; pathOffset <= 1; pathOffset++) {
      let pathClear = true;
      let threatDensity = 0;
      
      // Sample points along this path
      for (let i = 1; i <= samplePoints; i++) {
        const t = i / samplePoints;
        const sampleX = playerCenterX + dx * t + pathOffset * 15 * (1 - t); // Curve left/right
        const sampleY = playerCenterY + dy * t;
        
        // Check if this point is safe (no threats nearby)
        for (const enemy of enemies) {
          const enemyBounds = enemy.getBounds();
          const enemyX = enemyBounds.x + enemyBounds.width / 2;
          const enemyY = enemyBounds.y + enemyBounds.height / 2;
          
          const distToEnemy = Math.sqrt(
            Math.pow(sampleX - enemyX, 2) + Math.pow(sampleY - enemyY, 2)
          );
          
          if (distToEnemy < playerSize + safetyMargin) {
            pathClear = false;
            break;
          }
          
          // Track threat density (closer threats = higher density)
          if (distToEnemy < 40) {
            threatDensity += (40 - distToEnemy) / 40;
          }
        }
        
        if (!pathClear) break;
        
        // Check projectiles
        for (const projectile of enemyProjectiles) {
          if (projectile.type !== ProjectileType.ENEMY) continue;
          
          const projBounds = projectile.getBounds();
          const projX = projBounds.x + projBounds.width / 2;
          const projY = projBounds.y + projBounds.height / 2;
          
          // Predict projectile position
          const projVx = projectile.vx;
          const projVy = projectile.vy;
          const timeToSample = i * 2; // Frames to reach sample point
          const futureProjX = projX + projVx * timeToSample;
          const futureProjY = projY + projVy * timeToSample;
          
          const distToProj = Math.sqrt(
            Math.pow(sampleX - futureProjX, 2) + Math.pow(sampleY - futureProjY, 2)
          );
          
          if (distToProj < playerSize + safetyMargin) {
            pathClear = false;
            break;
          }
          
          if (distToProj < 30) {
            threatDensity += (30 - distToProj) / 30;
          }
        }
        
        if (!pathClear) break;
      }
      
      if (pathClear) {
        // Calculate direction for this path
        const pathDx = desiredX - playerCenterX + pathOffset * 10;
        const pathDy = desiredY - playerCenterY;
        const pathDist = Math.sqrt(pathDx * pathDx + pathDy * pathDy);
        
        if (pathDist > 0) {
          // Score this path: prefer shorter paths with lower threat density
          const pathScore = (100 / (pathDist + 1)) - (threatDensity * 5);
          pathOptions.push({
            x: pathDx / pathDist,
            y: pathDy / pathDist,
            score: pathScore
          });
        }
      }
    }
    
    // Return the best path (highest score)
    if (pathOptions.length > 0) {
      pathOptions.sort((a, b) => b.score - a.score);
      return { x: pathOptions[0].x, y: pathOptions[0].y };
    }
    
    return null;
  }
  
  /**
   * Get threat level of an enemy based on type, position, and movement
   */
  private getEnemyThreatLevel(
    enemy: Enemy,
    playerX: number,
    playerY: number,
    predictedPos?: { x: number; y: number }
  ): number {
    const enemyBounds = enemy.getBounds();
    const enemyX = predictedPos ? predictedPos.x : (enemyBounds.x + enemyBounds.width / 2);
    const enemyY = predictedPos ? predictedPos.y : (enemyBounds.y + enemyBounds.height / 2);
    
    const dx = playerX - enemyX;
    const dy = playerY - enemyY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    let threat = 0;
    
    // Base threat from distance (closer = more threatening)
    if (distance < 30) {
      threat += 0.5;
    } else if (distance < 50) {
      threat += 0.3;
    } else if (distance < 80) {
      threat += 0.1;
    }
    
    // Breakaway enemies are more threatening
    if (this.isBreakawayEnemy(enemy, playerX, playerY)) {
      threat += 0.4;
    }
    
    // Enemy type modifiers
    switch (enemy.type) {
      case EnemyType.HATER:
        threat += 0.2; // Haters are dangerous
        break;
      case EnemyType.BRAIN:
        threat += 0.15; // Brains have wave patterns (harder to predict)
        break;
      case EnemyType.DIAMOND:
        threat += 0.1; // Diamonds have more health
        break;
    }
    
    // Enemies above player are less threatening (easier to shoot)
    if (dy < 0) {
      threat -= 0.1;
    }
    
    // Enemies directly above are ideal targets (negative threat for positioning)
    if (Math.abs(dx) < 10 && dy < -20) {
      threat -= 0.2; // Good target, not a threat
    }
    
    return Math.max(0, Math.min(1, threat)); // Clamp 0-1
  }

  /**
   * Update bot for bonus round (maze navigation)
   * Returns steering direction: -1 = left, 0 = straight, 1 = right
   * Bot will attempt to collect all lives and lasers while avoiding walls
   */
  updateBonusRound(
    player: Player,
    bonusMaze: BonusMaze,
    _gameWidth: number,
    _gameHeight: number
  ): { steerLeft: boolean; steerRight: boolean } {
    const playerBounds = player.getBounds();
    const playerCenterX = playerBounds.x + playerBounds.width / 2;
    const playerCenterY = playerBounds.y + playerBounds.height / 2;
    
    // Get all uncollected items and walls
    const walls = bonusMaze.getWalls();
    const lives = bonusMaze.getLives();
    const lasers = bonusMaze.getLasers();
    
    // Combine all uncollected items (prioritize lives slightly, then lasers)
    const allItems: Array<{ x: number; y: number; priority: number }> = [];
    for (const life of lives) {
      allItems.push({ x: life.x, y: life.y, priority: 1.1 }); // Slight priority for lives
    }
    for (const laser of lasers) {
      allItems.push({ x: laser.x, y: laser.y, priority: 1.0 });
    }
    
    let steerLeft = false;
    let steerRight = false;
    
    // If there are items to collect, navigate to the nearest one
    if (allItems.length > 0) {
      // Find nearest item
      let nearestItem = allItems[0];
      let nearestDistance = Infinity;
      
      for (const item of allItems) {
        const dx = item.x - playerCenterX;
        const dy = item.y - playerCenterY;
        // Weight distance by priority (lower priority = effectively farther)
        const distance = Math.sqrt(dx * dx + dy * dy) / item.priority;
        
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestItem = item;
        }
      }
      
      // Calculate direction to nearest item
      const dx = nearestItem.x - playerCenterX;
      
      // In bonus round, player auto-moves forward (upward), so we only need to steer left/right
      // We want to align horizontally with the item
      const horizontalDistance = dx;
      
      // Check for walls ahead and to the sides
      const futureY = playerCenterY - 10; // Player moves up, so check slightly above
      const safeLeft = this.checkSafePath(playerCenterX - 15, futureY, playerBounds.width, playerBounds.height, walls);
      const safeRight = this.checkSafePath(playerCenterX + 15, futureY, playerBounds.width, playerBounds.height, walls);
      const safeCenter = this.checkSafePath(playerCenterX, futureY, playerBounds.width, playerBounds.height, walls);
      
      // If moving toward item would hit a wall, prioritize safety - don't risk it
      const targetX = nearestItem.x;
      const safetyMargin = 3; // Add safety margin to avoid walls
      const wouldHitWall = !this.checkSafePath(
        targetX, 
        futureY, 
        playerBounds.width + safetyMargin, 
        playerBounds.height, 
        walls
      );
      
      // Also check if the path to the item is safe at multiple points
      const itemY = nearestItem.y;
      const stepsToItem = Math.max(3, Math.ceil(Math.abs(itemY - playerCenterY) / 5));
      let hasSafePathToItem = true;
      
      // Check path at multiple points between player and item
      for (let step = 1; step <= stepsToItem && step <= 8; step++) {
        const t = step / stepsToItem;
        const checkX = playerCenterX + (targetX - playerCenterX) * t;
        const checkY = playerCenterY - (playerCenterY - itemY) * t;
        
        if (!this.checkSafePath(
          checkX - safetyMargin, 
          checkY, 
          playerBounds.width + safetyMargin * 2, 
          playerBounds.height, 
          walls
        )) {
          hasSafePathToItem = false;
          break;
        }
      }
      
      if (wouldHitWall || !hasSafePathToItem) {
        // Wall in the way or unsafe path - prioritize safety, don't go toward item
        // Choose safest available direction away from the wall
        if (safeLeft && !safeRight) {
          steerLeft = true;
        } else if (safeRight && !safeLeft) {
          steerRight = true;
        } else if (safeLeft && safeRight) {
          // Both sides safe - move away from the item/wall
          if (safeCenter) {
            // Center is safe, stay centered (don't risk going toward wall)
          } else {
            // Center blocked, choose side away from item (safer)
            if (targetX < playerCenterX) {
              steerRight = true; // Item on left, go right to avoid wall
            } else {
              steerLeft = true; // Item on right, go left to avoid wall
            }
          }
        } else {
          // No safe path - try to stay in center if possible
          if (safeCenter) {
            // Stay centered, don't risk it
          } else if (safeLeft) {
            steerLeft = true;
          } else if (safeRight) {
            steerRight = true;
          }
        }
      } else {
        // Safe path to item - steer toward it, but only if safe
        if (Math.abs(horizontalDistance) > 3) {
          if (horizontalDistance < 0) {
            // Item is to the left
            if (safeLeft) {
              steerLeft = true;
            } else if (safeCenter && !safeRight) {
              // Can't go left safely, stay center
            } else if (safeRight) {
              // Left blocked, go right to find another path
              steerRight = true;
            }
          } else {
            // Item is to the right
            if (safeRight) {
              steerRight = true;
            } else if (safeCenter && !safeLeft) {
              // Can't go right safely, stay center
            } else if (safeLeft) {
              // Right blocked, go left to find another path
              steerLeft = true;
            }
          }
        }
      }
    } else {
      // No items left - just navigate to exit (top) while avoiding walls
      // Stay centered and avoid walls
      const futureY = playerCenterY - 10;
      const safeLeft = this.checkSafePath(playerCenterX - 15, futureY, playerBounds.width, playerBounds.height, walls);
      const safeRight = this.checkSafePath(playerCenterX + 15, futureY, playerBounds.width, playerBounds.height, walls);
      const safeCenter = this.checkSafePath(playerCenterX, futureY, playerBounds.width, playerBounds.height, walls);
      
      // Try to stay centered, but avoid walls
      if (!safeCenter) {
        if (safeLeft && !safeRight) {
          steerLeft = true;
        } else if (safeRight && !safeLeft) {
          steerRight = true;
        } else if (safeLeft && safeRight) {
          // Both sides safe - stay centered by not steering
        }
      }
    }
    
    return { steerLeft, steerRight };
  }
  
  /**
   * Check if a position is safe (no wall collision)
   */
  private checkSafePath(x: number, y: number, width: number, height: number, walls: MazeWall[]): boolean {
    for (const wall of walls) {
      if (
        x < wall.x + wall.width &&
        x + width > wall.x &&
        y < wall.y + wall.height &&
        y + height > wall.y
      ) {
        return false; // Would collide with wall
      }
    }
    return true; // Safe path
  }
}

