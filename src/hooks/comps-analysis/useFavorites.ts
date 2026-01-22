/**
 * useFavorites Hook
 * Manages favorite properties and comparables with localStorage persistence
 */

import { useState, useEffect, useCallback } from 'react';

const FAVORITES_STORAGE_KEY = 'comps-analysis-favorites';

export interface UseFavoritesReturn {
  favorites: Set<string>;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  clearFavorites: () => void;
  getFavoritesList: () => string[];
  favoritesCount: number;
}

export const useFavorites = (): UseFavoritesReturn => {
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    // Load from localStorage on initialization
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Set(parsed);
      }
    } catch (error) {
      console.error('Failed to load favorites from localStorage:', error);
    }
    return new Set();
  });

  /**
   * Persist favorites to localStorage whenever they change
   */
  useEffect(() => {
    try {
      const favoritesArray = Array.from(favorites);
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoritesArray));
    } catch (error) {
      console.error('Failed to save favorites to localStorage:', error);
    }
  }, [favorites]);

  /**
   * Check if an item is favorited
   */
  const isFavorite = useCallback(
    (id: string): boolean => {
      return favorites.has(id);
    },
    [favorites]
  );

  /**
   * Toggle favorite status
   */
  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  /**
   * Add to favorites
   */
  const addFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  /**
   * Remove from favorites
   */
  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  /**
   * Clear all favorites
   */
  const clearFavorites = useCallback(() => {
    setFavorites(new Set());
  }, []);

  /**
   * Get favorites as array
   */
  const getFavoritesList = useCallback((): string[] => {
    return Array.from(favorites);
  }, [favorites]);

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
    getFavoritesList,
    favoritesCount: favorites.size,
  };
};
