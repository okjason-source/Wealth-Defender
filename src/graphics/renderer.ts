/**
 * Pixel-Perfect Renderer
 * Handles rendering of pixel art sprites to canvas
 */

import { IndexToColor } from './palette';

export class PixelRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private pixelSize: number;
  
  constructor(canvas: HTMLCanvasElement, pixelSize: number = 4) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.pixelSize = pixelSize;
    
    // Disable image smoothing for pixel-perfect rendering
    this.ctx.imageSmoothingEnabled = false;
  }
  
  /**
   * Set the pixel scale (how many screen pixels per game pixel)
   */
  setPixelSize(size: number): void {
    this.pixelSize = size;
  }
  
  /**
   * Clear the entire canvas
   */
  clear(): void {
    this.ctx.fillStyle = '#0A0A0A';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  /**
   * Draw a pixel at the given position
   */
  drawPixel(x: number, y: number, color: string): void {
    if (color === 'transparent') return;
    
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      x * this.pixelSize,
      y * this.pixelSize,
      this.pixelSize,
      this.pixelSize
    );
  }
  
  /**
   * Blend two hex colors
   */
  private blendColors(color1: string, color2: string, ratio: number = 0.5): string {
    // Parse hex colors
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
    
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);
    
    // Blend
    const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
    const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
    const b = Math.round(b1 * (1 - ratio) + b2 * ratio);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  
  /**
   * Draw a sprite from a 2D array of color indices
   * @param sprite 2D array where each number is a ColorIndex
   * @param x X position in game pixels
   * @param y Y position in game pixels
   * @param tint Optional color to tint the sprite (for damage indication)
   */
  drawSprite(sprite: number[][], x: number, y: number, tint?: string): void {
    for (let row = 0; row < sprite.length; row++) {
      for (let col = 0; col < sprite[row].length; col++) {
        const colorIndex = sprite[row][col];
        let color = IndexToColor[colorIndex] || 'transparent';
        
        // Apply tint if provided (for damaged enemies) - blend 50% with tint
        if (tint && color !== 'transparent') {
          color = this.blendColors(color, tint, 0.5);
        }
        
        this.drawPixel(x + col, y + row, color);
      }
    }
  }
  
  /**
   * Draw a lightning laser bolt from player to target
   * Creates a lightning-like effect with vertical lines connected by horizontal segments
   */
  drawLightningLaser(startX: number, startY: number, endX: number, endY: number, color: string): void {
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return;
    
    // Number of segments (more segments = smoother lightning)
    const segments = Math.max(8, Math.floor(distance / 3));
    
    // Create zigzag path (lightning effect)
    const points: Array<{ x: number; y: number }> = [];
    points.push({ x: startX, y: startY });
    
    // Add intermediate points with random jitter for lightning effect
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const baseX = startX + dx * t;
      const baseY = startY + dy * t;
      
      // Perpendicular direction for jitter
      const perpX = -dy / distance;
      const perpY = dx / distance;
      
      // Random jitter amount (stronger near middle)
      const jitterAmount = 2 * (1 - Math.abs(t - 0.5) * 2); // Max jitter at middle
      const jitter = (Math.random() - 0.5) * jitterAmount;
      
      points.push({
        x: baseX + perpX * jitter,
        y: baseY + perpY * jitter,
      });
    }
    
    points.push({ x: endX, y: endY });
    
    // Draw lightning bolt: vertical lines connected by horizontal segments
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      
      // Draw vertical segment (main bolt)
      const segDx = p2.x - p1.x;
      const segDy = p2.y - p1.y;
      const segLength = Math.sqrt(segDx * segDx + segDy * segDy);
      const steps = Math.max(1, Math.floor(segLength));
      
      for (let j = 0; j <= steps; j++) {
        const t = j / steps;
        const x = Math.round(p1.x + segDx * t);
        const y = Math.round(p1.y + segDy * t);
        
        // Draw main vertical line (2 pixels wide for visibility)
        this.drawPixel(x, y, color);
        if (Math.abs(segDx) < Math.abs(segDy)) {
          // More vertical - draw horizontal connectors
          this.drawPixel(x - 1, y, color);
          this.drawPixel(x + 1, y, color);
        } else {
          // More horizontal - draw vertical connectors
          this.drawPixel(x, y - 1, color);
          this.drawPixel(x, y + 1, color);
        }
      }
    }
  }
  
  /**
   * Draw a particle
   */
  drawParticle(x: number, y: number, color: string, size: number, alpha: number): void {
    if (alpha <= 0) return;
    
    // Simple particle rendering - draw a small square
    const ctx = this.getContext();
    const oldAlpha = ctx.globalAlpha;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(
      x * this.pixelSize,
      y * this.pixelSize,
      size * this.pixelSize,
      size * this.pixelSize
    );
    ctx.globalAlpha = oldAlpha;
  }
  
  /**
   * Draw a filled rectangle
   */
  drawRect(x: number, y: number, width: number, height: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      x * this.pixelSize,
      y * this.pixelSize,
      width * this.pixelSize,
      height * this.pixelSize
    );
  }
  
  /**
   * Draw text (pixel-style font)
   */
  drawText(text: string, x: number, y: number, color: string, size: number = 1, align: 'left' | 'center' | 'right' = 'left', bold: boolean = false): void {
    this.ctx.fillStyle = color;
    const fontWeight = bold ? 'bold ' : '';
    this.ctx.font = `${fontWeight}${size * this.pixelSize * 8}px 'Courier New', monospace`;
    this.ctx.textBaseline = 'top';
    this.ctx.textAlign = align;
    
    // If center or right alignment, calculate the actual x position
    let drawX = x * this.pixelSize;
    if (align === 'center') {
      // x should be the center point, so we use it directly
      drawX = x * this.pixelSize;
    } else if (align === 'right') {
      // x should be the right edge
      drawX = x * this.pixelSize;
    }
    
    this.ctx.fillText(
      text,
      drawX,
      y * this.pixelSize
    );
    
    // Reset text alignment to default
    this.ctx.textAlign = 'left';
  }
  
  /**
   * Draw text with crushed diamond effect (sparkly, multi-layered)
   */
  drawCrushedDiamondText(text: string, x: number, y: number, size: number = 1, align: 'left' | 'center' | 'right' = 'left', time: number = 0): void {
    const fontWeight = 'bold ';
    this.ctx.font = `${fontWeight}${size * this.pixelSize * 8}px 'Courier New', monospace`;
    this.ctx.textBaseline = 'top';
    this.ctx.textAlign = align;
    
    // Calculate draw position
    let drawX = x * this.pixelSize;
    if (align === 'center') {
      drawX = x * this.pixelSize;
    } else if (align === 'right') {
      drawX = x * this.pixelSize;
    }
    const drawY = y * this.pixelSize;
    
    // Prismatic colors (rainbow spectrum like light through a prism)
    const prismColors = [
      '#FF0000', // Red
      '#FF7F00', // Orange
      '#FFFF00', // Yellow
      '#00FF00', // Green
      '#0000FF', // Blue
      '#4B0082', // Indigo
      '#9400D3', // Violet
    ];
    
    // Diamond colors for main text (cool blue/white tones)
    const diamondColors = [
      '#E6F3FF', // Cool white (blue-tinted)
      '#B0E0E6', // Powder blue
      '#87CEEB', // Sky blue
      '#D0E8F0', // Cool light gray-blue
      '#B8D4E3', // Cool silver-blue
      '#ADD8E6', // Light blue
      '#C8E6F0', // Ice blue
      '#A8D8E8', // Cool cyan
    ];
    
    // Draw prismatic glow around edges (multiple layers with rainbow colors)
    const glowLayers = 8;
    const textWidth = this.ctx.measureText(text).width;
    
    for (let layer = glowLayers; layer > 0; layer--) {
      const offset = layer * 0.5;
      const alpha = (1 - (layer / glowLayers)) * 0.3;
      
      // Create prismatic effect by cycling through rainbow colors based on position
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI / 2) + (time * 0.05); // Rotate colors
        const colorIndex = Math.floor((angle * prismColors.length / (Math.PI * 2)) + layer) % prismColors.length;
        const glowColor = prismColors[colorIndex];
        
        const oldAlpha = this.ctx.globalAlpha;
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = glowColor;
        
        // Draw glow on all sides
        const offsets = [
          { x: -offset, y: 0 },      // Left
          { x: offset, y: 0 },       // Right
          { x: 0, y: -offset },      // Top
          { x: 0, y: offset },       // Bottom
          { x: -offset * 0.7, y: -offset * 0.7 }, // Top-left
          { x: offset * 0.7, y: -offset * 0.7 },  // Top-right
          { x: -offset * 0.7, y: offset * 0.7 },  // Bottom-left
          { x: offset * 0.7, y: offset * 0.7 },   // Bottom-right
        ];
        
        for (const off of offsets) {
          this.ctx.fillText(
            text,
            drawX + off.x,
            drawY + off.y
          );
        }
        
        this.ctx.globalAlpha = oldAlpha;
      }
    }
    
    // Draw main text layers with diamond colors
    const offsets = [
      { x: -1, y: -1, color: diamondColors[0], alpha: 0.6 }, // Cool white shadow
      { x: 1, y: -1, color: diamondColors[1], alpha: 0.5 },  // Powder blue highlight
      { x: -1, y: 1, color: diamondColors[2], alpha: 0.5 },  // Sky blue shadow
      { x: 1, y: 1, color: diamondColors[3], alpha: 0.4 },   // Cool light gray-blue
      { x: 0, y: 0, color: diamondColors[0], alpha: 1.0 },   // Main cool white layer
    ];
    
    for (const offset of offsets) {
      const oldAlpha = this.ctx.globalAlpha;
      this.ctx.globalAlpha = offset.alpha;
      this.ctx.fillStyle = offset.color;
      this.ctx.fillText(
        text,
        drawX + offset.x,
        drawY + offset.y
      );
      this.ctx.globalAlpha = oldAlpha;
    }
    
    // Add sparkle particles that sweep across the entire text
    const textHeight = size * this.pixelSize * 8;
    
    // Calculate sparkle positions across the text width
    const sparkleCount = Math.floor(textWidth / 8); // More sparkles for longer text
    const sparkleSpacing = textWidth / sparkleCount;
    
    // Animate sparkles sweeping across the text
    const sweepSpeed = 0.3;
    const sparkleOffset = (time * sweepSpeed) % (textWidth + 20);
    
    for (let i = 0; i < sparkleCount; i++) {
      const baseX = drawX - (textWidth / 2) + (i * sparkleSpacing);
      const sparkleX = baseX + sparkleOffset - textWidth - 20;
      
      // Only draw sparkles that are within the text bounds
      if (sparkleX >= drawX - (textWidth / 2) - 5 && sparkleX <= drawX + (textWidth / 2) + 5) {
        // Create a wave effect for vertical position
        const waveOffset = Math.sin((sparkleX - drawX) * 0.1 + time * 0.2) * 3;
        const sparkleY = drawY + (textHeight / 2) + waveOffset;
        
        // Fade sparkles at edges
        const distanceFromCenter = Math.abs(sparkleX - drawX);
        const fadeDistance = textWidth / 2;
        const alpha = Math.max(0, 1 - (distanceFromCenter / fadeDistance));
        
        if (alpha > 0.1) {
          const sparkleColor = diamondColors[Math.floor((sparkleX * 0.1 + time) % diamondColors.length)];
          const oldAlpha = this.ctx.globalAlpha;
          this.ctx.globalAlpha = alpha * 0.9;
          this.ctx.fillStyle = sparkleColor;
          
          // Draw sparkle (cross shape)
          this.ctx.fillRect(sparkleX - 1, sparkleY - 1, 3, 3);
          this.ctx.fillRect(sparkleX - 2, sparkleY, 5, 1);
          this.ctx.fillRect(sparkleX, sparkleY - 2, 1, 5);
          
          this.ctx.globalAlpha = oldAlpha;
        }
      }
    }
    
    // Reset text alignment to default
    this.ctx.textAlign = 'left';
  }
  
  /**
   * Get canvas context for advanced operations
   */
  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }
  
  /**
   * Get pixel size
   */
  getPixelSize(): number {
    return this.pixelSize;
  }
}

