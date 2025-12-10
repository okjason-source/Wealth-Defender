/**
 * Game Manager
 * Main game loop and state management
 */

import { PixelRenderer } from '../graphics/renderer';
import { Palette } from '../graphics/palette';
import { InputSystem } from '../systems/input';
import { Player } from '../entities/player';
import { ProjectileManager, ProjectileType } from '../entities/projectiles';
import { Enemy, EnemyManager, EnemyType } from '../entities/enemies';
import { CollisionSystem } from '../systems/collision';
import { SpawningSystem } from '../systems/spawning';
import { ParticleSystem } from '../entities/particles';
import { BotAI } from '../systems/bot';
import { BonusMaze } from '../systems/bonusMaze';
import { AudioManager, SoundType } from '../audio/audioManager';

export class GameManager {
  private renderer: PixelRenderer;
  private canvas: HTMLCanvasElement;
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  private timeoutId: number | null = null;
  private isTabVisible: boolean = true;
  private gameWidth: number = 200; // Game pixels (will be scaled)
  private gameHeight: number = 150;
  private pixelSize: number = 4;
  
  // Game systems
  private input: InputSystem;
  private player: Player;
  private projectileManager: ProjectileManager;
  private enemyManager: EnemyManager;
  private collisionSystem: CollisionSystem;
  private spawningSystem: SpawningSystem;
  private particleSystem: ParticleSystem;
  private botAI: BotAI;
  private bonusMaze: BonusMaze | null = null;
  private audioManager: AudioManager;
  
  // Frame counter for bot
  private frameCount: number = 0;
  // Time counter for crushed diamond text animation
  private diamondTextTime: number = 0;
  // Track previous laser state for sound
  private previousLaserActive: boolean = false;
  // Track previous player projectile count for sound
  private previousPlayerProjectileCount: number = 0;
  
  // Game state
  private score: number = 0;
  private lives: number = 3;
  private round: number = 1;
  private roundTransitionTimer: number = 0;
  private roundTransitionDuration: number = 120; // Frames to show round transition
  private isInRoundTransition: boolean = false;
  private invincibilityTimer: number = 0;
  private invincibilityDuration: number = 60; // Frames of invincibility after respawn
  private respawnTimer: number = 0;
  private respawnDelay: number = 30; // Frames to show explosion before respawning
  private isRespawning: boolean = false;
  private isGameOver: boolean = false;
  private gameOverTimer: number = 0; // Timer before allowing restart (3 seconds = 180 frames at 60fps)
  private gameOverDelay: number = 180; // 3 seconds at 60fps
  private isVictory: boolean = false;
  private victoryTimer: number = 0; // Timer for victory animation
  private highScore: number = 0;
  private isBonusRound: boolean = false;
  private bonusRoundComplete: boolean = false;
  private isPaused: boolean = false;
  private currentSaying: string = '';
  // FLOCKED! achievement flash timer
  private flockedTimer: number = 0; // Frames remaining to show FLOCKED! message
  
  // Motivational sayings for round transitions
  private readonly sayings: string[] = [
    "Don't Get Flocked",
    "Elevate your Mindset",
    "Accelerate your Mindset",
    "Sponsored by the Vibes",
    "Brain is Currency",
    "Build it. Ship it",
    "This is speed wealth, baby",
    "Billionaire Mindset, baby",
    "Luck is a skill, baby",
    "Build your Empire",
    "Extravagate your Edge",
    "Deals flipping. Coins dripping."
  ];
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupCanvas();
    this.renderer = new PixelRenderer(canvas, this.pixelSize);
    
    // Initialize systems
    this.input = new InputSystem();
    this.audioManager = new AudioManager();
    this.projectileManager = new ProjectileManager(this.gameWidth, this.gameHeight);
    this.enemyManager = new EnemyManager(this.gameWidth, this.gameHeight, this.projectileManager);
    this.collisionSystem = new CollisionSystem();
    this.particleSystem = new ParticleSystem(this.gameWidth, this.gameHeight);
    this.botAI = new BotAI();
    this.spawningSystem = new SpawningSystem(
      this.enemyManager,
      this.gameWidth,
      this.gameHeight
    );
    
    // Initialize player (center bottom of screen - at the very bottom)
    this.player = new Player(
      this.gameWidth / 2 - 4,
      this.gameHeight - 5, // Player sprite is 5 pixels tall, so start at bottom
      this.input,
      this.projectileManager,
      this.gameWidth,
      this.gameHeight
    );
    // Connect enemy manager to player for lightning laser
    this.player.setEnemyManager(this.enemyManager);
    
    // Load high score from localStorage
    const savedHighScore = localStorage.getItem('round50_highscore');
    if (savedHighScore) {
      this.highScore = parseInt(savedHighScore, 10);
    }
    
