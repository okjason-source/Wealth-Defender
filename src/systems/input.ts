/**
 * Input System
 * Handles keyboard and mouse input
 */

export class InputSystem {
  private keys: Set<string> = new Set();
  private mouseX: number = 0;
  private mouseY: number = 0;
  private mouseDown: boolean = false;
  private spacePressed: boolean = false;
  
  constructor() {
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    // Keyboard events
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
      if (e.key === ' ') {
        e.preventDefault();
        this.spacePressed = true;
      }
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
      if (e.key === ' ') {
        this.spacePressed = false;
      }
    });
    
    // Mouse events
    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
    
    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) { // Left click
        this.mouseDown = true;
      }
    });
    
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.mouseDown = false;
      }
    });
    
    // Prevent context menu on right click
    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }
  
  isKeyPressed(key: string): boolean {
    return this.keys.has(key.toLowerCase());
  }
  
  isMovingLeft(): boolean {
    return this.isKeyPressed('a') || this.isKeyPressed('arrowleft');
  }
  
  isMovingRight(): boolean {
    return this.isKeyPressed('d') || this.isKeyPressed('arrowright');
  }
  
  isMovingUp(): boolean {
    return this.isKeyPressed('w') || this.isKeyPressed('arrowup');
  }
  
  isMovingDown(): boolean {
    return this.isKeyPressed('s') || this.isKeyPressed('arrowdown');
  }
  
  isAutoFirePressed(): boolean {
    return this.spacePressed;
  }
  
  isLaserPressed(): boolean {
    return this.mouseDown || this.isKeyPressed('z');
  }
  
  getMousePosition(): { x: number; y: number } {
    return { x: this.mouseX, y: this.mouseY };
  }
  
  getMousePositionInGame(canvas: HTMLCanvasElement): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    const pixelSize = 4; // Should match renderer pixel size
    const gameWidth = 200;
    const gameHeight = 150;
    
    const x = Math.floor((this.mouseX - rect.left) / pixelSize);
    const y = Math.floor((this.mouseY - rect.top) / pixelSize);
    
    return {
      x: Math.max(0, Math.min(x, gameWidth)),
      y: Math.max(0, Math.min(y, gameHeight)),
    };
  }
  
  private lastKeyStates: Set<string> = new Set();
  private justPressedKeys: Set<string> = new Set();
  
  update(): void {
    // Called each frame to update input state
    // Track keys that were just pressed this frame
    this.justPressedKeys.clear();
    for (const key of this.keys) {
      if (!this.lastKeyStates.has(key)) {
        this.justPressedKeys.add(key);
      }
    }
    this.lastKeyStates = new Set(this.keys);
  }
  
  wasKeyJustPressed(key: string): boolean {
    // Check if key was just pressed this frame (not held)
    return this.justPressedKeys.has(key.toLowerCase());
  }
}

