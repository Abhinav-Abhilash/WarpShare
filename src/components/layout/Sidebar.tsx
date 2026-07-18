import React, { useState, useEffect } from 'react';
import { Home, ClipboardList, Trees, Settings, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

export type TabId = 'broadcast' | 'clipboard' | 'tree' | 'settings';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted && theme === 'dark';

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const savedWidth = localStorage.getItem('sidebarWidth');
    if (savedWidth) {
      setSidebarWidth(parseInt(savedWidth, 10));
    }
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      let newWidth = e.clientX;
      if (newWidth < 200) newWidth = 200;
      if (newWidth > 600) newWidth = 600;
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      localStorage.setItem('sidebarWidth', sidebarWidth.toString());
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, sidebarWidth]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const navItems = [
    { id: 'broadcast', name: 'Room Broadcast', icon: Home },
    { id: 'clipboard', name: 'LAN Clipboard', icon: ClipboardList },
    { id: 'tree', name: 'Knowledge Tree', icon: Trees },
    { id: 'settings', name: 'Settings', icon: Settings },
  ] as const;

  return (
    <aside 
      className={`relative flex flex-col md:flex-col w-full md:w-[var(--sidebar-width)] h-auto md:h-full bg-[var(--background)] border-b md:border-b-0 border-[var(--border)] shrink-0 z-20 ${isResizing ? 'select-none' : ''}`}
      style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}
    >
      {/* Resizer Handle */}
      <div 
        className="hidden md:block absolute right-0 top-0 bottom-0 w-1 hover:w-1.5 cursor-col-resize bg-[var(--border)] hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors z-30"
        onMouseDown={handleMouseDown}
      />

      {/* Brand Header */}
      <div className="flex items-center justify-between md:justify-start h-14 md:h-16 px-4 md:px-6 border-b border-[var(--border)]/50">
        <h1 className="text-base md:text-lg font-semibold tracking-tight text-[var(--foreground)]">WarpShare</h1>
        
        {/* Mobile Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="md:hidden flex items-center justify-center p-2 rounded-full text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-row md:flex-col flex-1 px-2 md:px-4 py-2 md:py-6 gap-1 overflow-x-auto md:overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex items-center justify-center md:justify-start gap-2 md:gap-3 px-3 py-2 md:w-full text-sm font-medium rounded-[10px] transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#18181B] duration-200 ${
              activeTab === item.id
                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-[var(--foreground)]'
            }`}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">{item.name}</span>
          </button>
        ))}
      </nav>

      {/* Footer / Theme Toggle (Desktop) */}
      <div className="hidden md:block p-4 border-t border-[var(--border)]/50">
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
