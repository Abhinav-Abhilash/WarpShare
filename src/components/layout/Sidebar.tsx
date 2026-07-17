import React, { useState, useEffect } from 'react';
import { Home, ClipboardList, Trees, Settings, Sun, Moon } from 'lucide-react';

export type TabId = 'broadcast' | 'clipboard' | 'tree' | 'settings';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check initial preference
    if (document.documentElement.classList.contains('dark')) {
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    setIsDarkMode(!isDarkMode);
  };

  const navItems = [
    { id: 'broadcast', name: 'Room Broadcast', icon: Home },
    { id: 'clipboard', name: 'LAN Clipboard', icon: ClipboardList },
    { id: 'tree', name: 'Knowledge Tree', icon: Trees },
    { id: 'settings', name: 'Settings', icon: Settings },
  ] as const;

  return (
    <aside className="flex flex-col w-64 h-full bg-[var(--background)] border-r border-[var(--border)] shrink-0">
      {/* Brand Header */}
      <div className="flex items-center h-16 px-6 border-b border-[var(--border)]/50">
        <h1 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">WarpShare</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex items-center gap-3 px-3 py-2 w-full text-sm font-medium rounded-[10px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#18181B] duration-200 ${
              activeTab === item.id
                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-[var(--foreground)]'
            }`}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.name}
          </button>
        ))}
      </nav>

      {/* Footer / Theme Toggle */}
      <div className="p-4 border-t border-[var(--border)]/50">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium rounded-[10px] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#18181B]"
        >
          <span className="flex items-center gap-3">
            {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            {isDarkMode ? 'Dark Mode' : 'Light Mode'}
          </span>
          <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ${isDarkMode ? 'bg-indigo-500' : 'bg-zinc-200'}`}>
            <div className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </button>
      </div>
    </aside>
  );
}
