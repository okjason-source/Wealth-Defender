/**
 * Bonus Maze System
 * Creates random maze-like obstacle courses for bonus rounds
 */

export interface MazeWall {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BonusLife {
  x: number;
  y: number;
  collected: boolean;
}

export interface BonusLaser {
  x: number;
  y: number;
  collected: boolean;
}

export class BonusMaze {
  private walls: MazeWall[] = [];
  private lives: BonusLife[] = []; // Array of life pickups (10 before round 28, 15 after)
  private lasers: BonusLaser[] = []; // Array of laser pickups (10 before round 28, 15 after)
  private gameWidth: number;
  private gameHeight: number; // Used in placeLife and checkExit
  private pathWidth: number = 45; // Width of the path through the maze (increased for easier navigation)
  private segments: number = 8; // Number of horizontal segments in the maze
  private segmentHeight: number;
  private playerAutoSpeed: number = 0.5; // Automatic forward movement speed
  private exited: boolean = false;
  private round: number = 1; // Track current round for item scaling

  constructor(gameWidth: number, gameHeight: number, round: number = 1) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.round = round;
    this.segmentHeight = gameHeight / this.segments;
    this.generateMaze();
    this.placeLives(); // Place lives (more after round 28)
    this.placeLasers(); // Place lasers (more after round 28)
  }

