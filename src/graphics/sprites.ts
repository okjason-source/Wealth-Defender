/**
 * Encoded Sprite Data
 * All sprites are stored as 2D arrays of color indices
 */

/**
 * Player cannon sprite (8x5 pixels)
 * Gold/Amber themed, flat base, cannon shape - shorter and thinner
 */
export const PLAYER_SPRITE: number[][] = [
  [0, 0, 0, 1, 1, 0, 0, 0],  // Barrel opening (black center)
  [0, 0, 2, 3, 3, 2, 0, 0],  // Barrel (thin, gold/amber)
  [0, 2, 3, 3, 3, 3, 2, 0],  // Barrel base
  [2, 3, 3, 3, 3, 3, 3, 2],  // Base top
  [2, 2, 2, 2, 2, 2, 2, 2],  // Flat base (solid gold)
];

/**
 * Dollar Bill sprite - Wing flapping animation
 * Horizontal shape that flaps like bird wings
 */

// Frame 1: Wings up (V shape)
export const DOLLAR_BILL_FRAME_1: number[][] = [
  [0, 0, 0, 0, 6, 6, 6, 6, 0, 0, 0, 0],
  [0, 0, 0, 6, 7, 2, 2, 7, 6, 0, 0, 0],
  [0, 0, 6, 7, 2, 7, 7, 2, 7, 6, 0, 0],
  [0, 6, 7, 2, 7, 6, 6, 7, 2, 7, 6, 0],
  [6, 7, 2, 7, 6, 0, 0, 6, 7, 2, 7, 6],
  [0, 6, 7, 2, 7, 6, 6, 7, 2, 7, 6, 0],
  [0, 0, 6, 7, 2, 7, 7, 2, 7, 6, 0, 0],
  [0, 0, 0, 6, 7, 2, 2, 7, 6, 0, 0, 0],
];

