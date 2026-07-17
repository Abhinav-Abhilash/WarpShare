import { useState, useEffect } from 'react';
import { PeerDeviceType } from '../lib/types/network';

export interface SettingsState {
  displayName: string;
  deviceType: PeerDeviceType;
}

const DEFAULT_STATE: SettingsState = {
  displayName: `Peer-${Math.floor(Math.random() * 10000)}`,
  deviceType: 'laptop',
};

export function useSettings() {
  const [state, setState] = useState<SettingsState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('warpshare_settings');
    if (saved) {
      try {
        setState(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse settings state');
      }
    }
    setIsLoaded(true);
  }, []);

  const saveState = (newState: SettingsState) => {
    setState(newState);
    localStorage.setItem('warpshare_settings', JSON.stringify(newState));
  };

  const updateSettings = (updates: Partial<SettingsState>) => {
    saveState({ ...state, ...updates });
  };

  return {
    settings: state,
    isLoaded,
    updateSettings,
  };
}
