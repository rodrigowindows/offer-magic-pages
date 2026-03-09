/**
 * Keyboard Shortcut Hint — Shows ⌘K hint for command palette
 */
import { useEffect, useState } from 'react';
import { Command } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function KeyboardShortcutHint() {
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(navigator.platform?.toLowerCase().includes('mac') || 
             navigator.userAgent?.toLowerCase().includes('mac'));
  }, []);

  const openCommandPalette = () => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        ctrlKey: !isMac,
        bubbles: true,
      })
    );
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="hidden md:flex items-center gap-2 h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
      onClick={openCommandPalette}
    >
      <Command className="h-3 w-3" />
      <span>{isMac ? '⌘' : 'Ctrl+'}K</span>
      <span className="hidden lg:inline ml-1">Search</span>
    </Button>
  );
}
