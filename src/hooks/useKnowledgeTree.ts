import { useState, useEffect } from 'react';

export interface DailyActivity {
  filesShared: number;
  snippetsBroadcasted: number;
}

export interface KnowledgeTreeState {
  xp: number;
  history: Record<string, DailyActivity>;
}

const DEFAULT_STATE: KnowledgeTreeState = {
  xp: 0,
  history: {},
};

export const GROWTH_STAGES = [
  { stage: 1, name: 'Seed', minXp: 0, icon: 'Dot' },
  { stage: 2, name: 'Sprout', minXp: 50, icon: 'Sprout' },
  { stage: 3, name: 'Small Plant', minXp: 100, icon: 'Plant' },
  { stage: 4, name: 'Young Tree', minXp: 200, icon: 'TreeDeciduous' },
  { stage: 5, name: 'Healthy Tree', minXp: 400, icon: 'TreePine' },
  { stage: 6, name: 'Blooming Tree', minXp: 800, icon: 'Tree' }, // Using Tree overlayed with Sparkles later
];

export function useKnowledgeTree() {
  const [state, setState] = useState<KnowledgeTreeState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('warpshare_knowledge_tree');
    if (saved) {
      try {
        setState(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse knowledge tree state');
      }
    }
    setIsLoaded(true);
  }, []);

  const saveState = (newState: KnowledgeTreeState) => {
    setState(newState);
    localStorage.setItem('warpshare_knowledge_tree', JSON.stringify(newState));
  };

  const addActivity = (type: 'file' | 'snippet') => {
    setState(prevState => {
      const today = new Date().toISOString().split('T')[0];
      const xpGained = type === 'file' ? 10 : 5;
      
      const newState = { 
        ...prevState, 
        xp: prevState.xp + xpGained,
        history: { ...prevState.history }
      };
      
      if (!newState.history[today]) {
        newState.history[today] = { filesShared: 0, snippetsBroadcasted: 0 };
      }
      
      if (type === 'file') {
        newState.history[today].filesShared += 1;
      } else {
        newState.history[today].snippetsBroadcasted += 1;
      }
      
      localStorage.setItem('warpshare_knowledge_tree', JSON.stringify(newState));
      return newState;
    });
  };
  
  // Calculate current stage safely
  const currentStageIndex = [...GROWTH_STAGES].reverse().findIndex(s => state.xp >= s.minXp);
  const currentStage = currentStageIndex !== -1 ? GROWTH_STAGES[GROWTH_STAGES.length - 1 - currentStageIndex] : GROWTH_STAGES[0];
  
  const nextStage = GROWTH_STAGES.find(s => s.minXp > state.xp);

  return {
    state,
    isLoaded,
    currentStage,
    nextStage,
    addActivity
  };
}
