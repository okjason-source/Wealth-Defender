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
  private direction: number = 1; // 1 = right, -1 = left (will be randomized for bouncing enemies)
  private enemyType: EnemyType; // Store enemy type for special behaviors
  private rowHeight: number = 20; // Height between rows for hater wrap-around
  private brainBaseY: number = -1; // Base Y position for brain wave pattern (initialized to -1 to detect if not set)
  private brainInitialY: number = -1; // Store initial Y position to prevent it from being changed
  private cycle: number = 1; // Current cycle (1-9) for progressive difficulty
  private framesSinceSpawn: number = 0; // Track frames since spawn to ensure enemies start at top
  
  // Strategic AI
  private lastCoordinatedAttack: number = 0; // Frame counter for coordinated attacks
  private coordinatedAttackCooldown: number = 180; // Frames between coordinated attacks
  private strategicTimer: number = 0; // Timer for strategic decisions
  
  private projectileManager: ProjectileManager | null = null;
  private canShoot: boolean = false;
  
  constructor(
    enemyType: EnemyType,
    _y: number, // Parameter ignored - all enemies start at y=0
    enemyCount: number,
    gameWidth: number,
    gameHeight: number,
    breakawayChance: number = 0.001,
    speedMultiplier: number = 1.0, // Speed multiplier based on round
    projectileManager?: ProjectileManager,
    canShoot: boolean = false,
    cycle: number = 1
  ) {
    this.cycle = cycle; // Store cycle for progressive difficulty
    this.enemyType = enemyType; // Store enemy type
    // CRITICAL: ALL enemies must start at the very top (y=0) for playability
    // Override any passed y value to ensure enemies always start at top
    this.y = 0;
    if (enemyType === EnemyType.BRAIN) {
      this.brainBaseY = 0; // Always start at top for brain wave pattern
      this.brainInitialY = 0; // Store initial Y to ensure it never goes below this
    } else {
      this.brainBaseY = 0; // Store initial Y
    }
    // Scale vertical speed based on round
    this.vy = 0.15 * speedMultiplier; // Base speed 0.15, scales with round
    
    // Progressive speed for all enemies based on cycle
    // All enemies get faster with cycles, but maintain their relative speeds
    if (enemyType === EnemyType.HATER) {
      // Haters: Progressive speed Cycle 1 = 1.3x, Cycle 2 = 1.4x, ... Cycle 9 = 2.1x
      const haterSpeedBase = 1.3 + ((cycle - 1) * 0.1);
      this.vx = haterSpeedBase * speedMultiplier;
    } else if (enemyType === EnemyType.BRAIN) {
      // Brains: Progressive speed Cycle 1 = 0.6x, Cycle 2 = 0.7x, ... Cycle 9 = 1.2x
      const brainSpeedBase = 0.6 + ((cycle - 1) * 0.075);
      this.vx = brainSpeedBase * speedMultiplier;
    } else if (enemyType === EnemyType.DIAMOND) {
      // Diamonds: Progressive speed Cycle 1 = 0.9x, Cycle 2 = 1.0x, ... Cycle 9 = 1.6x
      const diamondSpeedBase = 0.9 + ((cycle - 1) * 0.0875);
      this.vx = diamondSpeedBase * speedMultiplier;
    } else if (enemyType === EnemyType.DOLLAR_BILL) {
      // Dollar Bills: Progressive speed Cycle 1 = 0.95x, Cycle 2 = 1.05x, ... Cycle 9 = 1.65x
      const dollarSpeedBase = 0.95 + ((cycle - 1) * 0.0875);
      this.vx = dollarSpeedBase * speedMultiplier;
    } else {
      // Coins: Progressive speed Cycle 1 = 1.0x, Cycle 2 = 1.1x, ... Cycle 9 = 1.7x
      const coinSpeedBase = 1.0 + ((cycle - 1) * 0.0875);
      this.vx = coinSpeedBase * speedMultiplier;
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
      case EnemyType.BRAIN:
        enemyWidth = 8;
        break;
    }
    
    // Use the provided count (should always be > 0 now)
    const actualEnemyCount = enemyCount > 0 ? enemyCount : Math.floor((gameWidth - 10) / (enemyWidth + this.enemySpacing));
    
    // Calculate spacing to fit all enemies across screen width
    // ALL enemies should utilize full screen width for better balance
    let spacing = this.enemySpacing;
    const totalWidthNeeded = (actualEnemyCount - 1) * spacing + enemyWidth;
    
    // For ALL enemy types, spread them across full width when there are fewer enemies
    // This ensures all enemies use both left and right sides for balance
    if (totalWidthNeeded < gameWidth - 10) {
      // If line doesn't fill screen, increase spacing to utilize full width
      // Use 90% of available width to leave some margin for movement
      spacing = Math.max(this.enemySpacing, ((gameWidth - 10) * 0.9 - enemyWidth) / (actualEnemyCount - 1));
    } else if (totalWidthNeeded > gameWidth - 10) {
      // Need to reduce spacing to fit all enemies
      spacing = Math.max(8, (gameWidth - 10 - enemyWidth) / (actualEnemyCount - 1));
    }
    
    // Calculate total width and start position
    const totalWidth = (actualEnemyCount - 1) * spacing + enemyWidth;
    
    // ALL enemies start from left edge to ensure full width traversal
    // This prevents favoring the right side and ensures balanced screen utilization
    let startX = 5; // Start from left edge (with small margin)
    // Ensure the line doesn't exceed right edge
    if (startX + totalWidth > gameWidth - 5) {
      startX = Math.max(5, gameWidth - totalWidth - 5);
    }
    
    // Create enemies in a line, filling left to right
    // ALL enemies must start at the very top (y=0) for playability
    const enemyStartY = 0;
    for (let i = 0; i < actualEnemyCount; i++) {
      const enemy = new Enemy(
        startX + i * spacing,
        enemyStartY,
        0,
        0,
        enemyType,
        'straight',
        gameWidth,
        gameHeight,
        this.projectileManager || undefined,
        this.canShoot,
        this.cycle // Pass cycle for progressive difficulty
      );
      enemy.setLinePosition(i * spacing);
      enemy.setBreakawayChance(breakawayChance);
      this.enemies.push(enemy);
    }
    
    // Initialize line position and update spacing
    this.x = startX;
    this.enemySpacing = spacing;
    // brainBaseY is already set above in constructor
    
    // Randomize starting direction for bouncing enemies (COIN, DOLLAR_BILL, DIAMOND)
    // This prevents enemies from always favoring the right side
    // BRAIN and HATER always move right (by design), so don't randomize those
    if (enemyType !== EnemyType.BRAIN && enemyType !== EnemyType.HATER) {
      this.direction = Math.random() < 0.5 ? -1 : 1; // 50/50 chance to start left or right
    }
  }
  
  update(deltaTime: number, playerX?: number, playerY?: number): void {
    const frameDelta = deltaTime / 16.67;
    this.strategicTimer += frameDelta;
    this.lastCoordinatedAttack += frameDelta;
    this.framesSinceSpawn += frameDelta;
    
    // Safety check: Ensure Y never goes negative (applies to all enemy types)
    if (this.y < 0) {
      this.y = 0;
    }
    
    // For brains, ensure brainBaseY is set (if not initialized, use current y)
    // This should only run if brainBaseY wasn't set in constructor
    if (this.enemyType === EnemyType.BRAIN && this.brainBaseY < 0) {
      this.brainBaseY = 0;
      this.brainInitialY = 0;
    }
    
    // Calculate line width based on active enemies
    if (this.enemies.length === 0) return;
    
    const activeEnemies = this.enemies.filter(e => e.active);
    if (activeEnemies.length === 0) return;
    
    // Get enemy width (use first enemy as reference)
    const enemyWidth = activeEnemies[0].width;
    const lineWidth = (activeEnemies.length - 1) * this.enemySpacing + enemyWidth;
    
    // Special movement pattern for Brains: wave pattern (smooth up/down) with left-to-right wrap
    if (this.enemyType === EnemyType.BRAIN) {
      // CRITICAL SAFETY CHECK: If brainBaseY is greater than 20 pixels, FORCE reset to 0
      // This catches ANY initialization error or coordinate system issue
      // Enemies should NEVER start this low - they must start at the top
      if (this.brainBaseY > 20) {
        this.brainBaseY = 0;
        this.brainInitialY = 0;
        this.y = 0;
      }
      
      // Brains move right and wrap around, descending slightly each wrap
      // Safety check: Ensure brainBaseY is never negative
      if (this.brainBaseY < 0) {
        this.brainBaseY = 0;
        this.brainInitialY = 0;
      }
      
      // Ensure brainBaseY never goes below initial position (safety check)
      if (this.brainInitialY >= 0 && this.brainBaseY < this.brainInitialY) {
        this.brainBaseY = this.brainInitialY;
      }
      
      // Move line horizontally (always right for brains)
      this.x += this.vx * frameDelta;
      
      // Base Y position - uses brainBaseY which starts at 0 and increases as they wrap around
      // Apply wave pattern will be done in individual enemy update
      this.y = this.brainBaseY;
      
      // When line reaches right edge, wrap to left and move down slightly
      // This is the key mechanic: brains get closer each time they wrap around
      // CRITICAL: Brains must ALWAYS wrap, never bounce or get stuck
      if (this.x + lineWidth > this.gameWidth - 5 || this.x + lineWidth >= this.gameWidth) {
        this.x = 5; // Reset to left side
        // Progressive descent: Cycle 1 = 3px, Cycle 2 = 4px, ... Cycle 9 = 8px
        const descentRate = 3 + ((this.cycle - 1) * 0.625); // Increases with cycle
        this.brainBaseY += descentRate;
        this.y = this.brainBaseY;
      }
      
      // Safety check: If brain somehow gets stuck at right edge, force wrap
      // This prevents brains from bouncing or getting stuck
      if (this.x + lineWidth >= this.gameWidth - 1) {
        this.x = 5; // Force wrap to left
        const descentRate = 3 + ((this.cycle - 1) * 0.625);
        this.brainBaseY += descentRate;
        this.y = this.brainBaseY;
      }
      
      // Keep Y within bounds (don't go too low - but allow them to get close to player)
      if (this.brainBaseY > this.gameHeight - 30) {
        this.brainBaseY = this.gameHeight - 30;
        this.y = this.brainBaseY;
      }
    }
    // Special movement pattern for Haters: left-to-right wrap-around
    else if (this.enemyType === EnemyType.HATER) {
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
      
      // Move line down continuously (normal descent progression)
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
        // For brain enemies, always move right (no direction change)
        const enemyVx = (this.enemyType === EnemyType.BRAIN) ? this.vx : (this.vx * this.direction);
        // Pass line Y position - brain enemies will apply their own wave pattern
        enemy.update(deltaTime, this.x, this.y, enemyVx, this.vy, playerX, playerY);
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

