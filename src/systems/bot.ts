/**
 * Bot AI System
 * Controls the player automatically to play the game
 */

import { Player } from '../entities/player';
import { Enemy } from '../entities/enemies';
import { Projectile, ProjectileType } from '../entities/projectiles';

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
  
  // Fast learning mode - dramatically increases learning rates
  private fastLearningMode: boolean = true; // Enable fast learning by default
  private learningMultiplier: number = 25.0; // 25x faster learning!
  
  // Performance tracking
  private lastGameRound: number = 0;
  
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
      const saved = localStorage.getItem('round42_bot_learning');
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
        this.fastLearningMode = data.fastLearningMode !== undefined ? data.fastLearningMode : true;
        this.learningMultiplier = this.fastLearningMode ? 25.0 : 1.0;
        
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
        fastLearningMode: this.fastLearningMode,
      };
      localStorage.setItem('round42_bot_learning', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save bot learning data:', e);
    }
  }
  
  toggle(): void {
    this.isActive = !this.isActive;
  }
  
  isBotActive(): boolean {
    return this.isActive;
  }
  
  /**
   * Called when a game ends - analyze performance and improve
   */
  onGameEnd(score: number, round: number): void {
    this.lastGameRound = round;
    this.gamesPlayed++;
    this.totalScore += score;
    this.averageScore = this.totalScore / this.gamesPlayed;
    
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
   * Update bot AI - decides where to move and when to shoot
   */
  update(
    player: Player,
    enemies: Enemy[],
    enemyProjectiles: Projectile[],
    gameWidth: number,
    gameHeight: number,
    frameCount: number
  ): { moveX: number; moveY: number; shouldShoot: boolean } {
    if (!this.isActive) {
      return { moveX: 0, moveY: 0, shouldShoot: false };
    }
    
    // Make decisions at intervals (faster with improved reaction speed)
    // Master level bots make decisions almost every frame
    const adjustedInterval = Math.max(1, this.decisionInterval / this.reactionSpeed);
    if (frameCount - this.lastDecisionTime < adjustedInterval) {
      // Even between decisions, continue last movement and keep shooting
      // This ensures constant movement even when making decisions frequently
      return { moveX: this.lastMoveX, moveY: this.lastMoveY, shouldShoot: true };
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
    
    // Find nearest enemy projectile threat (better detection with improved avoidance)
    let nearestThreat: Projectile | null = null;
    let nearestThreatDistance = Infinity;
    const threatDetectionRange = 60 * this.avoidanceSkill; // Better detection range
    
    for (const projectile of enemyProjectiles) {
      if (projectile.type !== ProjectileType.ENEMY) continue;
      
      const projBounds = projectile.getBounds();
      const projX = projBounds.x + projBounds.width / 2;
      const projY = projBounds.y + projBounds.height / 2;
      
      // Check if projectile is heading toward player
      const dx = playerCenterX - projX;
      const dy = playerCenterY - projY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Predict if projectile will hit player (better prediction with skill)
      const projVx = projectile.vx;
      const projVy = projectile.vy;
      const projSpeed = Math.sqrt(projVx * projVx + projVy * projVy);
      
      // Advanced trajectory prediction - calculate where projectile will be
      const timeToReach = distance / Math.max(projSpeed, 0.1);
      
      // Predict future player position (if moving)
      const playerVx = 0; // Player velocity not available, but we can estimate
      const playerVy = 0;
      const futurePlayerX = playerCenterX + playerVx * timeToReach;
      const futurePlayerY = playerCenterY + playerVy * timeToReach;
      const futureProjX = projX + projVx * timeToReach;
      const futureProjY = projY + projVy * timeToReach;
      const futureDistance = Math.sqrt(
        Math.pow(futurePlayerX - futureProjX, 2) + 
        Math.pow(futurePlayerY - futureProjY, 2)
      );
      
      // Improved threat detection (sees threats earlier and more accurately)
      // Master level bots can see threats much further away
      const predictionTime = 50 / this.avoidanceSkill; // Better prediction window
      const collisionRadius = 8; // Player + projectile collision radius
      
      if (distance < threatDetectionRange && (timeToReach < predictionTime || futureDistance < collisionRadius * 2)) {
        // Check if projectile is actually heading toward player
        const angleToPlayer = Math.atan2(dy, dx);
        const projAngle = Math.atan2(projVy, projVx);
        const angleDiff = Math.abs(angleToPlayer - projAngle);
        const normalizedAngleDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);
        
        // More accurate threat assessment with skill
        // Master level bots have wider threat detection angle
        const threatAngle = Math.PI / (1.5 + this.avoidanceSkill * 0.5); // Wider angle for better bots
        if (normalizedAngleDiff < threatAngle || distance < 40) {
          if (distance < nearestThreatDistance) {
            nearestThreat = projectile;
            nearestThreatDistance = distance;
          }
        }
      }
    }
    
    // Avoid threats (better avoidance with skill)
    if (nearestThreat) {
      const threatBounds = nearestThreat.getBounds();
      const threatX = threatBounds.x + threatBounds.width / 2;
      const threatY = threatBounds.y + threatBounds.height / 2;
      
      // Calculate optimal escape direction (improved with avoidance skill)
      const dx = playerCenterX - threatX;
      const dy = playerCenterY - threatY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Better movement: prioritize horizontal evasion (left/right movement)
      const threatVx = nearestThreat.vx;
      const threatVy = nearestThreat.vy;
      
      // Calculate perpendicular escape direction (prioritize horizontal)
      const escapeX = -threatVy; // Perpendicular to threat velocity
      const escapeY = threatVx;
      const escapeLength = Math.sqrt(escapeX * escapeX + escapeY * escapeY);
      
      if (escapeLength > 0) {
        // Prioritize horizontal movement (left/right evasion is safer)
        // Scale horizontal movement more than vertical
        moveX = (escapeX / escapeLength) * this.avoidanceSkill * 1.5; // 1.5x horizontal priority
        moveY = (escapeY / escapeLength) * this.avoidanceSkill * 0.6; // Reduced vertical movement
        
        // Also add component away from threat (prioritize horizontal escape)
        moveX += (dx / distance) * 0.7 * this.avoidanceSkill; // Strong horizontal component
        moveY += (dy / distance) * 0.3 * this.avoidanceSkill; // Weaker vertical component
        
        // Clamp movement (ensures full directional range)
        moveX = Math.max(-1, Math.min(1, moveX));
        moveY = Math.max(-1, Math.min(1, moveY));
      } else {
        // Fallback: prioritize horizontal escape
        const escapeDistance = Math.sqrt(dx * dx + dy * dy);
        if (escapeDistance > 0) {
          // Move away, but prioritize horizontal
          moveX = (dx / escapeDistance) * this.avoidanceSkill * 1.2;
          moveY = (dy / escapeDistance) * this.avoidanceSkill * 0.5;
        } else {
          // Last resort: strong horizontal movement
          moveX = dx > 0 ? 1 : -1;
          moveY = 0; // No vertical movement as last resort
        }
      }
      
      // Allow upward evasion when evading projectiles (but return to base after)
      // Don't force downward - allow rapid upward movement for evasion
      // The return-to-base logic will handle getting back down
    } else {
      // No immediate threat - position to shoot enemies while maintaining bottom half
      // Add constant horizontal patrol for evasion even when no threats
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
              if (enemy.type === 2) score += 20; // Diamonds (high value)
              if (enemy.type === 3) score += 25; // Haters (high value, dangerous)
            }
            
            if (score > bestScore) {
              bestScore = score;
              bestTarget = enemy;
            }
          }
        
        if (bestTarget) {
          const enemyBounds = bestTarget.getBounds();
          const enemyX = enemyBounds.x + enemyBounds.width / 2;
          const enemyY = enemyBounds.y + enemyBounds.height / 2;
          
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
          // If we're above base (evaded upward), quickly return
          // If at base, maintain position
          if (playerCenterY < preferredBottomY) {
            // Above base - RAPID RETURN: move down quickly (aggressive return)
            const returnSpeed = 0.8 + (this.aggressionLevel * 0.4); // 0.8 to 1.2x speed
            moveY = returnSpeed * this.positioningSkill; // Fast downward movement to reach base
          } else {
            // At or near the base - maintain position at bottom
            moveY = 0.2 * this.positioningSkill; // Slight downward bias to stay at base
          }
          
          // PRIORITY 3: Maintain safe distance - AGGRESSIVE EVASION
          // Check if enemy is descending and close
          const enemyVy = bestTarget.vy || 0.1; // Enemy vertical velocity (positive = descending)
          const isEnemyDescending = enemyY < playerCenterY && enemyVy > 0; // Enemy above and moving down
          const isEnemyCloseAbove = enemyY < playerCenterY && Math.abs(dx) < 20; // Enemy directly above
          
          if (currentDistance < safeDistance) {
            // Too close! RAPID EVASION
            const escapeDx = playerCenterX - enemyX;
            const escapeDy = playerCenterY - enemyY;
            const escapeDist = Math.sqrt(escapeDx * escapeDx + escapeDy * escapeDy);
            
            if (escapeDist > 0) {
              if (isEnemyDescending && isEnemyCloseAbove) {
                // Enemy descending above - RAPID UPWARD EVASION
                const evasionSpeed = 1.6 + (this.aggressionLevel * 0.4); // 1.6 to 2.0x speed
                moveX = (escapeDx / escapeDist) * evasionSpeed * this.avoidanceSkill;
                moveY = -evasionSpeed * this.avoidanceSkill; // Rapid upward
              } else {
                // Normal escape - strong horizontal, minimal vertical
                const escapeSpeed = 1.5 + (this.aggressionLevel * 0.3); // Faster with aggression
                moveX = (escapeDx / escapeDist) * escapeSpeed * this.avoidanceSkill;
                moveY = (escapeDy / escapeDist) * 0.3 * this.avoidanceSkill;
              }
            }
          }
          
          // Aggression now means: faster target acquisition and better target prioritization
          // NOT moving closer - that's handled above with safe distance
          // Aggression is already reflected in shooting (shouldShoot = true) and faster alignment
        } else {
          // No good target - AGGRESSIVE: long fast horizontal sweeps
          const sweepSpeed = 1.0 + (this.aggressionLevel * 0.5); // 1.0 to 1.5x speed
          moveX = this.patrolDirection * sweepSpeed * this.avoidanceSkill;
          
          // Return to base if above it (after evading)
          if (playerCenterY < preferredBottomY) {
            const returnSpeed = 0.7 + (this.aggressionLevel * 0.3); // Faster return with aggression
            moveY = returnSpeed * this.positioningSkill; // Move down to base
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
    
    return { moveX, moveY, shouldShoot };
  }
}

