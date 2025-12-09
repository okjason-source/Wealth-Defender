/**
 * Enemy Entities
 * Dollar Bills, Diamonds, Coins, and Haters
 */

import {
  DOLLAR_BILL_FRAMES,
  DIAMOND_FRAMES,
  COIN_SPRITE,
  HATER_SPRITE,
  BRAIN_FRAMES,
} from '../graphics/sprites';
import { ProjectileManager, ProjectileType } from './projectiles';
import { EnemyLine } from './enemyLine';

export enum EnemyType {
  DOLLAR_BILL,
  DIAMOND,
  COIN,
  HATER,
  BRAIN,
}

// Static counter for unique enemy IDs
let enemyIdCounter = 0;

export class Enemy {
  public readonly id: string; // Unique identifier for audio tracking
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: EnemyType;
  width: number = 8;
  height: number = 8;
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
  private shootCooldownMax: number = 180; // Frames between shots (will be set based on type and cycle)
  private shootChance: number = 0.3; // Chance to shoot (will be set based on type and cycle)
  
  private cycle: number = 1; // Cycle for progressive difficulty (all enemies)

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
    canShoot: boolean = false,
    cycle: number = 1
  ) {
    this.id = `enemy_${enemyIdCounter++}`; // Generate unique ID
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.type = type;
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.projectileManager = projectileManager || null;
    this.canShoot = canShoot;
    this.cycle = cycle; // Store cycle for progressive difficulty
    
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
        // Progressive shooting: Cycle 1 = 26%, Cycle 2 = 28%, ... Cycle 9 = 42%
        this.shootChance = 0.26 + ((cycle - 1) * 0.02);
        // Progressive cooldown: Cycle 1 = 195, Cycle 2 = 185, ... Cycle 9 = 115
        this.shootCooldownMax = 195 - ((cycle - 1) * 10);
        break;
      case EnemyType.DIAMOND:
        // Use first frame for dimensions (all frames should be same size)
        this.width = DIAMOND_FRAMES[0][0].length;
        this.height = DIAMOND_FRAMES[0].length;
        this.health = 3;
        this.maxHealth = 3;
        // Randomize starting animation frame for variety
        this.animationFrame = Math.floor(Math.random() * DIAMOND_FRAMES.length);
        // Progressive shooting: Cycle 1 = 27%, Cycle 2 = 29%, ... Cycle 9 = 43%
        this.shootChance = 0.27 + ((cycle - 1) * 0.02);
        // Progressive cooldown: Cycle 1 = 192, Cycle 2 = 182, ... Cycle 9 = 112
        this.shootCooldownMax = 192 - ((cycle - 1) * 10);
        break;
      case EnemyType.COIN:
        this.width = COIN_SPRITE[0].length;
        this.height = COIN_SPRITE.length;
        this.health = 1;
        this.maxHealth = 1;
        // Progressive shooting: Cycle 1 = 25%, Cycle 2 = 27%, ... Cycle 9 = 41%
        this.shootChance = 0.25 + ((cycle - 1) * 0.02);
        // Progressive cooldown: Cycle 1 = 200, Cycle 2 = 190, ... Cycle 9 = 120
        this.shootCooldownMax = 200 - ((cycle - 1) * 10);
        break;
      case EnemyType.HATER:
        this.width = HATER_SPRITE[0].length;
        this.height = HATER_SPRITE.length;
        this.health = 2;
        this.maxHealth = 2;
        // Progressive shooting: Cycle 1 = 28%, Cycle 2 = 30%, ... Cycle 9 = 44%
        this.shootChance = 0.28 + ((cycle - 1) * 0.02);
        // Progressive cooldown: Cycle 1 = 190, Cycle 2 = 180, ... Cycle 9 = 110
        this.shootCooldownMax = 190 - ((cycle - 1) * 10);
        break;
      case EnemyType.BRAIN:
        // Use first frame for dimensions (all frames should be same size)
        // Brain is 8x10 pixels (oval shape with brainstem)
        this.width = BRAIN_FRAMES[0][0].length;
        this.height = BRAIN_FRAMES[0].length;
        this.health = 4; // Unique: 4 hits to destroy (because they descend slower)
        this.maxHealth = 4;
        // Randomize starting animation frame for variety
        this.animationFrame = Math.floor(Math.random() * BRAIN_FRAMES.length);
        // Progressive shooting: Cycle 1 = 30%, Cycle 2 = 32%, ... Cycle 9 = 46%
        this.shootChance = 0.30 + ((cycle - 1) * 0.02);
        // Progressive cooldown: Cycle 1 = 180, Cycle 2 = 170, ... Cycle 9 = 100
        this.shootCooldownMax = 180 - ((cycle - 1) * 10);
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
    
    // Update flickering animation for brains (faster flicker)
    if (this.type === EnemyType.BRAIN) {
      this.animationTimer += frameDelta;
      // Brains flicker faster (6 frames per animation frame for noticeable flicker)
      const brainAnimationSpeed = 6;
      if (this.animationTimer >= brainAnimationSpeed) {
        this.animationTimer = 0;
        this.animationFrame = (this.animationFrame + 1) % BRAIN_FRAMES.length;
      }
    }
    
    // Meteor/falling movement (straight down, no horizontal movement)
    if (this.isFalling) {
      this.y += this.fallSpeed * frameDelta;
      
      // Dollar bills float left and right while falling
      if (this.type === EnemyType.DOLLAR_BILL) {
        this.patternTime += frameDelta;
        // Float left and right using sine wave (oscillates smoothly)
        const floatAmplitude = 0.8; // Horizontal speed (pixels per frame)
        const floatSpeed = 0.08; // Speed of floating oscillation
        // Calculate horizontal velocity from sine wave derivative (cosine)
        this.vx = Math.cos(this.patternTime * floatSpeed) * floatAmplitude;
        this.x += this.vx * frameDelta;
        
        // Keep dollar bills within screen bounds
        if (this.x < 0) {
          this.x = 0;
          this.vx = 0; // Stop at edge
        } else if (this.x + this.width > this.gameWidth) {
          this.x = this.gameWidth - this.width;
          this.vx = 0; // Stop at edge
        }
      }
      
      // When reaching bottom, wrap to top at random X position
      if (this.y > this.gameHeight) {
        this.y = 0;
        this.x = 5 + Math.random() * (this.gameWidth - 10 - this.width);
        this.patternTime = 0; // Reset pattern time for new drop
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
      
      // Brains have individual wave pattern - each enemy oscillates up/down based on position
      // Progressive difficulty: wave becomes more intense with cycles
      if (this.type === EnemyType.BRAIN) {
        // Progressive wave amplitude: Cycle 1 = 2px, Cycle 2 = 2.5px, ... Cycle 9 = 5px
        const waveAmplitude = 2 + ((this.cycle - 1) * 0.375);
        // Progressive wave frequency: Cycle 1 = 0.02, Cycle 2 = 0.025, ... Cycle 9 = 0.05
        const waveFrequency = 0.02 + ((this.cycle - 1) * 0.00375);
        // Progressive phase offset: Cycle 1 = 0.2, Cycle 2 = 0.25, ... Cycle 9 = 0.4
        const wavePhase = this.lineX * (0.2 + ((this.cycle - 1) * 0.025));
        const waveOffset = Math.sin((this.patternTime * waveFrequency) + wavePhase) * waveAmplitude;
        this.y = lineY + waveOffset; // Apply wave offset to base line Y
        this.patternTime += deltaTime / 16.67; // Update pattern time
      } else {
        // Normal enemies follow line Y position
        this.y = lineY;
      }
      
      // Ensure enemy stays within horizontal bounds (for coins, dollars, diamonds)
      // Haters and brains have their own wrap-around logic, so skip for them
      if (this.type !== EnemyType.HATER && this.type !== EnemyType.BRAIN) {
        // Clamp to screen bounds
        if (this.x < 0) {
          this.x = 0;
        } else if (this.x + this.width > this.gameWidth) {
          this.x = this.gameWidth - this.width;
        }
      }
      
      // Strategic breakaway: progressive difficulty based on cycle
      // All enemies can break away, but chance increases with cycles
      let breakawayModifier = 1.0;
      if (playerX !== undefined && playerY !== undefined) {
        const distanceToPlayerX = Math.abs(this.x - playerX);
        const distanceToPlayerY = playerY - this.y;
        
        // Progressive breakaway: base chance increases with cycle
        // Cycle 1: 1.0x, Cycle 2: 1.2x, ... Cycle 9: 2.6x
        const cycleMultiplier = 1.0 + ((this.cycle - 1) * 0.2);
        
        // For brains in later cycles, use strategic breakaway (not random)
        if (this.type === EnemyType.BRAIN && this.cycle >= 4) {
          // Brains break away strategically: when player is cornered or directly below
          if ((playerX < 20 || playerX > this.gameWidth - 20) && distanceToPlayerY > 0 && distanceToPlayerY < 50) {
            breakawayModifier = 2.0 * cycleMultiplier; // Strategic flanking attack
          } else if (distanceToPlayerX < 25 && distanceToPlayerY > 0 && distanceToPlayerY < 40) {
            breakawayModifier = 1.5 * cycleMultiplier; // Direct attack when aligned
          } else {
            breakawayModifier = 0.3 * cycleMultiplier; // Lower chance otherwise (more strategic)
          }
        } else {
          // Normal breakaway logic for other enemies (progressive with cycle)
          // Increase breakaway chance when:
          // 1. Aligned with player horizontally
          if (distanceToPlayerX < 30 && distanceToPlayerY > 0 && distanceToPlayerY < 60) {
            breakawayModifier = 3.0 * cycleMultiplier; // 3x more likely (scaled by cycle)
          }
          // 2. Player is cornered (near edges)
          else if ((playerX < 20 || playerX > this.gameWidth - 20) && distanceToPlayerY > 0) {
            breakawayModifier = 2.0 * cycleMultiplier; // 2x more likely (scaled by cycle)
          } else {
            breakawayModifier = 1.0 * cycleMultiplier; // Base chance (scaled by cycle)
          }
        }
      }
      
      // Chance to break away and attack
      // For brains, use lower base chance but strategic modifiers
      const baseChance = this.type === EnemyType.BRAIN ? (this.breakawayChance * 0.5) : this.breakawayChance;
      if (Math.random() < baseChance * frameDelta * breakawayModifier) {
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
    
    // Keep enemies within bounds when they are in breakaway mode (not in line)
    // This now applies to ALL enemy types, including Haters, so they can't leave the screen forever.
    if (!this.isInLine) {
      // Horizontal bounds
      if (this.x < 0) {
        this.x = 0;
        this.vx = Math.abs(this.vx); // Bounce back into screen
      } else if (this.x + this.width > this.gameWidth) {
        this.x = this.gameWidth - this.width;
        this.vx = -Math.abs(this.vx); // Bounce back into screen
      }
      
      // Vertical wrap: if they reach the bottom, wrap to top so they re-enter play
      if (this.y + this.height > this.gameHeight) {
        this.y = 0; // Re-enter from top
        // If returning to line, allow them to keep moving toward the line position
      }
      
      // Safety check: if somehow above the top beyond their height, wrap to bottom
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
      case EnemyType.BRAIN:
        // Return current animation frame for flickering
        return BRAIN_FRAMES[this.animationFrame];
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
    this.vx = 0; // No horizontal movement (will be set dynamically for dollar bills)
    this.vy = this.fallSpeed;
    this.patternTime = 0; // Initialize pattern time for floating movement
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
    canShoot: boolean = false,
    cycle: number = 1
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
      canShoot,
      cycle
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

