import useSound from 'use-sound';
import { useCallback, useRef } from 'react';
import { useSettings } from './use-settings';

// Extend Window to include Safari's prefixed AudioContext constructor
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export const useSoundEffects = () => {
  const { settings } = useSettings();
  
  // Mobile-specific audio options for better compatibility
  const audioOptions = {
    volume: 0.6,
    preload: true,
    autoplay: false,
    html5: true, // Use HTML5 audio for better mobile support
    format: ['mp3'], // Ensure MP3 format is used
  };


  const [playHoverSound, { stop: stopHoverSound }] = useSound('/sounds/rising-pops.mp3', { 
    ...audioOptions,
    volume: 0.5,
  });

  const [playNavigationSound] = useSound('/sounds/rising-pops.mp3', { 
    ...audioOptions,
    volume: 0.5,
  });

  const [playCorrectSound] = useSound('/sounds/correct.mp3', audioOptions);

  const [playToggleOnSound] = useSound('/sounds/taptoggle-on.mp3', { 
    ...audioOptions,
    volume: 0.4,
  });

  const [playToggleOffSound] = useSound('/sounds/taptoggle-off.mp3', { 
    ...audioOptions,
    volume: 0.4,
  });

  const [playIncorrectSound] = useSound('/sounds/incorrectans.mp3', audioOptions);

  const [playGameEndedSound] = useSound('/sounds/gameended.mp3', audioOptions);

  const [playHeartLostSound] = useSound('/sounds/heartlost.mp3', audioOptions);

  const hasUserInteracted = useRef(false);

  const handleHoverStart = useCallback(() => {
    // Only play sound if user has interacted with the page and sound is enabled
    if (hasUserInteracted.current && settings.soundEnabled) {
      playHoverSound();
    }
  }, [playHoverSound, settings.soundEnabled]);

  const handleHoverEnd = useCallback(() => {
    if (hasUserInteracted.current && settings.soundEnabled) {
      stopHoverSound();
    }
  }, [stopHoverSound, settings.soundEnabled]);

  const handleCorrectAnswer = useCallback(() => {
    // Only play sound if user has interacted with the page and sound is enabled
    if (hasUserInteracted.current && settings.soundEnabled) {
      try {
        playCorrectSound();
      } catch (error) {
        console.warn('Failed to play correct sound:', error);
      }
    }
  }, [playCorrectSound, settings.soundEnabled]);

  const handleToggleOn = useCallback(() => {
    // Only play sound if user has interacted with the page and sound is enabled
    if (hasUserInteracted.current && settings.soundEnabled) {
      playToggleOnSound();
    }
  }, [playToggleOnSound, settings.soundEnabled]);

  const handleToggleOff = useCallback(() => {
    // Only play sound if user has interacted with the page and sound is enabled
    if (hasUserInteracted.current && settings.soundEnabled) {
      playToggleOffSound();
    }
  }, [playToggleOffSound, settings.soundEnabled]);

  const handleIncorrectAnswer = useCallback(() => {
    // Only play sound if user has interacted with the page and sound is enabled
    if (hasUserInteracted.current && settings.soundEnabled) {
      try {
        playIncorrectSound();
      } catch (error) {
        console.warn('Failed to play incorrect sound:', error);
      }
    }
  }, [playIncorrectSound, settings.soundEnabled]);

  const handleGameEnded = useCallback(() => {
    // Only play sound if user has interacted with the page and sound is enabled
    if (hasUserInteracted.current && settings.soundEnabled) {
      try {
        playGameEndedSound();
      } catch (error) {
        console.warn('Failed to play game ended sound:', error);
      }
    }
  }, [playGameEndedSound, settings.soundEnabled]);

  const handleHeartLost = useCallback(() => {
    // Only play sound if user has interacted with the page and sound is enabled
    if (hasUserInteracted.current && settings.soundEnabled) {
      try {
        playHeartLostSound();
      } catch (error) {
        console.warn('Failed to play heart lost sound:', error);
      }
    }
  }, [playHeartLostSound, settings.soundEnabled]);

  const handleNavigationClick = useCallback(() => {
    // Only play sound if user has interacted with the page and sound is enabled
    if (hasUserInteracted.current && settings.soundEnabled) {
      playNavigationSound();
    }
  }, [playNavigationSound, settings.soundEnabled]);

  // Function to enable sounds after first user interaction
  // Function to enable sounds after first user interaction
const enableSounds = useCallback(() => {
  hasUserInteracted.current = true;

  if (typeof window !== 'undefined') {
    // Prefer standard AudioContext, fall back to webkit-prefixed
    const AudioContextCtor = window.AudioContext ?? window.webkitAudioContext;

    if (AudioContextCtor) {
      try {
        const audioContext = new AudioContextCtor();
        if (audioContext.state === 'suspended') {
          void audioContext.resume().catch(console.warn);
        }
      } catch (error) {
        console.warn('Failed to unlock AudioContext:', error);
      }
    }
  }
}, []);


  return {
    handleHoverStart,
    handleHoverEnd,
    handleCorrectAnswer,
    handleToggleOn,
    handleToggleOff,
    handleIncorrectAnswer,
    handleGameEnded,
    handleHeartLost,
    handleNavigationClick,
    enableSounds
  };
};
