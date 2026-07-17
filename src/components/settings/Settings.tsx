import React, { useState } from 'react';
import { Laptop, Smartphone, Tablet, Monitor, RotateCcw, AlertTriangle } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { PeerDeviceType } from '../../lib/types/network';

const DEVICE_TYPES: { type: PeerDeviceType; label: string; icon: React.ElementType }[] = [
  { type: 'laptop', label: 'Laptop', icon: Laptop },
  { type: 'smartphone', label: 'Phone', icon: Smartphone },
  { type: 'tablet', label: 'Tablet', icon: Tablet },
  { type: 'desktop', label: 'Desktop', icon: Monitor },
];

export function Settings() {
  const { settings, updateSettings, isLoaded } = useSettings();
  const [resetConfirm, setResetConfirm] = useState(false);

  if (!isLoaded) return null;

  const handleResetTree = () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }
    localStorage.removeItem('warpshare_knowledge_tree');
    window.location.reload(); // Quick way to re-hydrate the entire app state
  };

  return (
    <div className="flex flex-col w-full h-full max-w-4xl">
      {/* Header */}
      <header className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">Settings</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Customize your local network identity and manage your data.
        </p>
      </header>

      {/* Settings Form */}
      <div className="flex flex-col p-6 bg-white dark:bg-[#18181B] border border-[var(--border)] rounded-[12px] shadow-sm mb-8">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Device Identity</h3>
        
        <div className="flex flex-col gap-6">
          {/* Display Name */}
          <div className="flex flex-col gap-2">
            <label htmlFor="displayName" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={settings.displayName}
              onChange={(e) => updateSettings({ displayName: e.target.value })}
              placeholder="e.g. Alex's MacBook Pro"
              className="w-full max-w-md px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 border border-[var(--border)] rounded-[10px] text-[var(--foreground)] focus:outline-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#18181B]"
            />
          </div>

          {/* Device Type */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Device Icon
            </label>
            <div className="flex flex-wrap gap-3">
              {DEVICE_TYPES.map((device) => (
                <button
                  key={device.type}
                  onClick={() => updateSettings({ deviceType: device.type })}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-[10px] border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#18181B] ${
                    settings.deviceType === device.type
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400'
                      : 'bg-zinc-50 dark:bg-zinc-900/50 border-[var(--border)] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <device.icon className="w-4 h-4" />
                  {device.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="flex flex-col p-6 bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 rounded-[12px]">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
          <AlertTriangle className="w-4 h-4" />
          Danger Zone
        </h3>
        <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-4">
          Resetting your Knowledge Tree will permanently delete all local XP and collaboration history.
        </p>
        
        <div>
          <button
            onClick={handleResetTree}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[10px] border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#18181B] ${
              resetConfirm
                ? 'bg-red-600 border-red-600 text-white hover:bg-red-700'
                : 'bg-transparent border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            {resetConfirm ? 'Click again to confirm reset' : 'Reset Knowledge Tree Progress'}
          </button>
        </div>
      </div>
    </div>
  );
}
