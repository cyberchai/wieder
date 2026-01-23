import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { getUserProfile, updateUserSettings } from '@/services/users';

export type FontFamily = 'poppins' | 'shantell' | 'dyslexia';

export interface UserSettings {
  soundEnabled: boolean;
  showNameOnPublicSets: boolean;
  fontFamily?: FontFamily;
}

const defaultSettings: UserSettings = {
  soundEnabled: true,
  showNameOnPublicSets: true,
  fontFamily: 'poppins',
};

export const useSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Load settings from localStorage first (for immediate UI response)
  // Then sync with Firestore if user is logged in
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load from localStorage first
        const localSettings = localStorage.getItem('userSettings');
        if (localSettings) {
          const parsedSettings = JSON.parse(localSettings);
          setSettings({ ...defaultSettings, ...parsedSettings });
        }

        // If user is logged in, try to load from Firestore
        if (user) {
          const userProfile = await getUserProfile(user.uid);
          if (userProfile?.settings) {
            const firestoreSettings = { ...defaultSettings, ...userProfile.settings };
            setSettings(firestoreSettings);
            // Update localStorage with Firestore settings
            localStorage.setItem('userSettings', JSON.stringify(firestoreSettings));
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  const updateSetting = useCallback(async (key: keyof UserSettings, value: boolean | FontFamily) => {
    const previousSettings = settings;
    const newSettings = { ...settings, [key]: value };
    
    // Update local state immediately
    setSettings(newSettings);
    
    // Update localStorage immediately
    localStorage.setItem('userSettings', JSON.stringify(newSettings));

    // Update Firestore if user is logged in
    if (user) {
      try {
        await updateUserSettings(user.uid, newSettings);
      } catch (error) {
        console.error('Failed to update settings in Firestore:', error);
        // Revert local changes if Firestore update fails
        setSettings(previousSettings);
        localStorage.setItem('userSettings', JSON.stringify(previousSettings));
      }
    }
  }, [settings, user]);

  const toggleSound = useCallback(() => {
    updateSetting('soundEnabled', !settings.soundEnabled);
  }, [settings.soundEnabled, updateSetting]);

  const toggleShowNameOnPublicSets = useCallback(() => {
    updateSetting('showNameOnPublicSets', !settings.showNameOnPublicSets);
  }, [settings.showNameOnPublicSets, updateSetting]);

  const toggleFontFamily = useCallback(() => {
    // Cycle through fonts: poppins -> shantell -> dyslexia -> poppins
    const fontCycle: FontFamily[] = ['poppins', 'shantell', 'dyslexia'];
    const currentIndex = fontCycle.indexOf(settings.fontFamily || 'poppins');
    const nextIndex = (currentIndex + 1) % fontCycle.length;
    updateSetting('fontFamily', fontCycle[nextIndex]);
  }, [settings.fontFamily, updateSetting]);

  const setFontFamily = useCallback((font: FontFamily) => {
    updateSetting('fontFamily', font);
  }, [updateSetting]);

  return {
    settings,
    loading,
    toggleSound,
    toggleShowNameOnPublicSets,
    toggleFontFamily,
    setFontFamily,
    updateSetting,
  };
};
