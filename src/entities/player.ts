/**
 * Player Entity
 * The player's spaceship
 */

import { PLAYER_SPRITE } from '../graphics/sprites';
import { InputSystem } from '../systems/input';
import { ProjectileManager, ProjectileType } from './projectiles';
import { Palette } from '../graphics/palette';
import { Enemy } from './enemies';

export class Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number = 3.5; // Increased base speed
  private input: InputSystem;
  private projectileManager: ProjectileManager;
  private gameWidth: number;
  private gameHeight: number;
  private enemyManager?: any; // Will be EnemyManager, set from GameManager
  
  // Smooth movement with acceleration
  private velocityX: number = 0;
  private velocityY: number = 0;
  private acceleration: number = 0.25; // How quickly player reaches max speed
  private friction: number = 0.15; // How quickly player slows down
  private maxSpeed: number = 3.5; // Maximum movement speed
  
  // Weapon cooldowns
  private autoFireCooldown: number = 0;
  private autoFireRate: number = 3; // Frames between shots (rapid fire - was 8)
  
  // Lightning Laser weapon (new system)
  public laserCount: number = 5; // Start with 5 lasers
  private lightningLaserActive: boolean = false;
  private lightningLaserDuration: number = 0;
  private lightningLaserMaxDuration: number = 10; // Frames the laser is visible
  private lightningLaserTargets: Array<{ enemy: Enemy; x: number; y: number }> = [];
  private lightningLaserColor: string = Palette.PURE_WHITE;
  private lightningLaserRange: number = 80; // Maximum range to hit enemies
  
  constructor(
    x: number,
    y: number,
    input: InputSystem,
    projectileManager: ProjectileManager,
    gameWidth: number,
    gameHeight: number
  ) {
    this.x = x;
    this.y = y;
    this.width = PLAYER_SPRITE[0].length;
    this.height = PLAYER_SPRITE.length;
    this.input = input;
    this.projectileManager = projectileManager;
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
  }
  
  update(deltaTime: number, botMoveX?: number, botMoveY?: number, botShouldShoot?: boolean): void {
    const frameDelta = deltaTime / 16.67; // Normalize to 60 FPS
    
    // Handle movement (bot control or input)
    let targetVelocityX = 0;
    let targetVelocityY = 0;
    
    if (botMoveX !== undefined && botMoveY !== undefined) {
      // Bot control - direct velocity for bot
      targetVelocityX = botMoveX * this.maxSpeed;
      targetVelocityY = botMoveY * this.maxSpeed;
    } else {
      // Player input - smooth acceleration
      if (this.input.isMovingLeft()) {
        targetVelocityX = -this.maxSpeed;
      } else if (this.input.isMovingRight()) {
        targetVelocityX = this.maxSpeed;
      }
      
      if (this.input.isMovingUp()) {
        targetVelocityY = -this.maxSpeed;
      } else if (this.input.isMovingDown()) {
        targetVelocityY = this.maxSpeed;
      }
    }
    
    // Apply acceleration/deceleration for smooth movement
    if (targetVelocityX !== 0) {
      // Accelerate towards target velocity
      if (this.velocityX < targetVelocityX) {
        this.velocityX = Math.min(targetVelocityX, this.velocityX + this.acceleration * frameDelta);
      } else if (this.velocityX > targetVelocityX) {
        this.velocityX = Math.max(targetVelocityX, this.velocityX - this.acceleration * frameDelta);
      }
    } else {
      // Apply friction when no input
      if (this.velocityX > 0) {
        this.velocityX = Math.max(0, this.velocityX - this.friction * frameDelta);
      } else if (this.velocityX < 0) {
        this.velocityX = Math.min(0, this.velocityX + this.friction * frameDelta);
      }
      // Stop very small velocities
      if (Math.abs(this.velocityX) < 0.1) {
        this.velocityX = 0;
      }
    }
    
    if (targetVelocityY !== 0) {
      // Accelerate towards target velocity
      if (this.velocityY < targetVelocityY) {
        this.velocityY = Math.min(targetVelocityY, this.velocityY + this.acceleration * frameDelta);
      } else if (this.velocityY > targetVelocityY) {
        this.velocityY = Math.max(targetVelocityY, this.velocityY - this.acceleration * frameDelta);
      }
    } else {
      // Apply friction when no input
      if (this.velocityY > 0) {
        this.velocityY = Math.max(0, this.velocityY - this.friction * frameDelta);
      } else if (this.velocityY < 0) {
        this.velocityY = Math.min(0, this.velocityY + this.friction * frameDelta);
      }
      // Stop very small velocities
      if (Math.abs(this.velocityY) < 0.1) {
        this.velocityY = 0;
      }
    }
    
    // Update position using velocity
    const newX = this.x + this.velocityX * frameDelta;
    const newY = this.y + this.velocityY * frameDelta;
    
    // Keep player within bounds
    this.x = Math.max(0, Math.min(newX, this.gameWidth - this.width));
    this.y = Math.max(0, Math.min(newY, this.gameHeight - this.height));
    
    // Stop velocity if hitting a boundary
    if (this.x <= 0 || this.x >= this.gameWidth - this.width) {
      this.velocityX = 0;
    }
    if (this.y <= 0 || this.y >= this.gameHeight - this.height) {
      this.velocityY = 0;
    }
    
    // Handle weapons
    this.updateWeapons(deltaTime, botShouldShoot);
    
    // Update lightning laser
    if (this.lightningLaserActive) {
      this.lightningLaserDuration -= deltaTime / 16.67;
      if (this.lightningLaserDuration <= 0) {
        this.lightningLaserActive = false;
        this.lightningLaserTargets = [];
      }
    }
  }
  
  setEnemyManager(enemyManager: any): void {
    this.enemyManager = enemyManager;
  }
  
  addLasers(count: number): void {
    this.laserCount += count;
  }
  
  getLaserCount(): number {
    return this.laserCount;
  }
  
  private updateWeapons(deltaTime: number, botShouldShoot?: boolean): void {
    // Update cooldowns
    if (this.autoFireCooldown > 0) {
      this.autoFireCooldown -= deltaTime / 16.67;
    }
    
    // Auto-fire cannon (bot or player input)
    const shouldAutoFire = botShouldShoot !== undefined ? botShouldShoot : this.input.isAutoFirePressed();
    if (shouldAutoFire && this.autoFireCooldown <= 0) {
      this.fireAutoCannon();
      this.autoFireCooldown = this.autoFireRate;
    }
    
    // Lightning laser (replaces old targeting laser) - Z key or mouse click
    if (!botShouldShoot && this.input.wasKeyJustPressed('z') && this.laserCount > 0 && !this.lightningLaserActive) {
      this.fireLightningLaser();
    }
  }
  
  private fireAutoCannon(): void {
    // Fire straight up from center of player
    const startX = this.x + this.width / 2;
    const startY = this.y;
    const speed = -4; // Negative Y = up
    
    this.projectileManager.createProjectile(
      startX,
      startY,
      0,
      speed,
      ProjectileType.PLAYER
    );
  }
  
  private fireLightningLaser(): void {
    if (!this.enemyManager || this.laserCount <= 0) return;
    
    // Use one laser
    this.laserCount--;
    
    // Random neon color or white
    const colors = [
      Palette.PURE_WHITE,
      Palette.NEON_PURPLE,
      Palette.NEON_BLUE,
      Palette.NEON_CYAN,
      Palette.NEON_GREEN,
      Palette.NEON_YELLOW,
    ];
    this.lightningLaserColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Find all enemies within range
    const playerCenterX = this.x + this.width / 2;
    const playerCenterY = this.y + this.height / 2;
    const enemies = this.enemyManager.getEnemies();
    
    this.lightningLaserTargets = [];
    for (const enemy of enemies) {
      const enemyBounds = enemy.getBounds();
      const enemyCenterX = enemyBounds.x + enemyBounds.width / 2;
      const enemyCenterY = enemyBounds.y + enemyBounds.height / 2;
      
      const dx = enemyCenterX - playerCenterX;
      const dy = enemyCenterY - playerCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= this.lightningLaserRange) {
        this.lightningLaserTargets.push({
          enemy: enemy,
          x: enemyCenterX,
          y: enemyCenterY,
        });
        // Destroy enemy with 1 shot
        enemy.takeDamage(enemy.maxHealth);
      }
    }
    
    // Activate laser visual
    this.lightningLaserActive = true;
    this.lightningLaserDuration = this.lightningLaserMaxDuration;
  }
  
  getLightningLaserData(): { active: boolean; targets: Array<{ x: number; y: number }>; color: string; playerX: number; playerY: number } | null {
    if (!this.lightningLaserActive) return null;
    
    return {
      active: true,
      targets: this.lightningLaserTargets.map(t => ({ x: t.x, y: t.y })),
      color: this.lightningLaserColor,
      playerX: this.x + this.width / 2,
      playerY: this.y + this.height / 2,
    };
  }
  
  getSprite(): number[][] {
    return PLAYER_SPRITE;
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
}

