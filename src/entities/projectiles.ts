/**
 * Projectile System
 * Handles player and enemy projectiles
 */

import { PLAYER_PROJECTILE_SPRITE, ENEMY_PROJECTILE_SPRITE } from '../graphics/sprites';

export enum ProjectileType {
  PLAYER,
  ENEMY,
}

export class Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: ProjectileType;
  width: number;
  height: number;
  active: boolean = true;
  
  constructor(x: number, y: number, vx: number, vy: number, type: ProjectileType) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.type = type;
    
    // Set dimensions based on sprite
    if (type === ProjectileType.PLAYER) {
      this.width = PLAYER_PROJECTILE_SPRITE[0].length;
      this.height = PLAYER_PROJECTILE_SPRITE.length;
    } else {
      this.width = ENEMY_PROJECTILE_SPRITE[0].length;
      this.height = ENEMY_PROJECTILE_SPRITE.length;
    }
  }
  
  update(deltaTime: number): void {
    if (!this.active) return;
    
    this.x += this.vx * (deltaTime / 16.67); // Normalize to 60 FPS
    this.y += this.vy * (deltaTime / 16.67);
  }
  
  isOutOfBounds(width: number, height: number): boolean {
    return this.x < 0 || this.x > width || this.y < 0 || this.y > height;
  }
  
  getSprite(): number[][] {
    return this.type === ProjectileType.PLAYER 
      ? PLAYER_PROJECTILE_SPRITE 
      : ENEMY_PROJECTILE_SPRITE;
  }
  
  getBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
}

export class ProjectileManager {
  private projectiles: Projectile[] = [];
  private gameWidth: number;
  private gameHeight: number;
  
  constructor(gameWidth: number, gameHeight: number) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
  }
  
  createProjectile(x: number, y: number, vx: number, vy: number, type: ProjectileType): void {
    this.projectiles.push(new Projectile(x, y, vx, vy, type));
  }
  
  update(deltaTime: number): void {
    for (const projectile of this.projectiles) {
      if (projectile.active) {
        projectile.update(deltaTime);
        
        // Remove out of bounds projectiles
        if (projectile.isOutOfBounds(this.gameWidth, this.gameHeight)) {
          projectile.active = false;
        }
      }
    }
    
    // Clean up inactive projectiles
    this.projectiles = this.projectiles.filter(p => p.active);
  }
  
  getProjectiles(): Projectile[] {
    return this.projectiles.filter(p => p.active);
  }
  
  getPlayerProjectiles(): Projectile[] {
    return this.projectiles.filter(p => p.active && p.type === ProjectileType.PLAYER);
  }
  
  getEnemyProjectiles(): Projectile[] {
    return this.projectiles.filter(p => p.active && p.type === ProjectileType.ENEMY);
  }
  
  removeProjectile(projectile: Projectile): void {
    projectile.active = false;
  }
  
  clear(): void {
    this.projectiles = [];
  }
}

