/**
 * Hook para atalhos de teclado globais
 * Ativa atalhos úteis para navegação e ações rápidas
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useMarketingStore } from '@/store/marketingStore';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const updateSettings = useMarketingStore((state) => state.updateSettings);
  const testMode = useMarketingStore((state) => state.settings.defaults.test_mode);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignorar se estiver digitando em input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Permitir apenas alguns atalhos específicos em inputs
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          // Ctrl/Cmd + K sempre funciona
        } else {
          return;
        }
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifierKey = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + K: Focus search
      if (modifierKey && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector(
          'input[type="search"], input[placeholder*="Search"]'
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
          toast.info('Search focused');
        }
      }

      // Ctrl/Cmd + N: New communication
      if (modifierKey && e.key === 'n') {
        e.preventDefault();
        navigate('/send');
        toast.info('New communication');
      }

      // Ctrl/Cmd + H: Go to history
      if (modifierKey && e.key === 'h') {
        e.preventDefault();
        navigate('/history');
        toast.info('History');
      }

      // Ctrl/Cmd + ,: Go to settings
      if (modifierKey && e.key === ',') {
        e.preventDefault();
        navigate('/settings');
        toast.info('Settings');
      }

      // Ctrl/Cmd + D: Go to dashboard
      if (modifierKey && e.key === 'd') {
        e.preventDefault();
        navigate('/');
        toast.info('Dashboard');
      }

      // Ctrl/Cmd + T: Toggle test mode
      if (modifierKey && e.key === 't') {
        e.preventDefault();
        updateSettings({
          defaults: {
            test_mode: !testMode,
          },
        });
        toast.success(`Test mode ${!testMode ? 'ON' : 'OFF'}`, {
          description: !testMode
            ? '🧪 Communications will be simulated'
            : '🚀 Communications will be sent LIVE',
        });
      }

      // Ctrl/Cmd + /: Show shortcuts help
      if (modifierKey && e.key === '/') {
        e.preventDefault();
        showShortcutsHelp();
      }

      // ESC: Clear/close (context dependent)
      if (e.key === 'Escape') {
        // Limpar busca se estiver focado
        const searchInput = document.querySelector(
          'input[type="search"]'
        ) as HTMLInputElement;
        if (searchInput && document.activeElement === searchInput) {
          searchInput.value = '';
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }

      // ? (Shift + /): Show help
      if (e.shiftKey && e.key === '?') {
        e.preventDefault();
        showShortcutsHelp();
      }
    };

    const showShortcutsHelp = () => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const mod = isMac ? '⌘' : 'Ctrl';

      toast.info('Keyboard Shortcuts', {
        description: `
${mod}+K: Search
${mod}+N: New Communication
${mod}+H: History
${mod}+D: Dashboard
${mod}+,: Settings
${mod}+T: Toggle Test Mode
${mod}+/: Show Shortcuts
ESC: Clear/Close
        `.trim(),
        duration: 8000,
      });
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [navigate, updateSettings, testMode]);
}

export default useKeyboardShortcuts;
