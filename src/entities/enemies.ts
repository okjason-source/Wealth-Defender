/**
 * Enemy Entities
 * Dollar Bills, Diamonds, Coins, and Haters
 */

import {
  DOLLAR_BILL_FRAMES,
  DIAMOND_FRAMES,
  COIN_SPRITE,
  HATER_SPRITE,
} from '../graphics/sprites';
import { ProjectileManager, ProjectileType } from './projectiles';
import { EnemyLine } from './enemyLine';

export enum EnemyType {
  DOLLAR_BILL,
  DIAMOND,
  COIN,
  HATER,
}

export class Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: EnemyType;
  width: number;
  height: number;
  active: boolean = true;
  health: number = 1;
  maxHealth: number = 1;
  
  // Line-based movement
  private isInLine: boolean = true;
  private lineX: number = 0; // Position in the line (offset from line start)
  private breakawayChance: number = 0.001; // Chance per frame to break away
  private breakawaySpeed: number = 2;
  private breakawayTargetY: number = 0;
  private isReturning: boolean = false; // Whether enemy is returning to line
  
  // Meteor/falling movement (for coins >= 50)
  private isFalling: boolean = false; // If true, falls straight down like a meteor
  private fallSpeed: number = 0; // Vertical fall speed
  
  // Movement pattern
  private patternTime: number = 0;
  private gameWidth: number = 200;
  private gameHeight: number = 150;
  
  // Animation (for dollar bills - wing flapping)
  private animationFrame: number = 0;
  private animationTimer: number = 0;
  private animationSpeed: number = 8; // Frames per animation frame (lower = faster animation)
  
  // Shooting (for cycle 2+)
  private projectileManager: ProjectileManager | null = null;
  private canShoot: boolean = false;
  private shootCooldown: number = 0;
  private shootCooldownMax: number = 180; // Frames between shots (increased for easier difficulty)
  private shootChance: number = 0.3; // Only 30% chance to shoot when cooldown is ready
  
  constructor(
    x: number,
    y: number,
    vx: number,
    vy: number,
    type: EnemyType,
    _patternType: 'straight' | 'sine' | 'zigzag' = 'straight',
    gameWidth: number = 200,
    gameHeight: number = 150,
    projectileManager?: ProjectileManager,
    canShoot: boolean = false
  ) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.type = type;
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.projectileManager = projectileManager || null;
    this.canShoot = canShoot;
    
    // Set dimensions and health based on type
    switch (type) {
      case EnemyType.DOLLAR_BILL:
        // Use first frame for dimensions (all frames should be same size)
        this.width = DOLLAR_BILL_FRAMES[0][0].length;
        this.height = DOLLAR_BILL_FRAMES[0].length;
        this.health = 2;
        this.maxHealth = 2;
        // Randomize starting animation frame for variety
        this.animationFrame = Math.floor(Math.random() * DOLLAR_BILL_FRAMES.length);
        break;
      case EnemyType.DIAMOND:
        // Use first frame for dimensions (all frames should be same size)
        this.width = DIAMOND_FRAMES[0][0].length;
        this.height = DIAMOND_FRAMES[0].length;
        this.health = 3;
        this.maxHealth = 3;
        // Randomize starting animation frame for variety
        this.animationFrame = Math.floor(Math.random() * DIAMOND_FRAMES.length);
        break;
      case EnemyType.COIN:
        this.width = COIN_SPRITE[0].length;
        this.height = COIN_SPRITE.length;
        this.health = 1;
        this.maxHealth = 1;
        break;
      case EnemyType.HATER:
        this.width = HATER_SPRITE[0].length;
        this.height = HATER_SPRITE.length;
        this.health = 2;
        this.maxHealth = 2;
        break;
    }
  }
  
  update(deltaTime: number, lineX: number, lineY: number, _lineVx: number, _lineVy: number, playerX?: number, playerY?: number): void {
    if (!this.active) return;
    
    const frameDelta = deltaTime / 16.67;
    this.patternTime += frameDelta;
    
    // Update wing flapping animation for dollar bills
    if (this.type === EnemyType.DOLLAR_BILL) {
      this.animationTimer += frameDelta;
      if (this.animationTimer >= this.animationSpeed) {
        this.animationTimer = 0;
        this.animationFrame = (this.animationFrame + 1) % DOLLAR_BILL_FRAMES.length;
      }
    }
    
    // Update sparkling animation for diamonds (slower than dollar bills)
    if (this.type === EnemyType.DIAMOND) {
      this.animationTimer += frameDelta;
      // Diamonds sparkle slower (12 frames per animation frame)
      const diamondAnimationSpeed = 12;
      if (this.animationTimer >= diamondAnimationSpeed) {
        this.animationTimer = 0;
        this.animationFrame = (this.animationFrame + 1) % DIAMOND_FRAMES.length;
      }
    }
    
    // Meteor/falling movement (straight down, no horizontal movement)
    if (this.isFalling) {
      this.y += this.fallSpeed * frameDelta;
      
      // When reaching bottom, wrap to top at random X position
      if (this.y > this.gameHeight) {
        this.y = 0;
        this.x = 5 + Math.random() * (this.gameWidth - 10 - this.width);
      }
      
      // Update shoot cooldown for falling enemies
      if (this.shootCooldown > 0) {
        this.shootCooldown -= frameDelta;
      }
      
      // Falling enemies don't shoot (too chaotic)
      return; // Skip line-based movement logic
    }
    
    // Update shoot cooldown
    if (this.shootCooldown > 0) {
      this.shootCooldown -= frameDelta;
    }
    
    // Shoot at player if in cycle 2+ and in line formation (with random chance)
    if (this.canShoot && this.isInLine && this.shootCooldown <= 0 && playerX !== undefined && playerY !== undefined) {
      // Only shoot with a chance (not all enemies shoot at once)
      if (Math.random() < this.shootChance) {
        this.shootAtPlayer(playerX, playerY);
        this.shootCooldown = this.shootCooldownMax;
      } else {
        // Still reset cooldown but don't shoot (prevents all enemies shooting at once)
        this.shootCooldown = this.shootCooldownMax * 0.3; // Shorter cooldown if didn't shoot
      }
    }
    
    if (this.isInLine) {
      // Move with the line
      this.x = lineX + this.lineX;
      this.y = lineY;
      
      // Ensure enemy stays within horizontal bounds (for coins, dollars, diamonds)
      // Haters have their own wrap-around logic, so skip for them
      if (this.type !== EnemyType.HATER) {
        // Clamp to screen bounds
        if (this.x < 0) {
          this.x = 0;
        } else if (this.x + this.width > this.gameWidth) {
          this.x = this.gameWidth - this.width;
        }
      }
      
      // Strategic breakaway: higher chance when aligned with player
      let breakawayModifier = 1.0;
      if (playerX !== undefined && playerY !== undefined) {
        const distanceToPlayerX = Math.abs(this.x - playerX);
        const distanceToPlayerY = playerY - this.y;
        
        // Increase breakaway chance when:
        // 1. Aligned with player horizontally
        if (distanceToPlayerX < 30 && distanceToPlayerY > 0 && distanceToPlayerY < 60) {
          breakawayModifier = 3.0; // 3x more likely
        }
        // 2. Player is cornered (near edges)
        else if ((playerX < 20 || playerX > this.gameWidth - 20) && distanceToPlayerY > 0) {
          breakawayModifier = 2.0; // 2x more likely
        }
      }
      
      // Chance to break away and attack
      if (Math.random() < this.breakawayChance * frameDelta * breakawayModifier) {
        this.triggerBreakaway(playerX, playerY);
      }
    } else {
      if (!this.isReturning) {
        // Breakaway attack - move toward player with better targeting
        if (playerX !== undefined && playerY !== undefined) {
          // Lead the player slightly for better accuracy
          const dx = playerX - this.x;
          const dy = playerY - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 5) {
            // Aim for player with slight lead
            const leadFactor = 0.3; // Lead by 30% of distance
            const targetX = playerX + (this.vx * leadFactor);
            const targetY = playerY;
            const targetDx = targetX - this.x;
            const targetDy = targetY - this.y;
            const targetDistance = Math.sqrt(targetDx * targetDx + targetDy * targetDy);
            
            if (targetDistance > 0) {
              this.vx = (targetDx / targetDistance) * this.breakawaySpeed;
              this.vy = (targetDy / targetDistance) * this.breakawaySpeed;
            }
          }
        }
        
        this.y += this.vy * frameDelta;
        this.x += this.vx * frameDelta;
        
        // If reached bottom or close to player, start returning
        if (this.y >= this.breakawayTargetY || (playerY !== undefined && this.y >= playerY - 10)) {
          this.isReturning = true;
          // Calculate direction back to original line position
          const targetX = lineX + this.lineX;
          const targetY = lineY;
          const dx = targetX - this.x;
          const dy = targetY - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            this.vx = (dx / distance) * this.breakawaySpeed;
            this.vy = (dy / distance) * this.breakawaySpeed;
          } else {
            this.vx = 0;
            this.vy = -this.breakawaySpeed;
          }
        }
      } else {
        // Returning to line - move back to original position
        const targetX = lineX + this.lineX;
        const targetY = lineY;
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 2) {
          // Close enough, rejoin line
          this.isInLine = true;
          this.isReturning = false;
          this.x = targetX;
          this.y = targetY;
          this.vx = 0;
          this.vy = 0;
        } else {
          // Move toward line position
          this.vx = (dx / distance) * this.breakawaySpeed;
          this.vy = (dy / distance) * this.breakawaySpeed;
          this.x += this.vx * frameDelta;
          this.y += this.vy * frameDelta;
        }
      }
    }
    
    // Keep enemies within horizontal bounds (for breakaway enemies)
    // Coins, dollars, and diamonds should bounce off walls
    // Haters have their own wrap-around logic
    if (!this.isInLine && this.type !== EnemyType.HATER) {
      if (this.x < 0) {
        this.x = 0;
        this.vx = -this.vx; // Bounce off left wall
      } else if (this.x + this.width > this.gameWidth) {
        this.x = this.gameWidth - this.width;
        this.vx = -this.vx; // Bounce off right wall
      }
      
      // Wrap breakaway enemies to top when they reach the bottom
      if (this.y + this.height > this.gameHeight) {
        this.y = 0; // Re-enter from top
        // If returning to line, continue returning
        if (this.isReturning) {
          // Keep returning behavior
        }
      }
      
      // Wrap to bottom if somehow above top (shouldn't happen but safety check)
      if (this.y < -this.height) {
        this.y = this.gameHeight;
      }
    }
  }
  
  setLinePosition(lineX: number): void {
    this.lineX = lineX;
  }
  
  setBreakawayChance(chance: number): void {
    this.breakawayChance = chance;
  }
  
  isInLineFormation(): boolean {
    return this.isInLine;
  }
  
  getLinePosition(): number {
    return this.lineX;
  }
  
  /**
   * Trigger a strategic breakaway attack targeting the player
   */
  triggerStrategicBreakaway(playerX?: number, playerY?: number): void {
    if (!this.isInLine) return; // Already attacking
    
    this.triggerBreakaway(playerX, playerY);
  }
  
  /**
   * Internal method to trigger breakaway
   */
  private triggerBreakaway(playerX?: number, playerY?: number): void {
    this.isInLine = false;
    this.isReturning = false;
    
    if (playerX !== undefined && playerY !== undefined) {
      // Target player position
      this.breakawayTargetY = playerY;
      const dx = playerX - this.x;
      const dy = playerY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        this.vx = (dx / distance) * this.breakawaySpeed;
        this.vy = (dy / distance) * this.breakawaySpeed;
      } else {
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = this.breakawaySpeed;
      }
    } else {
      // Fallback to random direction
      this.breakawayTargetY = this.gameHeight - 30;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = this.breakawaySpeed;
    }
  }
  
  takeDamage(amount: number): void {
    this.health -= amount;
    if (this.health <= 0) {
      this.active = false;
    }
  }
  
  isDamaged(): boolean {
    // Return true if enemy has taken damage (health < maxHealth)
    return this.health < this.maxHealth;
  }
  
  getHealthRatio(): number {
    // Return health as ratio (0.0 to 1.0)
    return this.health / this.maxHealth;
  }
  
  isOutOfBounds(width: number, height: number): boolean {
    // Enemies should never go out of bounds now (they bounce)
    // Only remove if they somehow get completely off screen (shouldn't happen)
    return this.x < -this.width - 50 || 
           this.x > width + 50 || 
           this.y < -this.height - 50 || 
           this.y > height + 50;
  }
  
  getSprite(): number[][] {
    switch (this.type) {
      case EnemyType.DOLLAR_BILL:
        // Return current animation frame for wing flapping
        return DOLLAR_BILL_FRAMES[this.animationFrame];
      case EnemyType.DIAMOND:
        // Return current animation frame for sparkling
        return DIAMOND_FRAMES[this.animationFrame];
      case EnemyType.COIN:
        return COIN_SPRITE;
      case EnemyType.HATER:
        return HATER_SPRITE;
    }
  }
  
  getBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
  
  getCenter(): { x: number; y: number } {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
    };
  }
  
  private shootAtPlayer(playerX: number, playerY: number): void {
    if (!this.projectileManager) return;
    
    const center = this.getCenter();
    const dx = playerX - center.x;
    const dy = playerY - center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const speed = 1.8; // Slower projectile speed for easier difficulty
      const vx = (dx / distance) * speed;
      const vy = (dy / distance) * speed;
      
      this.projectileManager.createProjectile(
        center.x,
        center.y,
        vx,
        vy,
        ProjectileType.ENEMY
      );
    }
  }
  
  setCanShoot(canShoot: boolean): void {
    this.canShoot = canShoot;
  }
  
  /**
   * Set enemy to falling mode (meteor style - straight down)
   */
  setFallingMode(speedMultiplier: number = 1.0): void {
    this.isFalling = true;
    this.isInLine = false;
    this.fallSpeed = 0.3 * speedMultiplier; // Base fall speed, scales with round
    this.vx = 0; // No horizontal movement
    this.vy = this.fallSpeed;
  }
  
  isFallingMode(): boolean {
    return this.isFalling;
  }
}