  /**
   * Generate a random maze with winding paths
   */
  private generateMaze(): void {
    this.walls = [];
    
    // Start with a path in the center at the bottom
    // ALWAYS start exactly centered for the entrance
    let currentPathX = this.gameWidth / 2;
    const pathVariation = (this.gameWidth - this.pathWidth) / 2 - 10; // Max variation from center
    
    // Create segments from bottom to top
    for (let segment = 0; segment < this.segments; segment++) {
      const y = segment * this.segmentHeight;
      
      // For the first segment (entrance), ALWAYS keep it centered
      if (segment === 0) {
        currentPathX = this.gameWidth / 2; // Force center for entrance
      } else {
        // For subsequent segments, smoothly vary the path position
        // Reduced variation (0.3 instead of 0.6) for smoother, less sharp corners
        // Also limit max change per segment to prevent sharp turns
        const maxChangePerSegment = 15; // Maximum pixels the path can shift per segment
        const variation = (Math.random() - 0.5) * pathVariation * 0.3;
        const desiredX = currentPathX + variation;
        const change = desiredX - currentPathX;
        const limitedChange = Math.max(-maxChangePerSegment, Math.min(maxChangePerSegment, change));
        
        currentPathX = Math.max(
          this.pathWidth / 2 + 5,
          Math.min(
            this.gameWidth - this.pathWidth / 2 - 5,
            currentPathX + limitedChange
          )
        );
      }
      
      // Create walls on left and right sides of the path
      // Left wall
      if (currentPathX - this.pathWidth / 2 > 0) {
        this.walls.push({
          x: 0,
          y: y,
          width: currentPathX - this.pathWidth / 2,
          height: this.segmentHeight,
        });
      }
      
      // Right wall
      const rightWallX = currentPathX + this.pathWidth / 2;
      if (rightWallX < this.gameWidth) {
        this.walls.push({
          x: rightWallX,
          y: y,
          width: this.gameWidth - rightWallX,
          height: this.segmentHeight,
        });
      }
      
      // Add some random obstacles in the path (smaller walls)
      // Reduced obstacle frequency and size for easier navigation
      // Don't add obstacles in the first segment (where player starts) or last segment (exit)
      if (segment > 1 && segment < this.segments - 2 && Math.random() < 0.15) { // Reduced from 0.3 to 0.15
        const obstacleSide = Math.random() < 0.5 ? 'left' : 'right';
        const obstacleWidth = 6 + Math.random() * 8; // Reduced from 8-20 to 6-14
        const obstacleX = obstacleSide === 'left'
          ? currentPathX - this.pathWidth / 2
          : currentPathX + this.pathWidth / 2 - obstacleWidth;
        
        this.walls.push({
          x: obstacleX,
          y: y + this.segmentHeight * 0.3,
          width: obstacleWidth,
          height: this.segmentHeight * 0.3, // Reduced height from 0.4 to 0.3
        });
      }
    }
    
    // Ensure the bottom segment (where player starts) has a clear path
    // Remove any walls that might block the starting position
    this.walls = this.walls.filter(wall => {
      // Remove walls in the bottom segment that are in the center path
      if (wall.y < this.segmentHeight) {
        const centerX = this.gameWidth / 2;
        const pathLeft = centerX - this.pathWidth / 2;
        const pathRight = centerX + this.pathWidth / 2;
        // Remove walls that overlap with the center path
        if (wall.x + wall.width > pathLeft && wall.x < pathRight) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Check if a position overlaps with any wall
   */
  private checkWallOverlap(x: number, y: number, size: number = 8): boolean {
    for (const wall of this.walls) {
      if (
        x < wall.x + wall.width &&
        x + size > wall.x &&
        y < wall.y + wall.height &&
        y + size > wall.y
      ) {
        return true; // Overlaps with wall
      }
    }
    return false;
  }

  /**
   * Place free lives throughout the maze
   * Positioned on left side - player must choose between life and laser
   * More lives after round 28 (15 lives instead of 10)
   */
  private placeLives(): void {
    this.lives = [];
    // Increase lives after round 28: 10 lives before, 15 lives after
    const totalLives = this.round >= 28 ? 15 : 10;
    const itemSize = 8;
    
    // Place lives in segments 1-7 (spread out across more segments)
    for (let i = 0; i < totalLives; i++) {
      // Distribute across segments 1-7 (avoiding segment 0 where player starts)
      const segmentIndex = 1 + (i % 7); // Segments 1-7, cycling if needed
      const lifeY = segmentIndex * this.segmentHeight + this.segmentHeight / 2;
      
      // Place lives on the LEFT side of the path, closer to center for easier collection
      // Path center is gameWidth/2 (100), path width is 45
      // Left edge of path is at 100 - 22.5 = 77.5
      // Place pickups 15-20 pixels from left edge (closer to center, easier to collect)
      let lifeX = this.gameWidth / 2 - this.pathWidth / 2 + 15 + Math.random() * 5;
      
      // Try multiple positions to avoid wall overlap
      let attempts = 0;
      while (this.checkWallOverlap(lifeX, lifeY, itemSize) && attempts < 10) {
        lifeX = this.gameWidth / 2 - this.pathWidth / 2 + 15 + Math.random() * 5;
        attempts++;
      }
      
      // If still overlapping after attempts, move it more towards center
      if (this.checkWallOverlap(lifeX, lifeY, itemSize)) {
        lifeX = this.gameWidth / 2 - this.pathWidth / 2 + 18; // Force position more towards center
      }
      
      this.lives.push({
        x: lifeX,
        y: lifeY,
        collected: false,
      });
    }
  }
  
  /**
   * Place laser pickups throughout the maze
   * Positioned on right side - player must choose between life and laser
   * More lasers after round 28 (15 lasers instead of 10)
   */
  private placeLasers(): void {
    this.lasers = [];
    // Increase lasers after round 28: 10 lasers before, 15 lasers after
    const totalLasers = this.round >= 28 ? 15 : 10;
    const itemSize = 8;
    
    // Place lasers in segments 1-7 (spread out across more segments)
    for (let i = 0; i < totalLasers; i++) {
      // Distribute across segments 1-7 (avoiding segment 0 where player starts)
      const segmentIndex = 1 + (i % 7); // Segments 1-7, cycling if needed
      const laserY = segmentIndex * this.segmentHeight + this.segmentHeight / 2;
      
      // Place lasers on the RIGHT side of the path, closer to center for easier collection
      // Path center is gameWidth/2 (100), path width is 45
      // Right edge of path is at 100 + 22.5 = 122.5
      // Place pickups 15-20 pixels from right edge (closer to center, easier to collect)
      let laserX = this.gameWidth / 2 + this.pathWidth / 2 - 20 + Math.random() * 5;
      
      // Try multiple positions to avoid wall overlap
      let attempts = 0;
      while (this.checkWallOverlap(laserX, laserY, itemSize) && attempts < 10) {
        laserX = this.gameWidth / 2 + this.pathWidth / 2 - 20 + Math.random() * 5;
        attempts++;
      }
      
      // If still overlapping after attempts, move it more towards center
      if (this.checkWallOverlap(laserX, laserY, itemSize)) {
        laserX = this.gameWidth / 2 + this.pathWidth / 2 - 18; // Force position more towards center
      }
      
      this.lasers.push({
        x: laserX,
        y: laserY,
        collected: false,
      });
    }
  }

  /**
   * Update player position (automatic forward movement)
   */
  updatePlayer(playerX: number, playerY: number, playerWidth: number, _playerHeight: number, steerLeft: boolean, steerRight: boolean): { x: number; y: number } {
    // Automatic forward movement (upward)
    let newY = playerY - this.playerAutoSpeed;
    
    // Steering (left/right only)
    let newX = playerX;
    const steerSpeed = 1.5;
    if (steerLeft) {
      newX -= steerSpeed;
    }
    if (steerRight) {
      newX += steerSpeed;
    }
    
    // Keep player in bounds
    newX = Math.max(0, Math.min(newX, this.gameWidth - playerWidth));
    newY = Math.max(0, newY);
    
    return { x: newX, y: newY };
  }

  /**
   * Check collision with walls
   */
  checkWallCollision(playerX: number, playerY: number, playerWidth: number, playerHeight: number): boolean {
    for (const wall of this.walls) {
      if (
        playerX < wall.x + wall.width &&
        playerX + playerWidth > wall.x &&
        playerY < wall.y + wall.height &&
        playerY + playerHeight > wall.y
      ) {
        return true; // Collision detected
      }
    }
    return false;
  }

  /**
   * Check if player collected any lives
   * Returns the number of lives collected this frame
   */
  checkLifeCollection(playerX: number, playerY: number, playerWidth: number, playerHeight: number): number {
    let collectedCount = 0;
    const lifeSize = 8; // Size of the life pickup
    
    for (const life of this.lives) {
      if (life.collected) continue;
      
      if (
        playerX < life.x + lifeSize &&
        playerX + playerWidth > life.x &&
        playerY < life.y + lifeSize &&
        playerY + playerHeight > life.y
      ) {
        life.collected = true;
        collectedCount++;
      }
    }
    
    return collectedCount;
  }
  
  /**
   * Check if player collected any lasers
   * Returns the number of lasers collected this frame
   */
  checkLaserCollection(playerX: number, playerY: number, playerWidth: number, playerHeight: number): number {
    let collectedCount = 0;
    const laserSize = 8; // Size of the laser pickup
    
    for (const laser of this.lasers) {
      if (laser.collected) continue;
      
      if (
        playerX < laser.x + laserSize &&
        playerX + playerWidth > laser.x &&
        playerY < laser.y + laserSize &&
        playerY + playerHeight > laser.y
      ) {
        laser.collected = true;
        collectedCount++;
      }
    }
    
    return collectedCount;
  }

  /**
   * Check if player exited through the top
   */
  checkExit(playerY: number): boolean {
    // Use gameHeight to ensure we're checking against the top of the screen
    if (playerY <= 0 || playerY < this.gameHeight * 0.05) {
      this.exited = true;
      return true;
    }
    return false;
  }

  /**
   * Get all walls for rendering
   */
  getWalls(): MazeWall[] {
    return this.walls;
  }

  /**
   * Get all uncollected lives
   */
  getLives(): BonusLife[] {
    return this.lives.filter(life => !life.collected);
  }
  
  /**
   * Get all uncollected lasers
   */
  getLasers(): BonusLaser[] {
    return this.lasers.filter(laser => !laser.collected);
  }

  /**
   * Check if player exited
   */
  hasExited(): boolean {
    return this.exited;
  }

  /**
   * Reset maze (generate new one)
   */
  reset(round: number = 1): void {
    this.exited = false;
    this.round = round;
    this.generateMaze();
    this.placeLives(); // Place lives (more after round 28)
    this.placeLasers(); // Place lasers (more after round 28)
  }
}

