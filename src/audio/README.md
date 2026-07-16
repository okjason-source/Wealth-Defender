# Audio System - Base64 Encoding Guide

## How to Add Your Own Audio Files

The audio system supports base64-encoded audio files. To add your own sounds:

### Step 1: Prepare Your Audio Files

1. Create or find audio files (MP3, WAV, or OGG format recommended)
2. Keep them short (0.1-0.5 seconds for sound effects, 1-3 seconds for jingles)
3. Use 8-bit/chiptune style sounds to match the game aesthetic

### Step 2: Convert to Base64

#### Option A: Using JavaScript (Browser Console)

```javascript
// Load your audio file
async function audioToBase64(file) {
  const response = await fetch(file);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Usage
const base64 = await audioToBase64('path/to/your/sound.mp3');
console.log(base64); // Copy this string
```

#### Option B: Using Node.js

```javascript
const fs = require('fs');
const audioFile = fs.readFileSync('sound.mp3');
const base64 = audioFile.toString('base64');
const dataUri = `data:audio/mp3;base64,${base64}`;
console.log(dataUri);
```

#### Option C: Online Tools

- Use online base64 encoders (search "base64 audio encoder")
- Upload your audio file and copy the base64 string

### Step 3: Add to Audio Manager

1. Open `src/audio/audioManager.ts`
2. Find the `getBase64Audio()` method
3. Replace the `null` return value with your base64 string:

```typescript
case SoundType.ENEMY_DESTROYED:
  return 'data:audio/mp3;base64,YOUR_BASE64_STRING_HERE';
```

### Step 4: Test

The audio system will automatically use your encoded audio. If the base64 string is invalid, it will fall back to procedural sounds.

## Current Implementation

The system currently uses **procedural sound generation** as a fallback, which creates 8-bit style sounds programmatically. These work immediately without any audio files.

To use your own audio files, simply replace the `null` values in `getBase64Audio()` with your base64-encoded audio strings.

## Sound Types

- `ENEMY_DESTROYED` - Played when enemy is destroyed
- `PLAYER_HIT` - Played when player takes damage
- `ROUND_START` - Played when round begins
- `ROUND_COMPLETE` - Played when round is completed
- `LASER_FIRE` - Played when laser is fired
- `GAME_OVER` - Played when game ends
- `VICTORY` - Played when player wins
- `BONUS_ROUND` - Played when entering bonus round