export class EnemyManager {
  private enemies: Enemy[] = [];
  private enemyLines: EnemyLine[] = [];
  private fallingEnemies: Enemy[] = []; // Enemies falling like meteors
  private gameWidth: number;
  private gameHeight: number;
  private projectileManager: ProjectileManager;
  
  constructor(
    gameWidth: number,
    gameHeight: number,
    projectileManager: ProjectileManager
  ) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.projectileManager = projectileManager;
  }
  
  spawnEnemyLine(
    type: EnemyType,
    y: number,
    enemyCount: number,
    breakawayChance: number = 0.001,
    speedMultiplier: number = 1.0,
    canShoot: boolean = false
  ): void {
    const line = new EnemyLine(
      type,
      y,
      enemyCount,
      this.gameWidth,
      this.gameHeight,
      breakawayChance,
      speedMultiplier,
      this.projectileManager,
      canShoot
    );
    this.enemyLines.push(line);
  }
  
  /**
   * Spawn a single falling enemy (meteor style)
   */
  spawnFallingEnemy(
    type: EnemyType,
    x: number,
    y: number,
    speedMultiplier: number = 1.0,
    canShoot: boolean = false
  ): void {
    const enemy = new Enemy(
      x,
      y,
      0, // No horizontal velocity
      0, // Vertical velocity set by setFallingMode
      type,
      'straight',
      this.gameWidth,
      this.gameHeight,
      this.projectileManager,
      canShoot
    );
    enemy.setFallingMode(speedMultiplier);
    this.fallingEnemies.push(enemy);
  }
  
  update(deltaTime: number, playerX?: number, playerY?: number): void {
    // Update all enemy lines with player position for strategic AI
    for (const line of this.enemyLines) {
      line.update(deltaTime, playerX, playerY);
    }
    
    // Remove completed lines
    this.enemyLines = this.enemyLines.filter(line => !line.isComplete());
    
    // Update falling enemies (meteor style)
    for (const enemy of this.fallingEnemies) {
      if (enemy.active) {
        enemy.update(deltaTime, 0, 0, 0, 0, playerX, playerY);
      }
    }
    
    // Remove inactive falling enemies
    this.fallingEnemies = this.fallingEnemies.filter(e => e.active);
    
    // Collect all enemies from all lines and falling enemies
    this.enemies = [];
    for (const line of this.enemyLines) {
      this.enemies.push(...line.getEnemies());
    }
    this.enemies.push(...this.fallingEnemies.filter(e => e.active));
  }
  
  getEnemies(): Enemy[] {
    return this.enemies.filter(e => e.active);
  }
  
  removeEnemy(enemy: Enemy): void {
    enemy.active = false;
  }
  
  clear(): void {
    this.enemies = [];
    this.enemyLines = [];
    this.fallingEnemies = [];
  }
  
  getEnemyCount(): number {
    return this.enemies.filter(e => e.active).length;
  }
}

