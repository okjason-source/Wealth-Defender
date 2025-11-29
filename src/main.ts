/**
 * Main Entry Point
 * Initializes and starts the game
 */

import { GameManager } from './managers/game';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Get canvas element
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

    if (!canvas) {
      throw new Error('Canvas element not found!');
    }

    // Initialize game
    const game = new GameManager(canvas);

    // Start the game
    game.start();

    // Expose bot for console access (for debugging/master mode)
    (window as any).bot = game.getBotAI();
    console.log('Wealth Defender - Billionaire Mindset initialized!');
    console.log('Bot controls: Press B to toggle bot, M to set master level');
    console.log('Console: Use window.bot.setMasterLevel() to instantly max skills');
  } catch (error) {
    console.error('Failed to initialize game:', error);
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FF0000';
        ctx.font = '16px monospace';
        ctx.fillText('Game initialization failed. Check console.', 10, 30);
        ctx.fillText(String(error), 10, 50);
      }
    }
  }
});

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Get base path from current location
    const basePath = window.location.pathname.split('/').slice(0, -1).join('/') || '';
    const swPath = `${basePath}/sw.js`;
    
    navigator.serviceWorker.register(swPath)
      .then((registration) => {
        console.log('Service Worker registered:', registration.scope);
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

// Handle window resize
window.addEventListener('resize', () => {
  // Could implement responsive scaling here if needed
});