// Frame 2: Wings horizontal (flat)
export const DOLLAR_BILL_FRAME_2: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 6, 6, 6, 6, 6, 6, 6, 6, 0, 0],
  [0, 6, 7, 2, 7, 6, 6, 7, 2, 7, 6, 0],
  [6, 7, 2, 7, 6, 6, 6, 6, 7, 2, 7, 6],
  [6, 7, 2, 7, 6, 6, 6, 6, 7, 2, 7, 6],
  [0, 6, 7, 2, 7, 6, 6, 7, 2, 7, 6, 0],
  [0, 0, 6, 6, 6, 6, 6, 6, 6, 6, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

// Frame 3: Wings down (inverted V shape)
export const DOLLAR_BILL_FRAME_3: number[][] = [
  [0, 0, 0, 6, 7, 2, 2, 7, 6, 0, 0, 0],
  [0, 0, 6, 7, 2, 7, 7, 2, 7, 6, 0, 0],
  [0, 6, 7, 2, 7, 6, 6, 7, 2, 7, 6, 0],
  [6, 7, 2, 7, 6, 0, 0, 6, 7, 2, 7, 6],
  [0, 6, 7, 2, 7, 6, 6, 7, 2, 7, 6, 0],
  [0, 0, 6, 7, 2, 7, 7, 2, 7, 6, 0, 0],
  [0, 0, 0, 6, 7, 2, 2, 7, 6, 0, 0, 0],
  [0, 0, 0, 0, 6, 6, 6, 6, 0, 0, 0, 0],
];

// Animation frames array (cycles: up -> flat -> down -> flat -> up)
export const DOLLAR_BILL_FRAMES: number[][][] = [
  DOLLAR_BILL_FRAME_1, // Wings up
  DOLLAR_BILL_FRAME_2, // Wings horizontal
  DOLLAR_BILL_FRAME_3, // Wings down
  DOLLAR_BILL_FRAME_2, // Wings horizontal (for smooth loop)
];

// Default sprite (for backwards compatibility)
export const DOLLAR_BILL_SPRITE: number[][] = DOLLAR_BILL_FRAME_2;

/**
 * Diamond sprite (8x8 pixels)
 * Pentagon/gemstone shape, blue/crystal
 * Classic gemstone cut: top point, two upper facets, wide middle, two lower facets, bottom point
 * Multiple frames for sparkling animation
 */

// Frame 1: Base diamond with highlights on top facets
export const DIAMOND_FRAME_1: number[][] = [
  [0, 0, 0, 8, 8, 0, 0, 0],        // Top point
  [0, 0, 8, 9, 9, 8, 0, 0],        // Upper facets expanding
  [0, 8, 9, 5, 5, 9, 8, 0],        // Upper section with highlights
  [8, 9, 5, 8, 8, 5, 9, 8],        // Widest section (girdle)
  [0, 8, 9, 5, 5, 9, 8, 0],        // Lower section
  [0, 0, 8, 9, 9, 8, 0, 0],        // Lower facets converging
  [0, 0, 0, 8, 8, 0, 0, 0],        // Bottom point
  [0, 0, 0, 0, 0, 0, 0, 0],        // Empty space below
];

// Frame 2: Sparkle on left facet
export const DIAMOND_FRAME_2: number[][] = [
  [0, 0, 0, 8, 8, 0, 0, 0],        // Top point
  [0, 0, 8, 9, 9, 8, 0, 0],        // Upper facets
  [0, 8, 5, 5, 5, 9, 8, 0],        // Left highlight (more sparkle)
  [8, 5, 5, 8, 8, 5, 9, 8],        // Left side sparkle
  [0, 8, 9, 5, 5, 9, 8, 0],        // Lower section
  [0, 0, 8, 9, 9, 8, 0, 0],        // Lower facets
  [0, 0, 0, 8, 8, 0, 0, 0],        // Bottom point
  [0, 0, 0, 0, 0, 0, 0, 0],        // Empty space
];

// Frame 3: Sparkle on center/top
export const DIAMOND_FRAME_3: number[][] = [
  [0, 0, 0, 5, 5, 0, 0, 0],        // Top point with sparkle
  [0, 0, 8, 5, 5, 8, 0, 0],        // Upper facets with center sparkle
  [0, 8, 9, 5, 5, 9, 8, 0],        // Upper section
  [8, 9, 5, 5, 5, 5, 9, 8],        // Center sparkle (girdle)
  [0, 8, 9, 5, 5, 9, 8, 0],        // Lower section
  [0, 0, 8, 9, 9, 8, 0, 0],        // Lower facets
  [0, 0, 0, 8, 8, 0, 0, 0],        // Bottom point
  [0, 0, 0, 0, 0, 0, 0, 0],        // Empty space
];

// Frame 4: Sparkle on right facet
export const DIAMOND_FRAME_4: number[][] = [
  [0, 0, 0, 8, 8, 0, 0, 0],        // Top point
  [0, 0, 8, 9, 9, 8, 0, 0],        // Upper facets
  [0, 8, 9, 5, 5, 5, 8, 0],        // Right highlight (more sparkle)
  [8, 9, 5, 8, 8, 5, 5, 8],        // Right side sparkle
  [0, 8, 9, 5, 5, 9, 8, 0],        // Lower section
  [0, 0, 8, 9, 9, 8, 0, 0],        // Lower facets
  [0, 0, 0, 8, 8, 0, 0, 0],        // Bottom point
  [0, 0, 0, 0, 0, 0, 0, 0],        // Empty space
];

// Frame 5: Subtle sparkle (back to base with slight variation)
export const DIAMOND_FRAME_5: number[][] = [
  [0, 0, 0, 8, 8, 0, 0, 0],        // Top point
  [0, 0, 8, 9, 9, 8, 0, 0],        // Upper facets
  [0, 8, 9, 5, 5, 9, 8, 0],        // Upper section
  [8, 9, 5, 8, 8, 5, 9, 8],        // Widest section
  [0, 8, 9, 5, 5, 9, 8, 0],        // Lower section with highlights
  [0, 0, 8, 9, 9, 8, 0, 0],        // Lower facets
  [0, 0, 0, 8, 8, 0, 0, 0],        // Bottom point
  [0, 0, 0, 0, 0, 0, 0, 0],        // Empty space
];

// Animation frames array (cycles through sparkle positions)
export const DIAMOND_FRAMES: number[][][] = [
  DIAMOND_FRAME_1, // Base with top highlights
  DIAMOND_FRAME_2, // Left sparkle
  DIAMOND_FRAME_3, // Center/top sparkle
  DIAMOND_FRAME_4, // Right sparkle
  DIAMOND_FRAME_5, // Subtle variation
  DIAMOND_FRAME_3, // Center sparkle again
  DIAMOND_FRAME_1, // Back to base
];

// Default sprite (for backwards compatibility)
export const DIAMOND_SPRITE: number[][] = DIAMOND_FRAME_1;

/**
 * Coin sprite (8x8 pixels)
 * Circular, gold/bronze with embossed "B" letter for Billionaire
 * The "B" uses darker gold/bronze (11) for an embossed effect
 */
export const COIN_SPRITE: number[][] = [
  [0, 0, 10, 10, 10, 10, 0, 0],
  [0, 10, 10, 10, 10, 10, 10, 0],
  [10, 10, 11, 11, 11, 11, 10, 10],  // Top of B (darker gold/bronze for embossed look)
  [10, 11, 11, 10, 10, 11, 11, 10],   // B left side and top right (darker gold)
  [10, 11, 11, 10, 10, 11, 11, 10],   // B left side and middle right (darker gold)
  [10, 10, 11, 11, 11, 11, 10, 10],  // Bottom of B (darker gold/bronze)
  [0, 10, 10, 10, 10, 10, 10, 0],
  [0, 0, 10, 10, 10, 10, 0, 0],
];

/**
 * Hater sprite (8x10 pixels)
 * Two-legged face, red/purple
 */
export const HATER_SPRITE: number[][] = [
  [0, 0, 13, 13, 13, 13, 0, 0],
  [0, 13, 12, 12, 12, 12, 13, 0],
  [13, 12, 1, 1, 1, 1, 12, 13],
  [13, 12, 1, 12, 12, 1, 12, 13], // Eyes
  [13, 12, 1, 1, 1, 1, 12, 13],
  [13, 12, 12, 12, 12, 12, 12, 13], // Mouth
  [13, 12, 12, 12, 12, 12, 12, 13],
  [0, 13, 12, 0, 0, 12, 13, 0], // Legs
  [0, 0, 12, 0, 0, 12, 0, 0],
  [0, 0, 12, 0, 0, 12, 0, 0],
];

/**
 * Player projectile sprite (2x2 pixels) - Shorter for rapid fire
 * Gold
 */
export const PLAYER_PROJECTILE_SPRITE: number[][] = [
  [2],
  [3],
];

/**
 * Enemy projectile sprite (1x3 pixels)
 * White
 */
export const ENEMY_PROJECTILE_SPRITE: number[][] = [
  [7], // WHITE
  [7], // WHITE
  [7], // WHITE
];

/**
 * Explosion frame 1 (8x8 pixels)
 */
export const EXPLOSION_1: number[][] = [
  [0, 0, 0, 3, 3, 0, 0, 0],
  [0, 0, 3, 2, 2, 3, 0, 0],
  [0, 3, 2, 3, 3, 2, 3, 0],
  [3, 2, 3, 0, 0, 3, 2, 3],
  [3, 2, 3, 0, 0, 3, 2, 3],
  [0, 3, 2, 3, 3, 2, 3, 0],
  [0, 0, 3, 2, 2, 3, 0, 0],
  [0, 0, 0, 3, 3, 0, 0, 0],
];

/**
 * Explosion frame 2 (8x8 pixels)
 */
export const EXPLOSION_2: number[][] = [
  [0, 3, 0, 0, 0, 0, 3, 0],
  [3, 2, 3, 0, 0, 3, 2, 3],
  [0, 3, 0, 2, 2, 0, 3, 0],
  [0, 0, 2, 3, 3, 2, 0, 0],
  [0, 0, 2, 3, 3, 2, 0, 0],
  [0, 3, 0, 2, 2, 0, 3, 0],
  [3, 2, 3, 0, 0, 3, 2, 3],
  [0, 3, 0, 0, 0, 0, 3, 0],
];

/**
 * Explosion frame 3 (8x8 pixels)
 */
export const EXPLOSION_3: number[][] = [
  [3, 0, 0, 0, 0, 0, 0, 3],
  [0, 2, 0, 0, 0, 0, 2, 0],
  [0, 0, 3, 0, 0, 3, 0, 0],
  [0, 0, 0, 2, 2, 0, 0, 0],
  [0, 0, 0, 2, 2, 0, 0, 0],
  [0, 0, 3, 0, 0, 3, 0, 0],
  [0, 2, 0, 0, 0, 0, 2, 0],
  [3, 0, 0, 0, 0, 0, 0, 3],
];

export const EXPLOSION_FRAMES = [EXPLOSION_1, EXPLOSION_2, EXPLOSION_3];

/**
 * Brain sprite (8x10 pixels)
 * Oval-shaped brain with brainstem, flickering animation
 * Pink/purple color scheme for brain appearance
 */
// Frame 1: Normal brain (oval shape with brainstem)
export const BRAIN_FRAME_1: number[][] = [
  [0, 0, 0, 4, 4, 0, 0, 0],        // Top point
  [0, 0, 4, 13, 13, 4, 0, 0],      // Top expanding
  [0, 4, 13, 4, 4, 13, 4, 0],      // Upper brain (wrinkles)
  [4, 13, 4, 13, 13, 4, 13, 4],    // Middle brain (wrinkles)
  [4, 13, 13, 4, 4, 13, 13, 4],    // Lower brain (wrinkles)
  [0, 4, 13, 13, 13, 13, 4, 0],    // Bottom of brain
  [0, 0, 4, 13, 13, 4, 0, 0],      // Brainstem top
  [0, 0, 0, 4, 4, 0, 0, 0],        // Brainstem middle
  [0, 0, 0, 4, 4, 0, 0, 0],        // Brainstem bottom
  [0, 0, 0, 0, 0, 0, 0, 0],        // Empty space
];

// Frame 2: Flickering (brighter)
export const BRAIN_FRAME_2: number[][] = [
  [0, 0, 0, 4, 4, 0, 0, 0],        // Top point
  [0, 0, 4, 7, 7, 4, 0, 0],        // Top expanding (brighter)
  [0, 4, 7, 13, 13, 7, 4, 0],      // Upper brain (brighter)
  [4, 7, 13, 4, 4, 13, 7, 4],      // Middle brain (brighter)
  [4, 13, 4, 7, 7, 4, 13, 4],      // Lower brain (brighter)
  [0, 4, 13, 7, 7, 13, 4, 0],      // Bottom of brain (brighter)
  [0, 0, 4, 7, 7, 4, 0, 0],        // Brainstem top (brighter)
  [0, 0, 0, 4, 4, 0, 0, 0],        // Brainstem middle
  [0, 0, 0, 4, 4, 0, 0, 0],        // Brainstem bottom
  [0, 0, 0, 0, 0, 0, 0, 0],        // Empty space
];

// Frame 3: Flickering (dimmer)
export const BRAIN_FRAME_3: number[][] = [
  [0, 0, 0, 4, 4, 0, 0, 0],        // Top point
  [0, 0, 4, 4, 4, 4, 0, 0],        // Top expanding (dimmer)
  [0, 4, 4, 13, 13, 4, 4, 0],      // Upper brain (dimmer)
  [4, 4, 13, 4, 4, 13, 4, 4],      // Middle brain (dimmer)
  [4, 13, 4, 4, 4, 4, 13, 4],      // Lower brain (dimmer)
  [0, 4, 13, 4, 4, 13, 4, 0],      // Bottom of brain (dimmer)
  [0, 0, 4, 4, 4, 4, 0, 0],        // Brainstem top (dimmer)
  [0, 0, 0, 4, 4, 0, 0, 0],        // Brainstem middle
  [0, 0, 0, 4, 4, 0, 0, 0],        // Brainstem bottom
  [0, 0, 0, 0, 0, 0, 0, 0],        // Empty space
];

// Animation frames array (flickering effect)
export const BRAIN_FRAMES: number[][][] = [
  BRAIN_FRAME_1, // Normal
  BRAIN_FRAME_2, // Bright flicker
  BRAIN_FRAME_1, // Normal
  BRAIN_FRAME_3, // Dim flicker
  BRAIN_FRAME_1, // Normal
];

