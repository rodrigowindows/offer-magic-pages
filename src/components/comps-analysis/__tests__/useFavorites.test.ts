/**
 * useFavorites Hook Tests
 */

import { renderHook, act } from '@testing-library/react';
import { useFavorites } from '@/hooks/comps-analysis/useFavorites';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useFavorites', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with empty favorites', () => {
    const { result } = renderHook(() => useFavorites());

    expect(result.current.favorites.size).toBe(0);
    expect(result.current.favoritesCount).toBe(0);
  });

  it('loads favorites from localStorage on init', () => {
    localStorage.setItem('comps-analysis-favorites', JSON.stringify(['1', '2', '3']));

    const { result } = renderHook(() => useFavorites());

    expect(result.current.favorites.size).toBe(3);
    expect(result.current.favoritesCount).toBe(3);
    expect(result.current.isFavorite('1')).toBe(true);
    expect(result.current.isFavorite('2')).toBe(true);
    expect(result.current.isFavorite('3')).toBe(true);
  });

  it('adds a favorite', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite('property-1');
    });

    expect(result.current.favorites.has('property-1')).toBe(true);
    expect(result.current.favoritesCount).toBe(1);
    expect(result.current.isFavorite('property-1')).toBe(true);
  });

  it('removes a favorite', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite('property-1');
      result.current.addFavorite('property-2');
    });

    expect(result.current.favoritesCount).toBe(2);

    act(() => {
      result.current.removeFavorite('property-1');
    });

    expect(result.current.favorites.has('property-1')).toBe(false);
    expect(result.current.favorites.has('property-2')).toBe(true);
    expect(result.current.favoritesCount).toBe(1);
  });

  it('toggles a favorite', () => {
    const { result } = renderHook(() => useFavorites());

    // Add
    act(() => {
      result.current.toggleFavorite('property-1');
    });

    expect(result.current.isFavorite('property-1')).toBe(true);

    // Remove
    act(() => {
      result.current.toggleFavorite('property-1');
    });

    expect(result.current.isFavorite('property-1')).toBe(false);
  });

  it('clears all favorites', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite('property-1');
      result.current.addFavorite('property-2');
      result.current.addFavorite('property-3');
    });

    expect(result.current.favoritesCount).toBe(3);

    act(() => {
      result.current.clearFavorites();
    });

    expect(result.current.favoritesCount).toBe(0);
    expect(result.current.favorites.size).toBe(0);
  });

  it('returns favorites as array', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite('property-1');
      result.current.addFavorite('property-2');
    });

    const list = result.current.getFavoritesList();

    expect(Array.isArray(list)).toBe(true);
    expect(list).toHaveLength(2);
    expect(list).toContain('property-1');
    expect(list).toContain('property-2');
  });

  it('persists favorites to localStorage', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite('property-1');
      result.current.addFavorite('property-2');
    });

    const stored = localStorage.getItem('comps-analysis-favorites');
    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored!);
    expect(parsed).toContain('property-1');
    expect(parsed).toContain('property-2');
  });

  it('handles duplicate additions gracefully', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite('property-1');
      result.current.addFavorite('property-1'); // Duplicate
    });

    expect(result.current.favoritesCount).toBe(1);
  });

  it('handles non-existent removal gracefully', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.removeFavorite('non-existent');
    });

    expect(result.current.favoritesCount).toBe(0);
  });

  it('correctly checks if item is favorite', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite('property-1');
    });

    expect(result.current.isFavorite('property-1')).toBe(true);
    expect(result.current.isFavorite('property-2')).toBe(false);
    expect(result.current.isFavorite('non-existent')).toBe(false);
  });
});
