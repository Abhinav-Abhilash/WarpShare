import React from 'react';
import { Dot, Sprout, Leaf, TreeDeciduous, TreePine, Trees, Sparkles, Calendar } from 'lucide-react';
import { useKnowledgeTree } from '../../hooks/useKnowledgeTree';

export function KnowledgeTree() {
  const { state, currentStage, nextStage, isLoaded } = useKnowledgeTree();

  if (!isLoaded) return null;

  // Generate last 30 days
  const today = new Date();
  const last30Days = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });

  const renderIcon = () => {
    switch (currentStage.icon) {
      case 'Dot':
        return <Dot className="w-12 h-12 text-zinc-400 transition-opacity duration-200 ease-out" />;
      case 'Sprout':
        return <Sprout className="w-12 h-12 text-emerald-500 transition-all duration-200 ease-out transform translate-y-0" />;
      case 'Plant':
        // Fallback to Leaf if Plant doesn't exist in installed lucide version
        return <Leaf className="w-12 h-12 text-emerald-500 opacity-80" />;
      case 'TreeDeciduous':
        return <TreeDeciduous className="w-12 h-12 text-emerald-600 dark:text-emerald-500" />;
      case 'TreePine':
        return <TreePine className="w-12 h-12 text-emerald-500" />;
      case 'Tree':
      case 'Sparkles':
        return (
          <div className="relative transition-all duration-200 ease-out transform translate-y-0">
            <Trees className="w-12 h-12 text-emerald-500" />
            <Sparkles className="w-6 h-6 text-indigo-500 absolute -top-2 -right-2 transition-opacity duration-200 ease-out" />
          </div>
        );
      default:
        return <Dot className="w-12 h-12 text-zinc-400" />;
    }
  };

  const currentXpInStage = state.xp - currentStage.minXp;
  const xpNeededForNext = nextStage ? (nextStage.minXp - currentStage.minXp) : 0;
  const progressPercent = nextStage ? (currentXpInStage / xpNeededForNext) * 100 : 100;

  return (
    <div className="flex flex-col w-full h-full max-w-4xl">
      {/* Header */}
      <header className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">Knowledge Tree</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          A calm visual representation of your study consistency and local collaboration.
        </p>
      </header>

      {/* Active Canopy Visualizer */}
      <div className="flex flex-col items-center justify-center p-8 mb-8 bg-white dark:bg-[#18181B] border border-[var(--border)] rounded-[14px] shadow-sm">
        <div className="flex items-center justify-center w-[120px] h-[120px] bg-zinc-50 dark:bg-zinc-900 rounded-full mb-6 border border-[var(--border)]/50 shadow-inner">
          {renderIcon()}
        </div>
        
        <div className="flex flex-col items-center w-full max-w-md">
          <div className="flex justify-between w-full mb-2 text-sm font-medium text-[var(--foreground)]">
            <span>Stage {currentStage.stage}: {currentStage.name}</span>
            <span className="text-zinc-500 dark:text-zinc-400">
              {nextStage ? `${currentXpInStage} / ${xpNeededForNext} XP to next growth stage` : 'Max Level Reached'}
            </span>
          </div>
          <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Collaboration Heatmap */}
      <div className="flex flex-col p-6 bg-white dark:bg-[#18181B] border border-[var(--border)] rounded-[14px] shadow-sm">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Last 30 Days of Activity</h3>
        
        <div className="grid grid-cols-10 sm:grid-cols-15 gap-2 w-max">
          {last30Days.map((dateStr) => {
            const dayData = state.history[dateStr] || { filesShared: 0, snippetsBroadcasted: 0 };
            const totalActivity = dayData.filesShared + dayData.snippetsBroadcasted;
            
            // Determine color intensity based on activity
            let bgClass = "bg-zinc-100 dark:bg-zinc-800/50";
            if (totalActivity > 0 && totalActivity <= 2) bgClass = "bg-emerald-200 dark:bg-emerald-900/40";
            else if (totalActivity > 2 && totalActivity <= 5) bgClass = "bg-emerald-300 dark:bg-emerald-700/60";
            else if (totalActivity > 5 && totalActivity <= 10) bgClass = "bg-emerald-400 dark:bg-emerald-600/80";
            else if (totalActivity > 10) bgClass = "bg-emerald-500 dark:bg-emerald-500";

            return (
              <div key={dateStr} className="relative group">
                <div className={`w-[22px] h-[22px] rounded-[4px] transition-colors duration-200 cursor-pointer ${bgClass}`} />
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-10 w-max max-w-[220px]">
                  <div className="px-3 py-2 text-xs text-zinc-200 bg-zinc-900 rounded-lg shadow-lg whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-medium mb-1 border-b border-zinc-700 pb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="text-zinc-400 pt-1">
                      {dayData.filesShared} File{dayData.filesShared !== 1 ? 's' : ''} Shared
                    </div>
                    <div className="text-zinc-400">
                      {dayData.snippetsBroadcasted} Snippet{dayData.snippetsBroadcasted !== 1 ? 's' : ''} Broadcasted
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-zinc-900 rotate-45 -mt-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
