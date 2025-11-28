/**
 * Enemy Line System
 * Manages lines/rows of enemies that move together
 */

import { Enemy, EnemyType } from './enemies';
import { ProjectileManager } from './projectiles';

export class EnemyLine {
  private enemies: Enemy[] = [];
  private x: number = 0; // Line position
  private y: number = 0;
  private vx: number = 1; // Horizontal velocity (left/right)
  private vy: number = 0.1; // Downward movement speed
  private gameWidth: number;
  private gameHeight: number;
  private enemySpacing: number = 18;
  private direction: number = 1; // 1 = right, -1 = left
  private enemyType: EnemyType; // Store enemy type for special behaviors
  private rowHeight: number = 20; // Height between rows for hater wrap-around
  
  // Strategic AI
  private lastCoordinatedAttack: number = 0; // Frame counter for coordinated attacks
  private coordinatedAttackCooldown: number = 180; // Frames between coordinated attacks
  private strategicTimer: number = 0; // Timer for strategic decisions
  
  private projectileManager: ProjectileManager | null = null;
  private canShoot: boolean = false;
  
  constructor(
    enemyType: EnemyType,
    y: number,
    enemyCount: number,
    gameWidth: number,
    gameHeight: number,
    breakawayChance: number = 0.001,
    speedMultiplier: number = 1.0, // Speed multiplier based on round
    projectileManager?: ProjectileManager,
    canShoot: boolean = false
  ) {
    this.enemyType = enemyType; // Store enemy type
    this.y = y;
    // Scale vertical speed based on round
    this.vy = 0.15 * speedMultiplier; // Base speed 0.15, scales with round
    
    // Haters move faster horizontally for more intense gameplay
    if (enemyType === EnemyType.HATER) {
      this.vx = 1.5 * speedMultiplier; // Faster horizontal speed for haters
    } else {
      this.vx = 1.0 * speedMultiplier; // Normal horizontal speed
    }
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.projectileManager = projectileManager || null;
    this.canShoot = canShoot;
    
    // Calculate how many enemies fit across the screen
    // Get enemy width from sprite (approximate)
    let enemyWidth = 8; // Default
    switch (enemyType) {
      case EnemyType.DOLLAR_BILL:
        enemyWidth = 12;
        break;
      case EnemyType.DIAMOND:
        enemyWidth = 8;
        break;
      case EnemyType.COIN:
        enemyWidth = 8;
        break;
      case EnemyType.HATER:
        enemyWidth = 8;
        break;
    }
    
    // Use the provided count (should always be > 0 now)
    const actualEnemyCount = enemyCount > 0 ? enemyCount : Math.floor((gameWidth - 10) / (enemyWidth + this.enemySpacing));
    
    // Calculate spacing to fit all enemies across screen width
    // Adjust spacing if needed to fit all enemies
    let spacing = this.enemySpacing;
    const totalWidthNeeded = (actualEnemyCount - 1) * spacing + enemyWidth;
    
    if (totalWidthNeeded > gameWidth - 10) {
      // Need to reduce spacing to fit all enemies
      spacing = Math.max(8, (gameWidth - 10 - enemyWidth) / (actualEnemyCount - 1));
    }
    
    // Calculate total width and start position to fill left to right
    const totalWidth = (actualEnemyCount - 1) * spacing + enemyWidth;
    const startX = Math.max(5, (gameWidth - totalWidth) / 2);
    
    // Create enemies in a line, filling left to right
    for (let i = 0; i < actualEnemyCount; i++) {
      const enemy = new Enemy(
        startX + i * spacing,
        y,
        0,
        0,
        enemyType,
        'straight',
        gameWidth,
        gameHeight,
        this.projectileManager || undefined,
        this.canShoot
      );
      enemy.setLinePosition(i * spacing);
      enemy.setBreakawayChance(breakawayChance);
      this.enemies.push(enemy);
    }
    
    // Initialize line position and update spacing
    this.x = startX;
    this.enemySpacing = spacing;
  }
  
