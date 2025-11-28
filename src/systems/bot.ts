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
  private aggressionLevel: number = 0.6; // How aggressively it pursues enemies (0-1) - START HIGHER
  
  // Fast learning mode - dramatically increases learning rates
  private fastLearningMode: boolean = true; // Enable fast learning by default
  private learningMultiplier: number = 25.0; // 25x faster learning!
  
  // Performance tracking
  private lastGameRound: number = 0;
  
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
      return { moveX: 0, moveY: 0, shouldShoot: true }; // Keep shooting
    }
    
    this.lastDecisionTime = frameCount;
    
    const playerBounds = player.getBounds();
    const playerCenterX = playerBounds.x + playerBounds.width / 2;
    const playerCenterY = playerBounds.y + playerBounds.height / 2;
    
    // Strategy: Avoid enemy projectiles, position to shoot enemies
    let moveX = 0;
    let moveY = 0;
    let shouldShoot = true;
    
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
      
      // Better movement: move perpendicular to threat trajectory (uses all directions)
      const threatVx = nearestThreat.vx;
      const threatVy = nearestThreat.vy;
      
      // Calculate perpendicular escape direction (full 2D movement)
      const escapeX = -threatVy; // Perpendicular to threat velocity
      const escapeY = threatVx;
      const escapeLength = Math.sqrt(escapeX * escapeX + escapeY * escapeY);
      
      if (escapeLength > 0) {
        // Normalize and scale by avoidance skill (uses both X and Y)
        moveX = (escapeX / escapeLength) * this.avoidanceSkill;
        moveY = (escapeY / escapeLength) * this.avoidanceSkill;
        
        // Also add component away from threat (diagonal escape)
        moveX += (dx / distance) * 0.5 * this.avoidanceSkill;
        moveY += (dy / distance) * 0.5 * this.avoidanceSkill;
        
        // Clamp movement (ensures full directional range)
        moveX = Math.max(-1, Math.min(1, moveX));
        moveY = Math.max(-1, Math.min(1, moveY));
      } else {
        // Fallback: move away from threat in best direction (all directions available)
        const escapeDistance = Math.sqrt(dx * dx + dy * dy);
        if (escapeDistance > 0) {
          // Move directly away (can be diagonal)
          moveX = (dx / escapeDistance) * this.avoidanceSkill;
          moveY = (dy / escapeDistance) * this.avoidanceSkill;
        } else {
          // Last resort: prefer horizontal but can go vertical
          moveX = dx > 0 ? 1 : -1;
          moveY = dy > 0 ? 1 : -1;
        }
      }
    } else {
      // No immediate threat - position to shoot enemies (better positioning with skill)
      if (enemies.length > 0) {
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
        if (nearestEnemy && nearestEnemyDistance < collisionThreshold) {
          const enemyBounds = nearestEnemy.getBounds();
          const enemyX = enemyBounds.x + enemyBounds.width / 2;
          const enemyY = enemyBounds.y + enemyBounds.height / 2;
          
          const dx = playerCenterX - enemyX;
          const dy = playerCenterY - enemyY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            // Move away from enemy to avoid collision
            moveX = (dx / distance) * this.avoidanceSkill;
            moveY = (dy / distance) * this.avoidanceSkill;
            
            // Prefer horizontal escape if possible
            if (Math.abs(dx) > Math.abs(dy)) {
              moveY *= 0.5; // Reduce vertical movement
            } else {
              moveX *= 0.5; // Reduce horizontal movement
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
            
            // Score targets: prefer closer enemies, enemies in front, and aligned enemies
            // But penalize enemies that are TOO close (collision risk)
            let score = 100 / (distance + 1); // Closer is better
            if (distance < collisionThreshold) {
              score -= 50; // Heavy penalty for enemies too close
            }
            if (dy > 0) score += 20; // Prefer enemies below player (in front)
            if (Math.abs(dx) < 20) score += 30; // Prefer enemies aligned horizontally
            if (enemyY > playerCenterY + 10) score += 15; // Prefer enemies ahead
            // Also consider vertical alignment (can move up/down to align)
            if (Math.abs(dy) < 15) score += 15; // Prefer enemies at similar vertical level
            
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
          
          // Improved positioning (better with skill) - uses all directions
          const dx = enemyX - playerCenterX;
          const dy = enemyY - playerCenterY;
          
          // Move toward optimal shooting position (can move in all directions)
          const optimalDistance = 40; // Optimal distance for shooting
          const currentDistance = Math.sqrt(dx * dx + dy * dy);
          
          if (currentDistance > optimalDistance) {
            // Move toward enemy in both X and Y (full directional movement)
            if (Math.abs(dx) > 3) {
              moveX = (dx > 0 ? 1 : -1) * this.positioningSkill;
            }
            // Use vertical movement more effectively
            if (Math.abs(dy) > 3) {
              // Move up if enemy is above, down if enemy is below
              moveY = (dy > 0 ? 1 : -1) * this.positioningSkill * 0.8; // Slightly prefer horizontal
            }
          } else {
            // Maintain optimal distance (better micro-positioning with skill)
            if (Math.abs(dx) > 2) {
              moveX = (dx > 0 ? 0.5 : -0.5) * this.positioningSkill;
            }
            // Fine-tune vertical position too
            if (Math.abs(dy) > 5) {
              moveY = (dy > 0 ? 0.3 : -0.3) * this.positioningSkill;
            }
          }
          
          // Aggressive positioning: get closer if skill allows (all directions)
          // BUT maintain safe distance to avoid collisions
          const safeDistance = 30; // Minimum safe distance from enemies
          if (this.aggressionLevel > 0.7 && currentDistance > safeDistance) {
            // Only get aggressive if we're not too close
            moveX = (dx > 0 ? 1 : -1) * this.aggressionLevel;
            // Also move vertically when being aggressive
            if (Math.abs(dy) > 10) {
              moveY = (dy > 0 ? 0.7 : -0.7) * this.aggressionLevel;
            }
          } else if (currentDistance < safeDistance) {
            // If too close, back away even if aggressive
            moveX = (dx < 0 ? 1 : -1) * 0.8; // Move away
            if (Math.abs(dy) > 5) {
              moveY = (dy < 0 ? 0.6 : -0.6); // Move away vertically too
            }
          }
        }
        }
      }
    }
    
    // Keep player in bounds
    const newX = playerBounds.x + moveX * player.speed;
    const newY = playerBounds.y + moveY * player.speed;
    
    if (newX < 0 || newX + playerBounds.width > gameWidth) {
      moveX = 0;
    }
    if (newY < 0 || newY + playerBounds.height > gameHeight) {
      moveY = 0;
    }
    
    return { moveX, moveY, shouldShoot };
  }
}

