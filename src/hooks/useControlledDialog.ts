import { useState } from 'react';

/**
 * Hook for dialog open/close state that supports both controlled and uncontrolled usage.
 * Replaces the common pattern of internalOpen + isControlled checks.
 *
 * Usage:
 *   const { isOpen, setOpen } = useControlledDialog(controlledOpen, onOpenChange);
 */
export function useControlledDialog(
  controlledOpen?: boolean,
  controlledOnOpenChange?: (open: boolean) => void
) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const setOpen = (value: boolean) => {
    if (isControlled && controlledOnOpenChange) {
      controlledOnOpenChange(value);
    } else {
      setInternalOpen(value);
    }
  };

  return { isOpen, setOpen };
}
