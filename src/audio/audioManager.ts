/**
 * Audio Manager
 * Handles all game audio using base64-encoded audio data
 * Zero external assets - all audio is embedded in code
 */

export enum SoundType {
  ENEMY_DESTROYED = 'enemy_destroyed',
  PLAYER_HIT = 'player_hit',
  ROUND_START = 'round_start',
  ROUND_COMPLETE = 'round_complete',
  LASER_FIRE = 'laser_fire',
  PLAYER_SHOOT = 'player_shoot',
  GAME_OVER = 'game_over',
  VICTORY = 'victory',
  BONUS_ROUND = 'bonus_round',
  COLLECT_ITEM = 'collect_item',
  FLOCKED = 'flocked',
}

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<SoundType, AudioBuffer> = new Map();
  private enabled: boolean = true;
  private masterVolume: number = 0.5;
  // Track active enemy buzz sounds (key: enemy unique ID, value: { oscillator, gainNode, intervalId })
  private activeBuzzSounds: Map<string, { oscillator: OscillatorNode; gainNode: GainNode; intervalId: number }> = new Map();

  constructor() {
    // Initialize Web Audio API
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.loadSounds();
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
      this.enabled = false;
    }
  }

  /**
   * Load all base64-encoded sounds
   */
  private async loadSounds(): Promise<void> {
    if (!this.audioContext) return;

    // Load each sound type
    const soundPromises = Object.values(SoundType).map(async (soundType) => {
      const base64Data = this.getBase64Audio(soundType);
      if (base64Data) {
        try {
          const buffer = await this.decodeBase64Audio(base64Data);
          this.sounds.set(soundType, buffer);
        } catch (e) {
          console.warn(`Failed to load sound ${soundType}:`, e);
        }
      }
    });

    await Promise.all(soundPromises);
  }

  /**
   * Get base64-encoded audio data for a sound type
   * These are placeholder base64 strings - replace with actual encoded audio
   */
  private getBase64Audio(soundType: SoundType): string | null {
    // TODO: Replace these placeholder base64 strings with actual encoded audio files
    // To encode audio: Convert MP3/WAV/OGG to base64, then paste here
    // Example: const audioFile = await fetch('sound.mp3').then(r => r.blob());
    //          const base64 = await blobToBase64(audioFile);
    
    switch (soundType) {
      case SoundType.ENEMY_DESTROYED:
        // Placeholder: Short beep (replace with actual encoded audio)
        return null; // Will use procedural sound as fallback
      
      case SoundType.PLAYER_HIT:
        return null; // Will use procedural sound as fallback
      
      case SoundType.ROUND_START:
        return null; // Will use procedural sound as fallback
      
      case SoundType.ROUND_COMPLETE:
        return null; // Will use procedural sound as fallback
      
      case SoundType.LASER_FIRE:
        return null; // Will use procedural sound as fallback
      
      case SoundType.GAME_OVER:
        return null; // Will use procedural sound as fallback
      
      case SoundType.VICTORY:
        return null; // Will use procedural sound as fallback
      
      case SoundType.BONUS_ROUND:
        return null; // Will use procedural sound as fallback
      
      case SoundType.COLLECT_ITEM:
        return null; // Will use procedural sound as fallback
      
      case SoundType.FLOCKED:
        return null; // Will use procedural sound as fallback
      
      case SoundType.PLAYER_SHOOT:
        return null; // Will use procedural sound as fallback
      
      default:
        return null;
    }
  }

  /**
   * Decode base64 audio data to AudioBuffer
   */
  private async decodeBase64Audio(base64Data: string): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    // Remove data URL prefix if present (e.g., "data:audio/mp3;base64,")
    const base64 = base64Data.includes(',') 
      ? base64Data.split(',')[1] 
      : base64Data;

    // Decode base64 to ArrayBuffer
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Decode audio data
    return await this.audioContext.decodeAudioData(bytes.buffer);
  }

  /**
   * Play a sound effect
   */
  playSound(soundType: SoundType, volume: number = 1.0): void {
    if (!this.enabled || !this.audioContext) return;

    const buffer = this.sounds.get(soundType);
    if (buffer) {
      this.playAudioBuffer(buffer, volume);
    } else {
      // Fallback to procedural sound generation
      this.playProceduralSound(soundType, volume);
    }
  }

  /**
   * Play an AudioBuffer
   */
  private playAudioBuffer(buffer: AudioBuffer, volume: number = 1.0): void {
    if (!this.audioContext) return;

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = buffer;
    gainNode.gain.value = volume * this.masterVolume;
    
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    source.start(0);
  }

  /**
   * Generate procedural sounds as fallback (8-bit style)
   */
  private playProceduralSound(soundType: SoundType, volume: number = 1.0): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const now = this.audioContext.currentTime;

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Configure sound based on type
    switch (soundType) {
      case SoundType.ENEMY_DESTROYED:
        // Short high-pitched beep
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(800, now);
        oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.1);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume * this.masterVolume * 0.3, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
        break;

      case SoundType.PLAYER_HIT:
        // Low warning tone
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume * this.masterVolume * 0.4, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
        break;

      case SoundType.ROUND_START:
        // Rising tone
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(300, now);
        oscillator.frequency.linearRampToValueAtTime(600, now + 0.15);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume * this.masterVolume * 0.3, now + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.15);
        oscillator.start(now);
        oscillator.stop(now + 0.15);
        break;

      case SoundType.ROUND_COMPLETE:
        // Success chime (two tones)
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523, now); // C5
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume * this.masterVolume * 0.3, now + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
        
        // Second tone
        setTimeout(() => {
          if (!this.audioContext) return;
          const osc2 = this.audioContext.createOscillator();
          const gain2 = this.audioContext.createGain();
          const now2 = this.audioContext.currentTime;
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(659, now2); // E5
          gain2.gain.setValueAtTime(0, now2);
          gain2.gain.linearRampToValueAtTime(volume * this.masterVolume * 0.3, now2 + 0.01);
          gain2.gain.linearRampToValueAtTime(0, now2 + 0.15);
          osc2.connect(gain2);
          gain2.connect(this.audioContext.destination);
          osc2.start(now2);
          osc2.stop(now2 + 0.15);
        }, 100);
        break;

      case SoundType.LASER_FIRE:
        // Devastating multi-layered laser sound - big, bold, powerful
        const laserDuration = 0.12; // Longer for more impact
        
        // Layer 1: Deep bass foundation (low frequency, powerful)
        const bassOsc = this.audioContext.createOscillator();
        const bassGain = this.audioContext.createGain();
        bassOsc.type = 'sawtooth'; // Rich harmonics
        bassOsc.frequency.setValueAtTime(150, now); // Deep bass
        bassOsc.frequency.exponentialRampToValueAtTime(80, now + laserDuration); // Descend deeper
        bassGain.gain.setValueAtTime(0, now);
        bassGain.gain.linearRampToValueAtTime(volume * this.masterVolume * 0.15, now + 0.002);
        bassGain.gain.exponentialRampToValueAtTime(0.01, now + laserDuration);
        bassOsc.connect(bassGain);
        bassGain.connect(this.audioContext.destination);
        bassOsc.start(now);
        bassOsc.stop(now + laserDuration);
        
        // Layer 2: Mid-range power (main laser character)
        const midOsc = this.audioContext.createOscillator();
        const midGain = this.audioContext.createGain();
        midOsc.type = 'square'; // Sharp, cutting
        midOsc.frequency.setValueAtTime(800, now);
        midOsc.frequency.exponentialRampToValueAtTime(400, now + laserDuration);
        midGain.gain.setValueAtTime(0, now);
        midGain.gain.linearRampToValueAtTime(volume * this.masterVolume * 0.18, now + 0.001);
        midGain.gain.exponentialRampToValueAtTime(0.01, now + laserDuration);
        midOsc.connect(midGain);
        midGain.connect(this.audioContext.destination);
        midOsc.start(now);
        midOsc.stop(now + laserDuration);
        
        // Layer 3: High-frequency crackle (energy discharge)
        const highOsc = this.audioContext.createOscillator();
        const highGain = this.audioContext.createGain();
        highOsc.type = 'square';
        highOsc.frequency.setValueAtTime(2000, now);
        highOsc.frequency.exponentialRampToValueAtTime(1200, now + laserDuration * 0.6);
        highOsc.frequency.exponentialRampToValueAtTime(800, now + laserDuration);
        highGain.gain.setValueAtTime(0, now);
        highGain.gain.linearRampToValueAtTime(volume * this.masterVolume * 0.12, now + 0.001);
        highGain.gain.exponentialRampToValueAtTime(0.01, now + laserDuration * 0.7);
        highOsc.connect(highGain);
        highGain.connect(this.audioContext.destination);
        highOsc.start(now);
        highOsc.stop(now + laserDuration);
        
        // Layer 4: Sub-bass rumble (ultra-low for impact)
        const subOsc = this.audioContext.createOscillator();
        const subGain = this.audioContext.createGain();
        subOsc.type = 'sine'; // Clean sub-bass
        subOsc.frequency.setValueAtTime(60, now); // Very deep
        subOsc.frequency.exponentialRampToValueAtTime(40, now + laserDuration);
        subGain.gain.setValueAtTime(0, now);
        subGain.gain.linearRampToValueAtTime(volume * this.masterVolume * 0.1, now + 0.003);
        subGain.gain.exponentialRampToValueAtTime(0.01, now + laserDuration);
        subOsc.connect(subGain);
        subGain.connect(this.audioContext.destination);
        subOsc.start(now);
        subOsc.stop(now + laserDuration);
        break;

      case SoundType.GAME_OVER:
        // Descending sad tone
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(400, now);
        oscillator.frequency.exponentialRampToValueAtTime(150, now + 0.5);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume * this.masterVolume * 0.4, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        oscillator.start(now);
        oscillator.stop(now + 0.5);
        break;

      case SoundType.VICTORY:
        // Victory fanfare (three ascending tones)
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523, now); // C5
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume * this.masterVolume * 0.3, now + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.15);
        oscillator.start(now);
        oscillator.stop(now + 0.15);
        
        setTimeout(() => {
          if (!this.audioContext) return;
          const osc2 = this.audioContext.createOscillator();
          const gain2 = this.audioContext.createGain();
          const now2 = this.audioContext.currentTime;
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(659, now2); // E5
          gain2.gain.setValueAtTime(0, now2);
          gain2.gain.linearRampToValueAtTime(volume * this.masterVolume * 0.3, now2 + 0.01);
          gain2.gain.linearRampToValueAtTime(0, now2 + 0.15);
          osc2.connect(gain2);
          gain2.connect(this.audioContext.destination);
          osc2.start(now2);
          osc2.stop(now2 + 0.15);
        }, 150);
        
        setTimeout(() => {
          if (!this.audioContext) return;
          const osc3 = this.audioContext.createOscillator();
          const gain3 = this.audioContext.createGain();
          const now3 = this.audioContext.currentTime;
          osc3.type = 'sine';
          osc3.frequency.setValueAtTime(784, now3); // G5
          gain3.gain.setValueAtTime(0, now3);
          gain3.gain.linearRampToValueAtTime(volume * this.masterVolume * 0.3, now3 + 0.01);
          gain3.gain.linearRampToValueAtTime(0, now3 + 0.2);
          osc3.connect(gain3);
          gain3.connect(this.audioContext.destination);
          osc3.start(now3);
          osc3.stop(now3 + 0.2);
        }, 300);
        break;

      case SoundType.BONUS_ROUND:
        // Exciting ascending arpeggio
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523, now); // C5
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume * this.masterVolume * 0.3, now + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
        
        [659, 784, 1047].forEach((freq, i) => {
          setTimeout(() => {
            if (!this.audioContext) return;
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const now = this.audioContext.currentTime;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(volume * this.masterVolume * 0.3, now + 0.01);
            gain.gain.linearRampToValueAtTime(0, now + 0.1);
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.start(now);
            osc.stop(now + 0.1);
          }, 100 + (i * 80));
        });
        break;

      case SoundType.COLLECT_ITEM:
        // Pleasant collection sound - ascending chime
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(659, now); // E5
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume * this.masterVolume * 0.3, now + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.12);
        oscillator.start(now);
        oscillator.stop(now + 0.12);
        
        // Second higher tone for satisfying collection feel
        setTimeout(() => {
          if (!this.audioContext) return;
          const osc2 = this.audioContext.createOscillator();
          const gain2 = this.audioContext.createGain();
          const now2 = this.audioContext.currentTime;
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(784, now2); // G5
          gain2.gain.setValueAtTime(0, now2);
          gain2.gain.linearRampToValueAtTime(volume * this.masterVolume * 0.25, now2 + 0.01);
          gain2.gain.linearRampToValueAtTime(0, now2 + 0.1);
          osc2.connect(gain2);
          gain2.connect(this.audioContext.destination);
          osc2.start(now2);
          osc2.stop(now2 + 0.1);
        }, 50);
        break;

      case SoundType.FLOCKED:
        // Triumphant bell/honk sound for FLOCKED! achievement
        // Multi-layered celebratory sound
        const flockedDuration = 0.4;
        
        // Layer 1: Deep bell tone (low frequency)
        const bellOsc = this.audioContext.createOscillator();
        const bellGain = this.audioContext.createGain();
        bellOsc.type = 'sine';
        bellOsc.frequency.setValueAtTime(392, now); // G4
        bellOsc.frequency.exponentialRampToValueAtTime(294, now + flockedDuration); // D4
        bellGain.gain.setValueAtTime(0, now);
        bellGain.gain.linearRampToValueAtTime(volume * this.masterVolume * 0.4, now + 0.01);
        bellGain.gain.exponentialRampToValueAtTime(0.01, now + flockedDuration);
        bellOsc.connect(bellGain);
        bellGain.connect(this.audioContext.destination);
        bellOsc.start(now);
        bellOsc.stop(now + flockedDuration);
        
        // Layer 2: Higher bell harmonic
        setTimeout(() => {
          if (!this.audioContext) return;
          const bell2Osc = this.audioContext.createOscillator();
          const bell2Gain = this.audioContext.createGain();
          const now2 = this.audioContext.currentTime;
          bell2Osc.type = 'sine';
          bell2Osc.frequency.setValueAtTime(523, now2); // C5
          bell2Osc.frequency.exponentialRampToValueAtTime(392, now2 + flockedDuration * 0.8); // G4
          bell2Gain.gain.setValueAtTime(0, now2);
          bell2Gain.gain.linearRampToValueAtTime(volume * this.masterVolume * 0.35, now2 + 0.01);
          bell2Gain.gain.exponentialRampToValueAtTime(0.01, now2 + flockedDuration * 0.8);
          bell2Osc.connect(bell2Gain);
          bell2Gain.connect(this.audioContext.destination);
          bell2Osc.start(now2);
          bell2Osc.stop(now2 + flockedDuration * 0.8);
        }, 30);
        
        // Layer 3: Triumphant honk/trumpet-like sound
        setTimeout(() => {
          if (!this.audioContext) return;
          const honkOsc = this.audioContext.createOscillator();
          const honkGain = this.audioContext.createGain();
          const now3 = this.audioContext.currentTime;
          honkOsc.type = 'sawtooth'; // Rich harmonics for trumpet-like sound
          honkOsc.frequency.setValueAtTime(659, now3); // E5
          honkOsc.frequency.linearRampToValueAtTime(784, now3 + 0.15); // G5 (ascending)
          honkOsc.frequency.linearRampToValueAtTime(659, now3 + 0.3); // Back to E5
          honkGain.gain.setValueAtTime(0, now3);
          honkGain.gain.linearRampToValueAtTime(volume * this.masterVolume * 0.3, now3 + 0.02);
          honkGain.gain.exponentialRampToValueAtTime(0.01, now3 + 0.35);
          honkOsc.connect(honkGain);
          honkGain.connect(this.audioContext.destination);
          honkOsc.start(now3);
          honkOsc.stop(now3 + 0.35);
        }, 100);
        break;

      case SoundType.PLAYER_SHOOT:
        // Quick, sharp projectile fire sound - lower pitch
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(400, now); // Lower starting frequency
        oscillator.frequency.exponentialRampToValueAtTime(500, now + 0.03); // Lower ending frequency
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume * this.masterVolume * 0.15, now + 0.001);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
        oscillator.start(now);
        oscillator.stop(now + 0.03);
        break;
    }
  }

  /**
   * Set master volume (0.0 to 1.0)
   */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Enable/disable audio
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if audio is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Start or update continuous enemy buzz sound - repeats faster with each hit until destroyed
   * Creates a melody by using different octaves based on damage state (health level)
   * @param enemyId Unique identifier for the enemy (used to track the sound)
   * @param enemyType The type of enemy (0=DOLLAR_BILL, 1=DIAMOND, 2=COIN, 3=HATER, 4=BRAIN)
   * @param hitsTaken Number of hits the enemy has taken (0 = first hit, 1 = second hit, etc.)
   * @param currentHealth Current health of the enemy (used for octave/melody mapping)
   * @param maxHealth Maximum health of the enemy
   */
  startOrUpdateEnemyBuzz(enemyId: string, enemyType: number, hitsTaken: number, currentHealth: number, maxHealth: number): void {
    if (!this.enabled || !this.audioContext) return;

    // Calculate base frequency for each enemy type
    let baseFreq: number;
    let waveType: OscillatorType = 'square';
    
    switch (enemyType) {
      case 0: // DOLLAR_BILL
        baseFreq = 300; // Lower, fluttery sound
        waveType = 'sine';
        break;
      case 1: // DIAMOND
        baseFreq = 350; // Lower, deeper crystalline sound (reduced from 600)
        waveType = 'triangle';
        break;
      case 2: // COIN
        baseFreq = 400; // Medium, metallic sound
        waveType = 'square';
        break;
      case 3: // HATER
        baseFreq = 250; // Lower, menacing sound
        waveType = 'sawtooth';
        break;
      case 4: // BRAIN
        baseFreq = 500; // Medium-high, electronic sound
        waveType = 'sine';
        break;
      default:
        baseFreq = 400;
        waveType = 'square';
    }

    // MELODY SYSTEM: Map health state to musical octaves
    // Each health level plays a different octave, creating a melody when many enemies are hit
    // Full health = lower octave, damaged = higher octaves
    // This creates a musical pattern: C (full health) -> E (1 hit) -> G (2 hits) -> C (3 hits, octave up)
    const healthRatio = currentHealth / maxHealth;
    const healthState = Math.floor((1 - healthRatio) * maxHealth); // 0 = full health, maxHealth-1 = almost dead
    
    // Musical scale mapping: C, D, E, F, G, A, B (major scale)
    // Each health state maps to a different note in the scale
    const musicalNotes = [1.0, 1.125, 1.25, 1.333, 1.5, 1.667, 1.875]; // C, D, E, F, G, A, B ratios
    const noteIndex = healthState % musicalNotes.length;
    const octaveMultiplier = 1 + Math.floor(healthState / musicalNotes.length); // Higher octaves for more damage
    const melodyMultiplier = musicalNotes[noteIndex] * octaveMultiplier;
    
    // Apply melody multiplier to base frequency
    const frequency = baseFreq * melodyMultiplier;

    // Calculate buzz repeat rate (gets faster with more hits)
    // hitsTaken: 0 = first hit, 1 = second hit, etc.
    // Repeat interval decreases: baseInterval / (1 + hitsTaken * speedMultiplier)
    const baseInterval = 200; // Base repeat interval in milliseconds
    const speedMultiplier = 0.4; // How much faster it gets per hit
    const repeatInterval = baseInterval / (1 + hitsTaken * speedMultiplier);

    // Check if we already have a buzz sound for this enemy
    const existingBuzz = this.activeBuzzSounds.get(enemyId);
    
    if (existingBuzz) {
      // Update existing buzz: change frequency and repeat rate
      const now = this.audioContext.currentTime;
      existingBuzz.oscillator.frequency.setValueAtTime(frequency, now);
      
      // Clear old interval and create new one with updated speed
      clearInterval(existingBuzz.intervalId);
      
      // Create new interval with updated repeat rate
      const intervalId = window.setInterval(() => {
        this.playBuzzPulse(enemyType, baseFreq, waveType, hitsTaken, currentHealth, maxHealth);
      }, repeatInterval);
      
      existingBuzz.intervalId = intervalId;
    } else {
      // Start new continuous buzz sound
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      const now = this.audioContext.currentTime;

      oscillator.type = waveType;
      oscillator.frequency.setValueAtTime(frequency, now);
      
      // Continuous volume (sustained) - very quiet for multiple enemies
      // Haters and diamonds are half as quiet (enemy types 1 and 3)
      let sustainedVolume = 0.04;
      if (enemyType === 1) sustainedVolume = 0.02; // Diamonds at 50% volume
      if (enemyType === 3) sustainedVolume = 0.02; // Haters at 50% volume
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(this.masterVolume * sustainedVolume, now + 0.01);
      gainNode.gain.setValueAtTime(this.masterVolume * sustainedVolume, now + 0.02);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start(now);
      
      // Play initial buzz pulse
      this.playBuzzPulse(enemyType, baseFreq, waveType, hitsTaken, currentHealth, maxHealth);
      
      // Set up repeating buzz pulses (gets faster with each hit)
      const intervalId = window.setInterval(() => {
        this.playBuzzPulse(enemyType, baseFreq, waveType, hitsTaken, currentHealth, maxHealth);
      }, repeatInterval);
      
      // Store the active buzz sound
      this.activeBuzzSounds.set(enemyId, {
        oscillator,
        gainNode,
        intervalId
      });
    }
  }

  /**
   * Play a single buzz pulse (used for repeating effect)
   * Sweeps from low to high pitch, with range widening based on hits
   * Uses melody system: different octaves based on health state create musical patterns
   * Diamonds have special treatment: start very low (buzzer-like) and sweep dramatically higher
   */
  private playBuzzPulse(enemyType: number, baseFrequency: number, waveType: OscillatorType, hitsTaken: number, currentHealth: number, maxHealth: number): void {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const now = this.audioContext.currentTime;

    oscillator.type = waveType;
    
    // MELODY SYSTEM: Calculate octave multiplier based on health state
    const healthRatio = currentHealth / maxHealth;
    const healthState = Math.floor((1 - healthRatio) * maxHealth);
    const musicalNotes = [1.0, 1.125, 1.25, 1.333, 1.5, 1.667, 1.875]; // C, D, E, F, G, A, B
    const noteIndex = healthState % musicalNotes.length;
    const octaveMultiplier = 1 + Math.floor(healthState / musicalNotes.length);
    const melodyMultiplier = musicalNotes[noteIndex] * octaveMultiplier;
    
    // Apply melody to base frequency
    const melodicBaseFreq = baseFrequency * melodyMultiplier;
    
    // Special handling for diamonds: start very low (buzzer-like) and sweep dramatically higher
    let startFreq: number;
    let endFreq: number;
    
    if (enemyType === 1) { // DIAMOND
      // Diamonds: Start very low (buzzer-like), sweep dramatically to high
      const buzzerStart = 80 + (hitsTaken * 10); // Very low, starts around 80-120Hz (buzzer range)
      const highEnd = melodicBaseFreq + (hitsTaken * 100) + 200; // Much higher end frequency
      startFreq = buzzerStart;
      endFreq = highEnd;
    } else {
      // Other enemies: Standard sweep with melody applied
      const sweepRange = 100 + (hitsTaken * 80); // Range gets wider with each hit
      startFreq = melodicBaseFreq - (sweepRange * 0.3); // Start lower
      endFreq = melodicBaseFreq + (sweepRange * 0.7) + (hitsTaken * 50); // End higher, increases with hits
    }
    
    // Create pitch sweep from low to high
    const buzzDuration = 0.1; // Short pulse duration
    const sweepSteps = 8; // Number of frequency steps for smooth sweep
    
    // Sweep from low to high pitch
    for (let i = 0; i <= sweepSteps; i++) {
      const t = (i / sweepSteps) * buzzDuration;
      // Linear sweep from start to end frequency
      const currentFreq = startFreq + (endFreq - startFreq) * (i / sweepSteps);
      oscillator.frequency.setValueAtTime(currentFreq, now + t);
    }

    // Quick volume envelope - very quiet for multiple enemies
    // Haters and diamonds are half as quiet (enemy types 1 and 3)
    let baseVolume = 0.05;
    if (enemyType === 1) baseVolume = 0.025; // Diamonds at 50% volume
    if (enemyType === 3) baseVolume = 0.025; // Haters at 50% volume
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(this.masterVolume * baseVolume, now + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + buzzDuration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + buzzDuration);
  }

  /**
   * Stop enemy buzz sound (called when enemy is destroyed)
   * @param enemyId Unique identifier for the enemy
   */
  stopEnemyBuzz(enemyId: string): void {
    const existingBuzz = this.activeBuzzSounds.get(enemyId);
    if (existingBuzz) {
      // Stop oscillator
      try {
        existingBuzz.oscillator.stop();
      } catch (e) {
        // Oscillator may already be stopped
      }
      
      // Clear interval
      clearInterval(existingBuzz.intervalId);
      
      // Remove from map
      this.activeBuzzSounds.delete(enemyId);
    }
  }

  /**
   * Stop all active enemy buzz sounds (called when round completes or resets)
   */
  stopAllEnemyBuzzes(): void {
    for (const buzz of this.activeBuzzSounds.values()) {
      // Stop oscillator
      try {
        buzz.oscillator.stop();
      } catch (e) {
        // Oscillator may already be stopped
      }
      
      // Clear interval
      clearInterval(buzz.intervalId);
    }
    
    // Clear all entries
    this.activeBuzzSounds.clear();
  }

  /**
   * Play enemy hit buzz sound - gets faster with each hit (legacy method, kept for compatibility)
   * @deprecated Use startOrUpdateEnemyBuzz instead for continuous buzzing
   */
  playEnemyHitBuzz(enemyType: number, hitsTaken: number, maxHealth: number): void {
    // This method is kept for backward compatibility but now just calls the new method
    // In practice, enemies should use startOrUpdateEnemyBuzz with a unique ID
    // Estimate current health from hits taken
    const currentHealth = Math.max(1, maxHealth - hitsTaken);
    this.startOrUpdateEnemyBuzz(`temp_${Date.now()}`, enemyType, hitsTaken, currentHealth, maxHealth);
  }
}