  update(deltaTime: number, playerX?: number, playerY?: number): void {
    const frameDelta = deltaTime / 16.67;
    this.strategicTimer += frameDelta;
    this.lastCoordinatedAttack += frameDelta;
    
    // Calculate line width based on active enemies
    if (this.enemies.length === 0) return;
    
    const activeEnemies = this.enemies.filter(e => e.active);
    if (activeEnemies.length === 0) return;
    
    // Get enemy width (use first enemy as reference)
    const enemyWidth = activeEnemies[0].width;
    const lineWidth = (activeEnemies.length - 1) * this.enemySpacing + enemyWidth;
    
    // Special movement pattern for Haters: left-to-right wrap-around
    if (this.enemyType === EnemyType.HATER) {
      // Move line horizontally (always right for haters)
      this.x += this.vx * frameDelta;
      
      // When line reaches right edge, wrap to left and move down one row
      if (this.x + lineWidth > this.gameWidth - 5) {
        this.x = 5; // Reset to left side
        this.y += this.rowHeight; // Move down one row
        
        // If reached bottom, reset to top
        if (this.y + this.rowHeight > this.gameHeight - 20) {
          this.y = 0; // Reset to top
        }
      }
    } else {
      // Normal movement for other enemy types (bouncing)
      // Move line horizontally
      this.x += this.vx * this.direction * frameDelta;
      
      // Bounce off walls - keep line within bounds
      // Calculate bounds to ensure no enemy goes off-screen
      const minX = 0; // No margin - enemies can touch left edge
      const maxX = this.gameWidth - lineWidth; // Right edge of last enemy touches right wall
      
      // Check if line has hit a wall
      if (this.x <= minX) {
        this.direction = 1; // Force direction to right
        this.x = minX; // Clamp to left edge
        // Move down when hitting a wall (additional downward push)
        this.y += this.vy * 5;
      } else if (this.x >= maxX) {
        this.direction = -1; // Force direction to left
        this.x = maxX; // Clamp to right edge
        // Move down when hitting a wall (additional downward push)
        this.y += this.vy * 5;
      }
      
      // Move line down continuously
      this.y += this.vy * frameDelta;
      
      // Wrap line to top when it reaches the bottom
      if (this.y > this.gameHeight) {
        this.y = 0; // Re-enter from top
      }
    }
    
    // Strategic coordinated attacks
    if (playerX !== undefined && playerY !== undefined) {
      this.executeStrategicAttacks(playerX, playerY);
    }
    
    // Update all enemies in the line
    for (const enemy of this.enemies) {
      if (enemy.active) {
        enemy.update(deltaTime, this.x, this.y, this.vx * this.direction, this.vy, playerX, playerY);
      }
    }
    
    // Remove inactive enemies
    this.enemies = this.enemies.filter(e => e.active);
  }
  
  /**
   * Execute strategic coordinated attacks based on player position
   */
  private executeStrategicAttacks(playerX: number, playerY: number): void {
    const activeEnemies = this.enemies.filter(e => e.active && e.isInLineFormation());
    if (activeEnemies.length === 0) return;
    
    // Calculate strategic factors
    const lineCenterX = this.x + (activeEnemies.length - 1) * this.enemySpacing / 2;
    const distanceToPlayerX = Math.abs(lineCenterX - playerX);
    const distanceToPlayerY = playerY - this.y;
    const isAbovePlayer = distanceToPlayerY > 0 && distanceToPlayerY < 80; // Line is above player
    const isAlignedWithPlayer = distanceToPlayerX < 30; // Line is roughly above player
    
    // Strategy 1: Coordinated pincer attack when line is above player
    if (isAbovePlayer && isAlignedWithPlayer && this.lastCoordinatedAttack >= this.coordinatedAttackCooldown) {
      // Break away enemies on both sides of player position
      const enemiesToAttack = Math.min(3, Math.floor(activeEnemies.length * 0.3)); // 30% of line
      const sortedEnemies = [...activeEnemies].sort((a, b) => {
        const aDist = Math.abs((this.x + a.getLinePosition()) - playerX);
        const bDist = Math.abs((this.x + b.getLinePosition()) - playerX);
        return aDist - bDist;
      });
      
      for (let i = 0; i < enemiesToAttack; i++) {
        if (sortedEnemies[i]) {
          sortedEnemies[i].triggerStrategicBreakaway(playerX, playerY);
        }
      }
      
      this.lastCoordinatedAttack = 0;
    }
    
    // Strategy 2: Flanking attack when line is moving away from player
    if (this.strategicTimer > 60 && this.lastCoordinatedAttack >= this.coordinatedAttackCooldown * 0.7) {
      const movingAway = (this.direction > 0 && lineCenterX > playerX + 20) ||
                         (this.direction < 0 && lineCenterX < playerX - 20);
      
      if (movingAway && isAbovePlayer) {
        // Break away enemies on the side opposite to movement
        const flankingEnemies = activeEnemies.filter(e => {
          const enemyX = this.x + e.getLinePosition();
          if (this.direction > 0) {
            return enemyX < lineCenterX; // Left side when moving right
          } else {
            return enemyX > lineCenterX; // Right side when moving left
          }
        });
        
        if (flankingEnemies.length > 0) {
          const target = flankingEnemies[Math.floor(Math.random() * flankingEnemies.length)];
          target.triggerStrategicBreakaway(playerX, playerY);
          this.lastCoordinatedAttack = 0;
        }
      }
    }
    
    // Strategy 3: Pressure attack when line gets close to player vertically
    if (distanceToPlayerY > 0 && distanceToPlayerY < 40 && this.lastCoordinatedAttack >= this.coordinatedAttackCooldown * 0.5) {
      // Break away center enemies to pressure player
      const centerEnemies = activeEnemies.filter(e => {
        const enemyX = this.x + e.getLinePosition();
        return Math.abs(enemyX - playerX) < 40;
      });
      
      if (centerEnemies.length > 0 && Math.random() < 0.3) {
        const target = centerEnemies[Math.floor(Math.random() * centerEnemies.length)];
        target.triggerStrategicBreakaway(playerX, playerY);
        this.lastCoordinatedAttack = 0;
      }
    }
  }
  
  getEnemies(): Enemy[] {
    return this.enemies.filter(e => e.active);
  }
  
  getEnemyCount(): number {
    return this.enemies.filter(e => e.active).length;
  }
  
  isComplete(): boolean {
    return this.enemies.filter(e => e.active).length === 0;
  }
  
  getY(): number {
    return this.y;
  }
  
  setBreakawayChance(chance: number): void {
    for (const enemy of this.enemies) {
      enemy.setBreakawayChance(chance);
    }
  }
}

