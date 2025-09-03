# Rain Drops Component

A beautiful animated rain drops effect that creates an immersive full-screen rain experience in the falling words game.

## Features

- **Score-based animation**: Rain drops appear starting at score 10, then increment every 20 points (4x intensity)
- **Full-screen coverage**: Drops fall across the entire screen width for immersive effect
- **Header-based spawning**: Rain starts from the top/header area and falls naturally
- **Trail effects**: Each drop has a subtle trail that fades out
- **Dynamic colors**: Six different blue shades for visual variety
- **Wind effects**: Subtle horizontal drift for realistic rain movement
- **Performance optimized**: Uses requestAnimationFrame for smooth animation

## How it works

1. **Score tracking**: Monitors the game score and calculates how many drops to show
2. **Drop generation**: Creates new drops starting at score 10, then every 20 points (with 4x intensity multiplier)
3. **Full-screen spawning**: Drops spawn across the entire screen width from the header area
4. **Animation loop**: Updates drop positions, applies wind effects, and manages trails using requestAnimationFrame
5. **Cleanup**: Removes drops that fall off screen and clears all drops when game stops

## Props

- `score: number` - Current game score
- `isPlaying: boolean` - Whether the game is currently active
- `headerHeight: number` - Height of the header area where rain drops start

## Usage

```tsx
<RainDrops 
  score={score} 
  isPlaying={gameState === "playing"} 
  headerHeight={72}
/>
```

## Visual effects

- **Main drops**: Elongated blue drops with subtle glow effects
- **Trails**: Fading trail behind each drop for dynamic movement
- **Randomization**: Varied sizes, speeds, and colors for natural appearance
- **Wind effects**: Subtle horizontal drift for realistic rain movement
- **Full-screen coverage**: Rain covers the entire screen for immersive experience

## Performance considerations

- Drops are automatically cleaned up when they fall off screen
- Trail length is limited to 3 positions per drop
- Animation only runs when game is active
- Uses efficient state updates with React hooks