    // Start first round
    this.startRound(this.round, false);
  }
  
  private setupCanvas(): void {
    // Set canvas size based on game dimensions and pixel size
    this.canvas.width = this.gameWidth * this.pixelSize;
    this.canvas.height = this.gameHeight * this.pixelSize;
    this.canvas.style.width = `${this.canvas.width}px`;
    this.canvas.style.height = `${this.canvas.height}px`;
  }
  
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    
    // Set up Page Visibility API to detect tab visibility
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.handleVisibilityChange(); // Check initial state
    
    this.gameLoop();
  }
  
  /**
   * Handle tab visibility changes - continue game in background
   */
  private handleVisibilityChange = (): void => {
    this.isTabVisible = !document.hidden;
    
    // If tab becomes hidden, switch to setTimeout-based loop
    // If tab becomes visible, switch back to requestAnimationFrame
    if (!this.isTabVisible && this.isRunning) {
      // Tab hidden - cancel animation frame and use setTimeout
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      // Start setTimeout-based loop
      this.gameLoopTimeout();
    } else if (this.isTabVisible && this.isRunning) {
      // Tab visible - cancel timeout and use requestAnimationFrame
      if (this.timeoutId !== null) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
    }
  };
  
  private startRound(round: number, isBonus: boolean = false): void {
    this.round = round;
    this.isInRoundTransition = true;
    this.roundTransitionTimer = 0;
    // Randomize saying for this round (skip for bonus rounds)
    if (!isBonus) {
      this.currentSaying = this.sayings[Math.floor(Math.random() * this.sayings.length)];
    }
    // Stop all active enemy buzz sounds when starting new round
    this.audioManager.stopAllEnemyBuzzes();
    this.projectileManager.clear();
    this.enemyManager.clear();
    this.particleSystem.clear();
    this.isRespawning = false;
    this.respawnTimer = 0;
    this.bonusRoundComplete = false;
    
    // Set bonus round flag if explicitly requested
    this.isBonusRound = isBonus;
    
    // Play round start sound
    if (isBonus) {
      this.audioManager.playSound(SoundType.BONUS_ROUND);
    } else {
      this.audioManager.playSound(SoundType.ROUND_START);
    }
    
    // Always reset player position to bottom center at the start of every round
    if (!this.player) {
      this.player = new Player(
        this.gameWidth / 2 - 4, // Center horizontally (assuming player width ~8)
        this.gameHeight - 5, // Bottom of screen
        this.input,
        this.projectileManager,
        this.gameWidth,
        this.gameHeight
      );
    } else {
      // Reset player position to bottom center
      const bounds = this.player.getBounds();
      this.player.x = this.gameWidth / 2 - bounds.width / 2; // Exact center
      this.player.y = this.gameHeight - 5; // Bottom of screen
    }
    
    if (this.isBonusRound) {
      // Initialize bonus maze (pass round number for item scaling)
      this.bonusMaze = new BonusMaze(this.gameWidth, this.gameHeight, this.round);
      // Give player brief invincibility at start of bonus round
      this.invincibilityTimer = 30; // Half second of invincibility
    } else {
      // Normal round
      this.bonusMaze = null;
      this.spawningSystem.startRound(round);
    }
  }
  
  stop(): void {
    this.isRunning = false;
    
    // Clean up event listeners and timers
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
  
  private gameLoop = (currentTime: number = performance.now()): void => {
    if (!this.isRunning) return;
    
    // If tab is hidden, don't use requestAnimationFrame (it pauses)
    if (!this.isTabVisible) {
      return; // setTimeout-based loop will handle it
    }
    
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // Update game (60 FPS target)
    const targetFPS = 60;
    const frameTime = 1000 / targetFPS;
    
    if (deltaTime >= frameTime) {
      this.update(deltaTime);
      this.render();
    }
    
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };
  
  /**
   * Timeout-based game loop for when tab is hidden (continues in background)
   */
  private gameLoopTimeout = (): void => {
    if (!this.isRunning || this.isTabVisible) {
      // Tab is visible again, switch back to requestAnimationFrame
      if (this.isTabVisible) {
        this.gameLoop();
      }
      return;
    }
    
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // Update game (60 FPS target)
    const targetFPS = 60;
    const frameTime = 1000 / targetFPS;
    
    if (deltaTime >= frameTime) {
      this.update(deltaTime);
      // Don't render when tab is hidden (saves resources)
      // this.render();
    }
    
    // Continue loop with setTimeout (runs even when tab is hidden)
    this.timeoutId = window.setTimeout(this.gameLoopTimeout, frameTime);
  };
  
  private update(deltaTime: number): void {
    // Always update input first (needed for game over restart and bot toggle)
    this.input.update();
    this.frameCount++;
    
    // Toggle sound with 'L' key
    if (this.input.wasKeyJustPressed('l')) {
      const isEnabled = this.audioManager.toggle();
      console.log('Sound', isEnabled ? 'ON' : 'OFF');
    }
    
    // Toggle bot with 'B' key (only on key press, not hold)
    if (this.input.wasKeyJustPressed('b')) {
      this.botAI.toggle();
      console.log('Bot toggled:', this.botAI.isBotActive() ? 'ON' : 'OFF');
    }
    
    // Toggle bot master level with 'M' key
    if (this.input.wasKeyJustPressed('m')) {
      this.botAI.toggleMasterLevel();
    }
    
    // Toggle pause with 'P' or 'Escape' key (only if not game over or in transition)
    if (!this.isGameOver && !this.isInRoundTransition) {
      if (this.input.wasKeyJustPressed('p') || this.input.wasKeyJustPressed('escape')) {
        this.isPaused = !this.isPaused;
        console.log('Game', this.isPaused ? 'PAUSED' : 'RESUMED');
      }
    }
    
    // If paused, don't update game logic (but still render)
    if (this.isPaused) {
      return;
    }
    
    // Handle victory state
    if (this.isVictory) {
      // Increment victory timer for animation
      this.victoryTimer++;
      
      // Allow restart after a delay (similar to game over)
      if (this.victoryTimer > 300) { // 5 seconds at 60fps
        // Bot automatically restarts after delay
        if (this.botAI.isBotActive()) {
          this.restartGame();
          return;
        }
        
        // Players can restart after delay
        if (this.input.isKeyPressed(' ') || 
            this.input.isKeyPressed('enter') ||
            this.input.isKeyPressed('r')) {
          this.restartGame();
          return;
        }
      }
      return; // Don't update game logic during victory
    }
    
    // Handle game over state
    if (this.isGameOver) {
      // Count down game over timer
      if (this.gameOverTimer > 0) {
        this.gameOverTimer--;
      }
      
      // Only allow restart after timer expires (3 seconds)
      if (this.gameOverTimer <= 0) {
        // Bot automatically restarts after 3 seconds
        if (this.botAI.isBotActive()) {
          this.restartGame();
          return;
        }
        
        // Players can restart after 3 seconds
        // Check for restart input (space, enter, or r)
        // Note: input system stores keys as lowercase, so 'Enter' becomes 'enter'
        if (this.input.isKeyPressed(' ') || 
            this.input.isKeyPressed('enter') ||
            this.input.isKeyPressed('r')) {
          this.restartGame();
          return;
        }
      }
      return; // Don't update game logic during game over
    }
    
    // Handle round transition
    if (this.isInRoundTransition) {
      this.roundTransitionTimer += deltaTime / 16.67;
      this.diamondTextTime += deltaTime / 16.67; // Animate diamond text sparkles
      if (this.roundTransitionTimer >= this.roundTransitionDuration) {
        this.isInRoundTransition = false;
      }
      // Still update spawning system during transition so enemies are ready (only if not bonus round)
      if (!this.isBonusRound) {
        this.spawningSystem.update(deltaTime);
        // Update enemies that are spawning (no player position needed during transition)
        this.enemyManager.update(deltaTime);
      }
      return; // Don't update player/gameplay during transition
    }
    
    // Handle bonus round
    if (this.isBonusRound && this.bonusMaze && !this.bonusRoundComplete) {
      this.updateBonusRound(deltaTime);
      return;
    }
    
    // Handle respawn sequence
    if (this.isRespawning) {
      const frameDelta = deltaTime / 16.67;
      this.respawnTimer -= frameDelta;
      
      if (this.respawnTimer <= 0) {
        // Respawn player with invincibility (at the very bottom center)
        if (!this.player) {
          this.player = new Player(
            this.gameWidth / 2 - 4,
            this.gameHeight - 5, // Player sprite is 5 pixels tall, so start at bottom
            this.input,
            this.projectileManager,
            this.gameWidth,
            this.gameHeight
          );
          this.player.setEnemyManager(this.enemyManager);
          // Restore saved laser count (preserve from before death, don't reset to 5)
          const savedLaserCount = (this as any).savedLaserCount !== undefined ? (this as any).savedLaserCount : 5;
          this.player.laserCount = savedLaserCount;
          (this as any).savedLaserCount = undefined; // Clear saved value
        } else {
          // Reset player position to bottom center
          const bounds = this.player.getBounds();
          this.player.x = this.gameWidth / 2 - bounds.width / 2; // Exact center
          this.player.y = this.gameHeight - 5; // Bottom of screen
        }
        this.invincibilityTimer = this.invincibilityDuration;
        this.isRespawning = false;
      }
      // Don't update player during respawn
    } else {
      // Update invincibility timer
      if (this.invincibilityTimer > 0) {
        this.invincibilityTimer -= deltaTime / 16.67;
      }
      
      // Update player (with bot control if active)
      if (this.botAI.isBotActive() && this.player) {
        const enemies = this.enemyManager.getEnemies();
        const enemyProjectiles = this.projectileManager.getProjectiles().filter(p => p.type === ProjectileType.ENEMY);
        const botDecision = this.botAI.update(
          this.player,
          enemies,
          enemyProjectiles,
          this.gameWidth,
          this.gameHeight,
          this.frameCount,
          this.round,
          this.lives
        );
        this.player.update(deltaTime, botDecision.moveX, botDecision.moveY, botDecision.shouldShoot, botDecision.shouldUseLaser);
      } else {
        this.player.update(deltaTime);
      }
    }
    
    // Update projectiles
    this.projectileManager.update(deltaTime);
    
    // Play sound when player fires projectiles
    const currentPlayerProjectileCount = this.projectileManager.getPlayerProjectiles().length;
    if (currentPlayerProjectileCount > this.previousPlayerProjectileCount) {
      // New projectiles fired - play sound (only play once per frame to avoid spam)
      const newProjectiles = currentPlayerProjectileCount - this.previousPlayerProjectileCount;
      if (newProjectiles > 0) {
        this.audioManager.playSound(SoundType.PLAYER_SHOOT, 0.3);
      }
    }
    this.previousPlayerProjectileCount = currentPlayerProjectileCount;
    
    // Update spawning system
    this.spawningSystem.update(deltaTime);
    
    // Update enemies with player position for strategic AI (only if player exists)
    if (this.player && !this.isRespawning) {
      const playerBounds = this.player.getBounds();
      const playerX = playerBounds.x + playerBounds.width / 2;
      const playerY = playerBounds.y + playerBounds.height / 2;
      this.enemyManager.update(deltaTime, playerX, playerY);
    } else {
      this.enemyManager.update(deltaTime);
    }
    
    // Update particles
    this.particleSystem.update();

    // Update FLOCKED! flash timer
    if (this.flockedTimer > 0) {
      this.flockedTimer--;
    }

    // Handle lightning laser destroyed enemies BEFORE checking round completion
    if (this.player) {
      // Check if laser just fired (transition from inactive to active)
      const activeLaserData = this.player.getLightningLaserData();
      const currentLaserActive = activeLaserData !== null;
      if (currentLaserActive && !this.previousLaserActive) {
        // Laser just fired - play sound
        this.audioManager.playSound(SoundType.LASER_FIRE);
      }
      this.previousLaserActive = currentLaserActive;
      
      const laserDestroyedEnemies = this.player.getLightningLaserDestroyedEnemies();
      if (laserDestroyedEnemies.length > 0) {
        for (const enemy of laserDestroyedEnemies) {
          // Stop any existing buzz sound (enemy is being destroyed)
          this.audioManager.stopEnemyBuzz(enemy.id);
          
          this.score += this.getEnemyPoints(enemy.type);
          this.spawningSystem.onEnemyDestroyed();
          
          // Create explosion particles at enemy center
          const center = enemy.getCenter();
          const explosionColor = this.getExplosionColor(enemy.type);
          this.particleSystem.createExplosion(center.x, center.y, explosionColor, 8);
        }

        // If we destroyed 20 or more enemies with a single lightning laser, flash "FLOCKED!"
        if (laserDestroyedEnemies.length >= 20) {
          // Show FLOCKED! message for 90 frames (~1.5 seconds at 60 FPS)
          this.flockedTimer = 90;
          // Play triumphant FLOCKED! sound
          this.audioManager.playSound(SoundType.FLOCKED);
        }
      }
    }
    
    // Check round completion (only for normal rounds, not bonus rounds)
    // Also ensure we don't end the round while a lightning laser effect is still visible
    const activeLaserData = this.player ? this.player.getLightningLaserData() : null;
    if (
      !this.isBonusRound &&
      this.spawningSystem.isRoundComplete() &&
      !activeLaserData
    ) {
      this.completeRound();
      return;
    }
    
    // Check collisions (only if not invincible, not respawning, and player exists)
    if (this.player && !this.isRespawning && this.invincibilityTimer <= 0) {
      const collisionResult = this.collisionSystem.checkAllCollisions(
        this.player,
        this.enemyManager.getEnemies(),
        this.projectileManager.getProjectiles()
      );
      
      // Handle collisions
      if (collisionResult.playerHit) {
        this.handlePlayerHit();
        // Return early to avoid processing collisions again this frame
        return;
      }
      
      // Remove hit projectiles
      for (const projectile of collisionResult.projectilesToRemove) {
        this.projectileManager.removeProjectile(projectile);
      }
      
      // Start or update continuous buzz sounds for enemies that were hit but not destroyed
      for (const { enemy, hitsTaken, currentHealth } of collisionResult.enemiesDamaged) {
        this.audioManager.startOrUpdateEnemyBuzz(enemy.id, enemy.type, hitsTaken, currentHealth, enemy.maxHealth);
      }
      
      // Award points for destroyed enemies and create explosions
      for (const enemy of collisionResult.enemiesHit) {
        // Stop the buzz sound when enemy is destroyed
        this.audioManager.stopEnemyBuzz(enemy.id);
        
        this.score += this.getEnemyPoints(enemy.type);
        this.spawningSystem.onEnemyDestroyed();
        
        // Create explosion particles at enemy center
        const center = enemy.getCenter();
        const explosionColor = this.getExplosionColor(enemy.type);
        this.particleSystem.createExplosion(center.x, center.y, explosionColor, 8);
        
        // Play enemy destroyed sound (only play once per frame to avoid spam)
        if (collisionResult.enemiesHit.indexOf(enemy) === 0) {
          this.audioManager.playSound(SoundType.ENEMY_DESTROYED, 0.5);
        }
      }
    }
  }
  
  private completeRound(): void {
    // Stop all active enemy buzz sounds when round completes
    this.audioManager.stopAllEnemyBuzzes();
    
    // Award bonus points for round completion (only for non-bonus rounds)
    if (!this.isBonusRound) {
      const roundBonus = this.round * 100;
      this.score += roundBonus;
    }
    
    // Check if game is complete (all 50 rounds)
    if (this.round >= 50) {
      // Victory!
      this.isVictory = true;
      this.victoryTimer = 0;
      // Update high score before showing victory
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('round50_highscore', this.highScore.toString());
      }
      // Notify bot of victory
      const finalLaserCount = this.player ? this.player.getLaserCount() : 0;
      this.botAI.onGameEnd(this.score, this.round, this.lives, finalLaserCount);
      // Play victory sound
      this.audioManager.playSound(SoundType.VICTORY);
      return;
    }
    
    // Play round complete sound (if not victory)
    if (!this.isBonusRound) {
      this.audioManager.playSound(SoundType.ROUND_COMPLETE);
    }
    
    // Check if we just completed a round that should trigger a bonus round
    // Bonus rounds happen AFTER rounds 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48
    // So after round 4 completes, show bonus round, then advance to round 5
    if (this.round % 4 === 0 && !this.isBonusRound) {
      // Start bonus round (marked as bonus, but keep same round number for display)
      this.startRound(this.round, true); // Explicitly mark as bonus round
      return;
    }
    
    // If we just completed a bonus round, advance to the next normal round
    if (this.isBonusRound) {
      this.startRound(this.round + 1, false); // Next round, not a bonus
      return;
    }
    
    // Advance to next round (normal progression)
    this.startRound(this.round + 1, false);
  }
  
  /**
   * Update bonus round (maze stage)
   */
  private updateBonusRound(_deltaTime: number): void {
    if (!this.bonusMaze || !this.player) return;
    
    // If bonus round is already complete, don't process anything
    if (this.bonusRoundComplete) return;
    
    const playerBounds = this.player.getBounds();
    
    // Get steering input (left/right only)
    let steerLeft = this.input.isMovingLeft();
    let steerRight = this.input.isMovingRight();
    
    // If bot is active, use bot AI for bonus round navigation
    if (this.botAI.isBotActive()) {
      const botSteering = this.botAI.updateBonusRound(
        this.player,
        this.bonusMaze,
        this.gameWidth,
        this.gameHeight
      );
      steerLeft = botSteering.steerLeft;
      steerRight = botSteering.steerRight;
    }
    
    // Update player position (automatic forward movement, left/right steering)
    const newPos = this.bonusMaze.updatePlayer(
      playerBounds.x,
      playerBounds.y,
      playerBounds.width,
      playerBounds.height,
      steerLeft,
      steerRight
    );
    
    // Update player position
    this.player.x = newPos.x;
    this.player.y = newPos.y;
    
    // Get updated bounds after movement
    const updatedBounds = this.player.getBounds();
    
    // Update invincibility timer (for bonus round start protection)
    if (this.invincibilityTimer > 0) {
      this.invincibilityTimer -= 1;
    }
    
    // Check for wall collision (using NEW position, but only if not invincible)
    if (this.invincibilityTimer <= 0 && this.bonusMaze.checkWallCollision(
      updatedBounds.x,
      updatedBounds.y,
      updatedBounds.width,
      updatedBounds.height
    )) {
      // Hit a wall - bonus round ends immediately, move to next round with whatever was collected
      this.bonusRoundComplete = true;
      // Award bonus points (even if wall was hit)
      const bonusPoints = 500;
      this.score += bonusPoints;
      // Immediately transition to next round (no delay to prevent glitch)
      this.completeRound();
      return;
    }
    
    // Only check for item collection if bonus round is still active
    if (!this.bonusRoundComplete) {
      // Check for life collection (using NEW position)
      const livesCollected = this.bonusMaze.checkLifeCollection(
        updatedBounds.x,
        updatedBounds.y,
        updatedBounds.width,
        updatedBounds.height
      );
      if (livesCollected > 0) {
        // Collected free lives!
        this.lives += livesCollected;
        // Play collection sound
        this.audioManager.playSound(SoundType.COLLECT_ITEM);
        // Create celebration particles
        const center = {
          x: updatedBounds.x + updatedBounds.width / 2,
          y: updatedBounds.y + updatedBounds.height / 2
        };
        this.particleSystem.createConfettiExplosion(center.x, center.y, 16);
      }
      
      // Check for laser collection (using NEW position)
      const lasersCollected = this.bonusMaze.checkLaserCollection(
        updatedBounds.x,
        updatedBounds.y,
        updatedBounds.width,
        updatedBounds.height
      );
      if (lasersCollected > 0) {
        // Collected lasers!
        if (this.player) {
          this.player.addLasers(lasersCollected);
          // Play collection sound
          this.audioManager.playSound(SoundType.COLLECT_ITEM);
          // Create celebration particles
          const center = {
            x: updatedBounds.x + updatedBounds.width / 2,
            y: updatedBounds.y + updatedBounds.height / 2
          };
          this.particleSystem.createConfettiExplosion(center.x, center.y, 12);
        }
      }
    }
    
    // Check for exit (reached top) (using NEW position) - only if round not already complete
    if (!this.bonusRoundComplete && this.bonusMaze.checkExit(updatedBounds.y)) {
      // Bonus round complete!
      this.bonusRoundComplete = true;
      // Award bonus points
      const bonusPoints = 500;
      this.score += bonusPoints;
      // Immediately transition to next round
      this.completeRound();
    }
  }
  
  private getEnemyPoints(type: EnemyType): number {
    switch (type) {
      case EnemyType.COIN:
        return 10;
      case EnemyType.DOLLAR_BILL:
        return 25;
      case EnemyType.DIAMOND:
        return 50;
      case EnemyType.HATER:
        return 100;
      case EnemyType.BRAIN:
        return 75; // Between diamond and hater
    }
  }
  
  private getExplosionColor(type: EnemyType): string {
    switch (type) {
      case EnemyType.COIN:
        return Palette.GOLD;
      case EnemyType.DOLLAR_BILL:
        return Palette.EMERALD_GREEN;
      case EnemyType.DIAMOND:
        return Palette.SAPPHIRE_BLUE;
      case EnemyType.HATER:
        return Palette.CRIMSON_RED;
      case EnemyType.BRAIN:
        return Palette.DEEP_PURPLE; // Purple/pink for brain
      default:
        return Palette.AMBER;
    }
  }
  
  private getDamageTint(enemy: Enemy): string | undefined {
    // Special handling for brains: neon colors that change with each hit
    if (enemy.type === EnemyType.BRAIN) {
      const health = enemy.health;
      // Brains have 4 health, so we have 4 color states
      switch (health) {
        case 4:
          return Palette.NEON_PURPLE;  // Full health - purple
        case 3:
          return Palette.NEON_BLUE;    // 3 hits - blue
        case 2:
          return Palette.NEON_CYAN;    // 2 hits - cyan
        case 1:
          return Palette.NEON_YELLOW;  // 1 hit - yellow (critical)
        default:
          return Palette.NEON_PURPLE;
      }
    }
    
    // For other enemies, show red tint when damaged
    if (enemy.isDamaged()) {
      return Palette.CRIMSON_RED;
    }
    
    return undefined;
  }
  
  private handlePlayerHit(): void {
    // Don't process hit if already respawning
    if (this.isRespawning) return;
    
    // Play player hit sound
    this.audioManager.playSound(SoundType.PLAYER_HIT);
    
    // Create explosion at player position (before removing player)
    const playerBounds = this.player.getBounds();
    const playerCenter = {
      x: playerBounds.x + playerBounds.width / 2,
      y: playerBounds.y + playerBounds.height / 2
    };
    
    // Create multi-colored neon confetti explosion for player death
    this.particleSystem.createConfettiExplosion(playerCenter.x, playerCenter.y, 24);
    
    // Save laser count before respawning (preserve it, don't reset to 5)
    const savedLaserCount = this.player ? this.player.getLaserCount() : 5;
    
    // Decrease lives
    this.lives--;
    
    if (this.lives <= 0) {
      // Game over
      this.handleGameOver();
      return;
    }
    
    // Start respawn sequence
    this.isRespawning = true;
    this.respawnTimer = this.respawnDelay;
    // Store saved laser count for respawn
    (this as any).savedLaserCount = savedLaserCount;
    // Remove player temporarily (will be recreated after delay)
    this.player = null as any;
  }
  
  private render(): void {
    // Clear screen
    this.renderer.clear();
    
    // Draw background stars
    this.drawStars();
    
    // Draw victory screen
    if (this.isVictory) {
      this.drawVictory();
      return; // Don't draw game entities during victory
    }
    
    // Draw game over screen
    if (this.isGameOver) {
      this.drawGameOver();
      return; // Don't draw game entities during game over
    }
    
    // Draw HUD (only if not game over)
    this.drawHUD();

    // Draw FLOCKED! achievement flash (on top of HUD but below transitions/overlays)
    if (this.flockedTimer > 0) {
      this.renderer.drawText(
        'FLOCKED!',
        this.gameWidth / 2,
        40,
        Palette.NEON_PURPLE,
        1.2,
        'center'
      );
    }
    
    // Draw round transition message
    if (this.isInRoundTransition) {
      this.drawRoundTransition();
      return; // Don't draw game entities during transition
    }
    
    // Draw bonus round (maze)
    if (this.isBonusRound && this.bonusMaze) {
      this.drawBonusRound();
      return;
    }
    
    // Draw player (with invincibility flash effect, but not during respawn)
    if (this.player && !this.isRespawning) {
      if (this.invincibilityTimer <= 0 || Math.floor(this.invincibilityTimer / 3) % 2 === 0) {
        const playerSprite = this.player.getSprite();
        this.renderer.drawSprite(
          playerSprite,
          Math.floor(this.player.getBounds().x),
          Math.floor(this.player.getBounds().y)
        );
      }
    }
    
    // Draw enemies
    for (const enemy of this.enemyManager.getEnemies()) {
      const enemySprite = enemy.getSprite();
      const bounds = enemy.getBounds();
      
      // Apply damage tint - special handling for brains (neon colors based on health)
      const tint = this.getDamageTint(enemy);
      
      this.renderer.drawSprite(
        enemySprite,
        Math.floor(bounds.x),
        Math.floor(bounds.y),
        tint
      );
    }
    
    // Draw lightning laser
    if (this.player) {
      const laserData = this.player.getLightningLaserData();
      if (laserData) {
        for (const target of laserData.targets) {
          this.renderer.drawLightningLaser(
            laserData.playerX,
            laserData.playerY,
            target.x,
            target.y,
            laserData.color
          );
        }
      }
    }
    
    // Draw particles
    for (const particle of this.particleSystem.getParticles()) {
      this.renderer.drawParticle(
        particle.x,
        particle.y,
        particle.color,
        particle.size,
        particle.getAlpha()
      );
    }
    
    // Draw projectiles
    for (const projectile of this.projectileManager.getProjectiles()) {
      const projSprite = projectile.getSprite();
      this.renderer.drawSprite(
        projSprite,
        Math.floor(projectile.getBounds().x),
        Math.floor(projectile.getBounds().y)
      );
    }
    
    // Draw pause overlay (on top of everything, after all game entities)
    if (this.isPaused) {
      this.drawPauseScreen();
    }
  }
  
  private drawRoundTransition(): void {
    const progress = this.roundTransitionTimer / this.roundTransitionDuration;
    
    // Draw round number (center aligned)
    const roundText = this.isBonusRound ? 'BONUS ROUND!' : `ROUND ${this.round}`;
    this.renderer.drawText(
      roundText,
      this.gameWidth / 2,
      this.gameHeight / 2 - 20,
      this.isBonusRound ? Palette.EMERALD_GREEN : Palette.GOLD,
      1.5,
      'center'
    );
    
    // Draw randomized saying with crushed diamond effect (center aligned, above GET READY)
    if (!this.isBonusRound && this.currentSaying && progress < 0.7) {
      this.renderer.drawCrushedDiamondText(
        this.currentSaying,
        this.gameWidth / 2,
        this.gameHeight / 2 - 5,
        1.0,
        'center',
        this.diamondTextTime
      );
    }
    
    // Draw "GET READY" message (center aligned)
    if (progress < 0.7) {
      const message = this.isBonusRound ? 'STEER LEFT/RIGHT!' : 'GET READY!';
      this.renderer.drawText(
        message,
        this.gameWidth / 2,
        this.gameHeight / 2 + 10,
        Palette.PLATINUM,
        0.8,
        'center'
      );
    }
  }
  
  /**
   * Draw bonus round (maze)
   */
  private drawBonusRound(): void {
    if (!this.bonusMaze) return;
    
    // Draw maze walls (red/gray stripes like the image)
    const walls = this.bonusMaze.getWalls();
    for (const wall of walls) {
      // Alternate between red and gray for visual effect
      const color = (Math.floor(wall.y / 5) % 2 === 0) ? Palette.CRIMSON_RED : Palette.PLATINUM;
      this.renderer.drawRect(
        Math.floor(wall.x),
        Math.floor(wall.y),
        Math.floor(wall.width),
        Math.floor(wall.height),
        color
      );
    }
    
    // Draw all uncollected lives (10 total)
    const lives = this.bonusMaze.getLives();
    for (const life of lives) {
      // Draw a simple life icon (heart or star shape)
      // For now, draw a gold circle
      this.renderer.drawRect(
        Math.floor(life.x - 4),
        Math.floor(life.y - 4),
        8,
        8,
        Palette.GOLD
      );
      // Draw a small cross or plus sign in the center
      this.renderer.drawRect(
        Math.floor(life.x - 1),
        Math.floor(life.y - 3),
        2,
        6,
        Palette.RICH_BLACK
      );
      this.renderer.drawRect(
        Math.floor(life.x - 3),
        Math.floor(life.y - 1),
        6,
        2,
        Palette.RICH_BLACK
      );
    }
    
    // Draw all uncollected laser pickups (20 total)
    const lasers = this.bonusMaze.getLasers();
    for (const laser of lasers) {
      // Draw a lightning bolt icon (neon colored)
      const laserColor = Palette.NEON_CYAN;
      // Draw vertical line
      this.renderer.drawRect(
        Math.floor(laser.x - 1),
        Math.floor(laser.y - 4),
        2,
        8,
        laserColor
      );
      // Draw horizontal connectors (lightning effect)
      this.renderer.drawRect(
        Math.floor(laser.x - 3),
        Math.floor(laser.y - 2),
        2,
        2,
        laserColor
      );
      this.renderer.drawRect(
        Math.floor(laser.x + 1),
        Math.floor(laser.y),
        2,
        2,
        laserColor
      );
      this.renderer.drawRect(
        Math.floor(laser.x - 3),
        Math.floor(laser.y + 2),
        2,
        2,
        laserColor
      );
    }
    
    // Draw player
    if (this.player && !this.isRespawning) {
      const playerSprite = this.player.getSprite();
      this.renderer.drawSprite(
        playerSprite,
        Math.floor(this.player.getBounds().x),
        Math.floor(this.player.getBounds().y)
      );
    }
    
    // Draw particles
    for (const particle of this.particleSystem.getParticles()) {
      this.renderer.drawParticle(
        particle.x,
        particle.y,
        particle.color,
        particle.size,
        particle.getAlpha()
      );
    }
    
    // Draw bonus round instructions
    this.renderer.drawText(
      'BONUS ROUND',
      this.gameWidth / 2 - 40,
      10,
      Palette.EMERALD_GREEN,
      0.6
    );
    this.renderer.drawText(
      'GET THE LIFE!',
      this.gameWidth / 2 - 35,
      18,
      Palette.GOLD,
      0.5
    );
  }
  
  private handleGameOver(): void {
    this.isGameOver = true;
    this.gameOverTimer = this.gameOverDelay; // Start 3-second countdown
    
    // Stop background music
    this.audioManager.stopBackgroundMusic();
    
    // Play game over sound
    this.audioManager.playSound(SoundType.GAME_OVER);
    
    // Update high score if current score is higher
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('round50_highscore', this.highScore.toString());
    }
    
    // Notify bot of game end for learning
    if (this.botAI.isBotActive()) {
      // Get final laser count if player still exists
      const finalLaserCount = this.player ? this.player.getLaserCount() : 0;
      this.botAI.onGameEnd(this.score, this.round, this.lives, finalLaserCount);
    }
    
    // Don't stop the game loop - we need to keep running to check for restart input
    // The update loop will return early when isGameOver is true, but still check for restart
  }
  
  private restartGame(): void {
    // Reset all game state
    this.score = 0;
    this.lives = 3;
    this.round = 1;
    this.isGameOver = false;
    this.gameOverTimer = 0; // Reset game over timer
    this.isVictory = false;
    this.victoryTimer = 0;
    this.isInRoundTransition = false;
    this.isRespawning = false;
    this.isPaused = false; // Reset pause state
    this.invincibilityTimer = 0;
    this.respawnTimer = 0;
    this.roundTransitionTimer = 0;
    this.frameCount = 0;
    
    // Reset bot movement state when game restarts
    if (this.botAI.isBotActive()) {
      this.botAI.resetMovementState();
    }
    
    // Clear all entities
    this.projectileManager.clear();
    this.enemyManager.clear();
    this.particleSystem.clear();
    
    // Reset player (at the very bottom)
    this.player = new Player(
      this.gameWidth / 2 - 4,
      this.gameHeight - 5, // Player sprite is 5 pixels tall, so start at bottom
      this.input,
      this.projectileManager,
      this.gameWidth,
      this.gameHeight
    );
    
    // Start first round
    this.startRound(this.round, false);
    
    // Restart background music
    this.audioManager.startBackgroundMusic();
    
    // Restart game loop
    this.start();
  }
  
  private drawVictory(): void {
    // Convert victory timer to time for animation (in frames, roughly 60fps)
    const time = this.victoryTimer;
    
    // Draw "YOU WIN!!" in big golden blocks (animated)
    this.renderer.drawGoldenBlockText(
      'YOU WIN!!',
      this.gameWidth / 2,
      this.gameHeight / 2 - 35,
      2.0, // Big size
      'center',
      time
    );
    
    // Draw "Billionaire Mindset" in golden blocks (slightly smaller, animated)
    this.renderer.drawGoldenBlockText(
      'Billionaire Mindset',
      this.gameWidth / 2,
      this.gameHeight / 2 - 5,
      1.2, // Medium size
      'center',
      time
    );
    
    // Draw final score (center aligned)
    this.renderer.drawText(
      `FINAL SCORE: ${this.score}`,
      this.gameWidth / 2,
      this.gameHeight / 2 + 20,
      Palette.GOLD,
      0.8,
      'center'
    );
    
    // Draw high score (center aligned)
    if (this.highScore > 0) {
      const highScoreText = this.score === this.highScore ? 'NEW HIGH SCORE!' : `HIGH SCORE: ${this.highScore}`;
      const highScoreColor = this.score === this.highScore ? Palette.GOLD : Palette.PLATINUM;
      this.renderer.drawText(
        highScoreText,
        this.gameWidth / 2,
        this.gameHeight / 2 + 35,
        highScoreColor,
        0.7,
        'center'
      );
    }
    
    // Draw restart instruction (center aligned) - only show after 3 seconds
    if (this.victoryTimer > 300) {
      this.renderer.drawText(
        'PRESS SPACE/ENTER/R TO RESTART',
        this.gameWidth / 2,
        this.gameHeight / 2 + 55,
        Palette.PLATINUM,
        0.6,
        'center'
      );
    }
  }
  
  private drawGameOver(): void {
    // Draw "GAME OVER" title (center aligned)
    this.renderer.drawText(
      'GAME OVER',
      this.gameWidth / 2,
      this.gameHeight / 2 - 40,
      Palette.CRIMSON_RED,
      1.5,
      'center'
    );
    
    // Draw final score (center aligned)
    this.renderer.drawText(
      `FINAL SCORE: ${this.score}`,
      this.gameWidth / 2,
      this.gameHeight / 2 - 20,
      Palette.GOLD,
      0.8,
      'center'
    );
    
    // Draw round reached (center aligned)
    this.renderer.drawText(
      `ROUND REACHED: ${this.round}/50`,
      this.gameWidth / 2,
      this.gameHeight / 2 - 10,
      Palette.EMERALD_GREEN,
      0.7,
      'center'
    );
    
    // Draw high score (center aligned)
    if (this.highScore > 0) {
      const highScoreText = this.score === this.highScore ? 'NEW HIGH SCORE!' : `HIGH SCORE: ${this.highScore}`;
      const highScoreColor = this.score === this.highScore ? Palette.GOLD : Palette.PLATINUM;
      this.renderer.drawText(
        highScoreText,
        this.gameWidth / 2,
        this.gameHeight / 2 + 5,
        highScoreColor,
        0.7,
        'center'
      );
    }
    
    // Draw restart instruction (center aligned) - only show after 3 seconds
    if (this.gameOverTimer <= 0) {
      this.renderer.drawText(
        'PRESS SPACE/ENTER/R TO RESTART',
        this.gameWidth / 2,
        this.gameHeight / 2 + 25,
        Palette.PLATINUM,
        0.6,
        'center'
      );
    }
  }
  
  private drawPauseScreen(): void {
    // Draw semi-transparent overlay (darken the screen)
    const ctx = this.renderer.getContext();
    const oldAlpha = ctx.globalAlpha;
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = Palette.RICH_BLACK;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.globalAlpha = oldAlpha;
    
    // Draw "PAUSED" title (center aligned)
    this.renderer.drawText(
      'PAUSED',
      this.gameWidth / 2,
      this.gameHeight / 2 - 15,
      Palette.GOLD,
      1.5,
      'center'
    );
    
    // Draw instruction (center aligned)
    this.renderer.drawText(
      'PRESS P OR ESC TO RESUME',
      this.gameWidth / 2,
      this.gameHeight / 2 + 5,
      Palette.PLATINUM,
      0.7,
      'center'
    );
  }
  
  private drawHUD(): void {
    // Score
    this.renderer.drawText(`SCORE: ${this.score}`, 5, 5, Palette.GOLD, 0.5);
    
    // Lives
    this.renderer.drawText(`LIVES: ${this.lives}`, 5, 12, Palette.PLATINUM, 0.5);
    
    // Lasers
    if (this.player) {
      const laserCount = this.player.getLaserCount();
      this.renderer.drawText(`LASERS: ${laserCount}`, 5, 19, Palette.NEON_CYAN, 0.5);
    }
    
    // Round
    this.renderer.drawText(`ROUND: ${this.round}/50`, 5, 26, Palette.EMERALD_GREEN, 0.5);
    
    // Enemy count
    const enemyCount = this.enemyManager.getEnemyCount();
    this.renderer.drawText(`ENEMIES: ${enemyCount}`, 5, 33, Palette.SAPPHIRE_BLUE, 0.5);
    
    // High score (if exists)
    if (this.highScore > 0) {
      this.renderer.drawText(`HIGH: ${this.highScore}`, 5, 40, Palette.AMBER, 0.4);
    }
    
    // Bot status
    if (this.botAI.isBotActive()) {
      const skillLevel = this.botAI.getSkillLevel();
      const skillPercent = Math.round(skillLevel * 100);
      this.renderer.drawText(`BOT: ON (${skillPercent}%)`, this.gameWidth - 60, 5, Palette.EMERALD_GREEN, 0.5);
    } else {
      this.renderer.drawText(`BOT: OFF (Press B)`, this.gameWidth - 75, 5, Palette.PLATINUM, 0.4);
    }
  }
  
  private drawStars(): void {
    // Simple static starfield
    const starCount = 50;
    for (let i = 0; i < starCount; i++) {
      const x = (i * 37) % this.gameWidth;
      const y = (i * 73) % this.gameHeight;
      this.renderer.drawPixel(x, y, Palette.STAR_COLOR);
    }
  }
  
  getRenderer(): PixelRenderer {
    return this.renderer;
  }
  
  getGameWidth(): number {
    return this.gameWidth;
  }
  
  getGameHeight(): number {
    return this.gameHeight;
  }
  
  getBotAI(): BotAI {
    return this.botAI;
  }
}

