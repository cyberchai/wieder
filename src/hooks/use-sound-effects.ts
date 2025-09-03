import useSound from 'use-sound';
import { useCallback, useRef } from 'react';

export const useSoundEffects = () => {
  const [playHoverSound, { stop: stopHoverSound }] = useSound('/sounds/rising-pops.mp3', { 
    volume: 0.5,
    preload: true,
    // Disable autoplay to avoid AudioContext issues
    autoplay: false
  });

  const [playNavigationSound] = useSound('/sounds/rising-pops.mp3', { 
    volume: 0.5,
    preload: true,
    // Disable autoplay to avoid AudioContext issues
    autoplay: false
  });

  const [playCorrectSound] = useSound('/sounds/correct.mp3', { 
    volume: 0.6,
    preload: true,
    // Disable autoplay to avoid AudioContext issues
    autoplay: false
  });

  const [playToggleOnSound] = useSound('/sounds/taptoggle-on.mp3', { 
    volume: 0.4,
    preload: true,
    // Disable autoplay to avoid AudioContext issues
    autoplay: false
  });

  const [playToggleOffSound] = useSound('/sounds/taptoggle-off.mp3', { 
    volume: 0.4,
    preload: true,
    // Disable autoplay to avoid AudioContext issues
    autoplay: false
  });

  const hasUserInteracted = useRef(false);

  const handleHoverStart = useCallback(() => {
    // Only play sound if user has interacted with the page
    if (hasUserInteracted.current) {
      playHoverSound();
    }
  }, [playHoverSound]);

  const handleHoverEnd = useCallback(() => {
    if (hasUserInteracted.current) {
      stopHoverSound();
    }
  }, [stopHoverSound]);

  const handleCorrectAnswer = useCallback(() => {
    // Only play sound if user has interacted with the page
    if (hasUserInteracted.current) {
      playCorrectSound();
    }
  }, [playCorrectSound]);

  const handleToggleOn = useCallback(() => {
    // Only play sound if user has interacted with the page
    if (hasUserInteracted.current) {
      playToggleOnSound();
    }
  }, [playToggleOnSound]);

  const handleToggleOff = useCallback(() => {
    // Only play sound if user has interacted with the page
    if (hasUserInteracted.current) {
      playToggleOffSound();
    }
  }, [playToggleOffSound]);

  const handleNavigationClick = useCallback(() => {
    // Only play sound if user has interacted with the page
    if (hasUserInteracted.current) {
      playNavigationSound();
    }
  }, [playNavigationSound]);

  // Function to enable sounds after first user interaction
  const enableSounds = useCallback(() => {
    hasUserInteracted.current = true;
  }, []);

  return {
    handleHoverStart,
    handleHoverEnd,
    handleCorrectAnswer,
    handleToggleOn,
    handleToggleOff,
    handleNavigationClick,
    enableSounds
  };
};
