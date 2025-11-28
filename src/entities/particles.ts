/**
 * Particle System
 * Handles explosion particles and visual effects
 */

export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  active: boolean = true;
  
  constructor(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.maxLife = 20; // Frames
    this.life = this.maxLife;
    this.size = 2;
    
    // Random velocity in all directions
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }
  
  update(): void {
    if (!this.active) return;
    
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.95; // Friction
    this.vy *= 0.95;
    this.life--;
    
    if (this.life <= 0) {
      this.active = false;
    }
  }
  
  getAlpha(): number {
    return this.life / this.maxLife;
  }
}

export class ParticleSystem {
  private particles: Particle[] = [];
  
  constructor(_gameWidth: number, _gameHeight: number) {
    // Dimensions stored for potential future use
  }
  
  createExplosion(x: number, y: number, color: string, count: number = 8): void {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, color));
    }
  }
  
  createConfettiExplosion(x: number, y: number, count: number = 24): void {
    // Neon confetti colors
    const neonColors = [
      '#FF00FF', // Neon Magenta
      '#00FFFF', // Neon Cyan
      '#FFFF00', // Neon Yellow
      '#FF00FF', // Neon Pink
      '#00FF00', // Neon Green
      '#FF1493', // Deep Pink
      '#00CED1', // Dark Turquoise
      '#FFD700', // Gold
      '#FF69B4', // Hot Pink
      '#00FA9A', // Medium Spring Green
      '#FF4500', // Orange Red
      '#9370DB', // Medium Purple
    ];
    
    for (let i = 0; i < count; i++) {
      // Randomly select a neon color for each particle
      const color = neonColors[Math.floor(Math.random() * neonColors.length)];
      this.particles.push(new Particle(x, y, color));
    }
  }
  
  update(): void {
    for (const particle of this.particles) {
      particle.update();
    }
    
    // Remove inactive particles
    this.particles = this.particles.filter(p => p.active);
  }
  
  getParticles(): Particle[] {
    return this.particles.filter(p => p.active);
  }
  
  clear(): void {
    this.particles = [];
  }
}

