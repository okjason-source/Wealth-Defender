/**
 * Billionaire Mindset Color Palette
 * All colors used throughout the game
 */

export const Palette = {
  // Primary Colors
  GOLD: '#FFD700',
  AMBER: '#FFA500',
  DEEP_PURPLE: '#4B0082',
  RICH_BLACK: '#0A0A0A',
  DARK_BLACK: '#1A1A1A',
  PLATINUM: '#C0C0C0',
  SILVER: '#E5E4E2',
  
  // Accent Colors
  EMERALD_GREEN: '#50C878',
  SAPPHIRE_BLUE: '#0F52BA',
  CRIMSON_RED: '#DC143C',
  IVORY_WHITE: '#FFFFF0',
  PURE_WHITE: '#FFFFFF',
  
  // Enemy Colors
  DOLLAR_BILL_GREEN: '#228B22',
  DOLLAR_BILL_WHITE: '#FFFFFF',
  DIAMOND_BLUE: '#0F52BA',
  DIAMOND_LIGHT: '#87CEEB',
  COIN_GOLD: '#FFD700',
  COIN_BRONZE: '#CD7F32',
  HATER_RED: '#DC143C',
  HATER_PURPLE: '#4B0082',
  
  // UI Colors
  UI_GOLD: '#FFD700',
  UI_PURPLE: '#4B0082',
  UI_BLACK: '#0A0A0A',
  
  // Background
  BACKGROUND: '#0A0A0A',
  STAR_COLOR: '#C0C0C0',
} as const;

/**
 * Color palette indices for sprite encoding
 * Each number maps to a color in the palette
 */
export const ColorIndex = {
  TRANSPARENT: 0,
  BLACK: 1,
  GOLD: 2,
  AMBER: 3,
  DEEP_PURPLE: 4,
  PLATINUM: 5,
  DOLLAR_GREEN: 6,
  WHITE: 7,
  DIAMOND_BLUE: 8,
  DIAMOND_LIGHT: 9,
  COIN_GOLD: 10,
  COIN_BRONZE: 11,
  HATER_RED: 12,
  HATER_PURPLE: 13,
  CRIMSON: 14,
  EMERALD: 15,
} as const;

/**
 * Map color indices to actual hex colors
 */
export const IndexToColor: Record<number, string> = {
  [ColorIndex.TRANSPARENT]: 'transparent',
  [ColorIndex.BLACK]: Palette.RICH_BLACK,
  [ColorIndex.GOLD]: Palette.GOLD,
  [ColorIndex.AMBER]: Palette.AMBER,
  [ColorIndex.DEEP_PURPLE]: Palette.DEEP_PURPLE,
  [ColorIndex.PLATINUM]: Palette.PLATINUM,
  [ColorIndex.DOLLAR_GREEN]: Palette.DOLLAR_BILL_GREEN,
  [ColorIndex.WHITE]: Palette.PURE_WHITE,
  [ColorIndex.DIAMOND_BLUE]: Palette.DIAMOND_BLUE,
  [ColorIndex.DIAMOND_LIGHT]: Palette.DIAMOND_LIGHT,
  [ColorIndex.COIN_GOLD]: Palette.COIN_GOLD,
  [ColorIndex.COIN_BRONZE]: Palette.COIN_BRONZE,
  [ColorIndex.HATER_RED]: Palette.HATER_RED,
  [ColorIndex.HATER_PURPLE]: Palette.HATER_PURPLE,
  [ColorIndex.CRIMSON]: Palette.CRIMSON_RED,
  [ColorIndex.EMERALD]: Palette.EMERALD_GREEN,
};

