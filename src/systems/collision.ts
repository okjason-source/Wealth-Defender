/**
 * Collision Detection System
 * Handles all collision checks
 */

import { Player } from '../entities/player';
import { Enemy } from '../entities/enemies';
import { Projectile, ProjectileType } from '../entities/projectiles';

export class CollisionSystem {
  /**
   * Check if two rectangles overlap
   */
  private rectOverlap(
    x1: number, y1: number, w1: number, h1: number,
    x2: number, y2: number, w2: number, h2: number
  ): boolean {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  }
  
  /**
   * Check collision between player and enemy
   */
  checkPlayerEnemy(player: Player, enemy: Enemy): boolean {
    const playerBounds = player.getBounds();
    const enemyBounds = enemy.getBounds();
    
    return this.rectOverlap(
      playerBounds.x, playerBounds.y, playerBounds.width, playerBounds.height,
      enemyBounds.x, enemyBounds.y, enemyBounds.width, enemyBounds.height
    );
  }
  
  /**
   * Check collision between projectile and enemy
   */
  checkProjectileEnemy(projectile: Projectile, enemy: Enemy): boolean {
    if (projectile.type !== ProjectileType.PLAYER) return false;
    
    const projBounds = projectile.getBounds();
    const enemyBounds = enemy.getBounds();
    
    return this.rectOverlap(
      projBounds.x, projBounds.y, projBounds.width, projBounds.height,
      enemyBounds.x, enemyBounds.y, enemyBounds.width, enemyBounds.height
    );
  }
  
  /**
   * Check collision between projectile and player
   */
  checkProjectilePlayer(projectile: Projectile, player: Player): boolean {
    if (projectile.type !== ProjectileType.ENEMY) return false;
    
    const projBounds = projectile.getBounds();
    const playerBounds = player.getBounds();
    
    return this.rectOverlap(
      projBounds.x, projBounds.y, projBounds.width, projBounds.height,
      playerBounds.x, playerBounds.y, playerBounds.width, playerBounds.height
    );
  }
  
  /**
   * Check all collisions and handle them
   */
  checkAllCollisions(
    player: Player,
    enemies: Enemy[],
    projectiles: Projectile[]
  ): {
    playerHit: boolean;
    enemiesHit: Enemy[];
    projectilesToRemove: Projectile[];
  } {
    const result = {
      playerHit: false,
      enemiesHit: [] as Enemy[],
      projectilesToRemove: [] as Projectile[],
    };
    
    // Check player-projectile collisions
    for (const projectile of projectiles) {
      if (this.checkProjectilePlayer(projectile, player)) {
        result.playerHit = true;
        result.projectilesToRemove.push(projectile);
      }
    }
    
    // Check player-enemy collisions
    for (const enemy of enemies) {
      if (this.checkPlayerEnemy(player, enemy)) {
        result.playerHit = true;
      }
    }
    
    // Check projectile-enemy collisions
    for (const projectile of projectiles) {
      for (const enemy of enemies) {
        if (this.checkProjectileEnemy(projectile, enemy)) {
          enemy.takeDamage(1);
          result.projectilesToRemove.push(projectile);
          
          if (!enemy.active) {
            result.enemiesHit.push(enemy);
          }
          break; // Projectile can only hit one enemy
        }
      }
    }
    
    return result;
  }
}

