import { useState, useEffect } from 'react';

type DesignMode = 'classic' | 'minimal';

export const useDesignMode = () => {
  const [designMode, setDesignMode] = useState<DesignMode>(() => {
    // Load from localStorage
    const saved = localStorage.getItem('design_mode');
    return (saved as DesignMode) || 'classic';
  });

  useEffect(() => {
    // Save to localStorage whenever it changes
    localStorage.setItem('design_mode', designMode);
  }, [designMode]);

  const toggleDesignMode = () => {
    setDesignMode(prev => prev === 'classic' ? 'minimal' : 'classic');
  };

  const isMinimal = designMode === 'minimal';
  const isClassic = designMode === 'classic';

  return {
    designMode,
    setDesignMode,
    toggleDesignMode,
    isMinimal,
    isClassic,
  };
};
