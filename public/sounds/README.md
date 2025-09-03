# Sound Effects Setup

## Adding Your Sound Files

To complete the sound effects setup, you need to replace the placeholder sound files with actual sound files.

### Recommended Sound Sources:
- [Freesound.org](https://freesound.org/) - Free sound effects
- [Zapsplat](https://zapsplat.com/) - Professional sound effects (free with account)
- [Mixkit](https://mixkit.co/free-sound-effects/) - Free sound effects
- [Adobe Audition](https://www.adobe.com/products/audition.html) - Create your own

### Sound Requirements:
- **Format**: MP3, WAV, or OGG
- **Duration**: 0.5-2 seconds (short and pleasant)
- **Volume**: Should be moderate (not too loud or quiet)

### Required Sound Files:

#### 1. `rising-pops.mp3` - Hover Sound
- **Type**: "Rising pops", "hover", "click", or similar UI sound
- **Usage**: Plays when hovering over Practice, Game, or Test buttons

#### 2. `correct.mp3` - Correct Answer Sound
- **Type**: "Correct", "success", "ding", or similar positive feedback sound
- **Usage**: Plays when user gets a correct answer in practice or game mode

#### 3. `taptoggle-on.mp3` - Toggle On Sound
- **Type**: "Toggle on", "switch on", "click", or similar UI sound
- **Usage**: Plays when user turns on any toggle switch

#### 4. `taptoggle-off.mp3` - Toggle Off Sound
- **Type**: "Toggle off", "switch off", "click", or similar UI sound
- **Usage**: Plays when user turns off any toggle switch

#### 5. `taptoggle-on.mp3` - Game Over Sound
- **Type**: "Toggle on", "switch on", "click", or similar UI sound
- **Usage**: Plays when the game ends (success or failure)

#### 6. `rising-pops.mp3` - Dashboard Navigation Sound
- **Type**: "Rising pops", "hover", "click", or similar UI sound
- **Usage**: Plays when hovering over theme toggles and clicking tab navigation

### How to Add:
1. Download or create your sound files
2. Rename them to `rising-pops.mp3`, `correct.mp3`, `taptoggle-on.mp3`, and `taptoggle-off.mp3`
3. Replace the placeholder files in this directory
4. Test by:
   - Hovering over the Practice, Game, or Test buttons in the study page
   - Getting a correct answer in practice mode
   - Getting a correct answer in game mode
   - Toggling switches in study and practice modes

### Testing:
1. Start the development server: `npm run dev`
2. Navigate to any flashcard set's study page
3. **Test hover sounds**: Hover over the Practice, Game, or Test buttons
4. **Test toggle sounds**: Toggle the "swap" and "progress" switches in study mode
5. **Test correct answer sounds**: 
   - Go to practice mode and get a correct answer
   - Go to game mode and type a correct answer
6. **Test practice toggle sounds**: In practice mode, toggle "swap", "lenient mode", and "autoplay" switches
7. **Test game over sound**: In game mode, either complete the set or lose all lives
8. **Test dashboard sounds**: 
   - Hover over the theme switcher button
   - Hover over theme options in the dropdown
   - Click between "My Sets", "Group Sets", and "Public Sets" tabs
9. You should hear the appropriate sound effects play

### Troubleshooting:
- If no sound plays, check the browser console for errors
- Ensure the files are in the correct location: `public/sounds/rising-pops.mp3`, `public/sounds/correct.mp3`, `public/sounds/taptoggle-on.mp3`, and `public/sounds/taptoggle-off.mp3`
- Make sure the file format is supported (MP3, WAV, OGG)
- Check that your browser allows autoplay of audio

### AudioContext Issue (Fixed):
Modern browsers require user interaction before playing audio to prevent unwanted autoplay. The sound effects are now properly configured to:
1. **Wait for user interaction**: Sounds won't play until the user clicks a button or interacts with the page
2. **Enable after first click**: Once you click any button (flip card, next, previous, etc.), sounds will be enabled
3. **No console errors**: The AudioContext error has been resolved

**How it works**: The first time you interact with any button, input field, toggle switch, or navigation element, it enables sound effects. After that:
- Hovering over the Practice, Game, or Test buttons will play the hover sound
- Getting a correct answer in practice or game mode will play the correct answer sound
- Toggling switches on will play the toggle on sound
- Toggling switches off will play the toggle off sound
- Game ending (success or failure) will play the toggle on sound
- Hovering over theme toggles will play the hover sound
- Clicking tab navigation (My Sets, Group Sets, Public Sets) will play the hover sound
