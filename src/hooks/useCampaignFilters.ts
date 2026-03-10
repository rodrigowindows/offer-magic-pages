/**
 * Hook to manage campaign wizard filter state and derived data.
 * Eliminates prop drilling by co-locating filter state with filter logic.
 */

import { useState, useMemo, useCallback } from 'react';
import {
  type CampaignProperty,
  hasSkiptracePhones,
  hasSkiptraceEmails,
  getAllPhones as getAllPhonesUtil,
  getAllEmails,
  getPhoneFieldCounts,
} from './useCampaignContacts';
import type { Channel } from '@/types/marketing.types';

export const useCampaignFilters = (properties: CampaignProperty[]) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('approved');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{ id: string; label: string }[]>([]);
  const [hasSkiptracePhoneFilter, setHasSkiptracePhoneFilter] = useState(false);
  const [hasSkiptraceEmailFilter, setHasSkiptraceEmailFilter] = useState(false);
  const [phoneFieldFilter, setPhoneFieldFilter] = useState<string[]>([]);
  const [selectedPhoneColumn, setSelectedPhoneColumn] = useState('phone1');
  const [selectedEmailColumn, setSelectedEmailColumn] = useState('email1');

  const getAllPhones = useCallback(
    (prop: CampaignProperty) => getAllPhonesUtil(prop, phoneFieldFilter),
    [phoneFieldFilter]
  );

  const countWithSkiptracePhones = useMemo(
    () => properties.filter(hasSkiptracePhones).length,
    [properties]
  );

  const countWithSkiptraceEmails = useMemo(
    () => properties.filter(hasSkiptraceEmails).length,
    [properties]
  );

  const phoneFieldCounts = useMemo(
    () => getPhoneFieldCounts(properties),
    [properties]
  );

  const selectedProps = useMemo(
    () => properties.filter(p => selectedIds.includes(p.id)),
    [properties, selectedIds]
  );

  // Changed from useCallback to useMemo for automatic memoization
  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      const matchesSearch =
        !searchTerm ||
        p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city.toLowerCase().includes(searchTerm.toLowerCase());
      if (hasSkiptracePhoneFilter && !hasSkiptracePhones(p)) return false;
      if (hasSkiptraceEmailFilter && !hasSkiptraceEmails(p)) return false;
      if (phoneFieldFilter.length > 0) {
        // Only show properties that have a phone in at least one of the selected columns
        const hasInColumns = phoneFieldFilter.some(field => !!(p as Record<string, unknown>)[field]);
        if (!hasInColumns) return false;
      }
      return matchesSearch;
    });
  }, [properties, searchTerm, hasSkiptracePhoneFilter, hasSkiptraceEmailFilter, phoneFieldFilter]);

  const getContactStats = useCallback(
    (channel: Channel) => ({
      propsWithEmail: selectedProps.filter(p => getAllEmails(p).length > 0).length,
      propsWithPhone: selectedProps.filter(p => getAllPhones(p).length > 0).length,
    }),
    [selectedProps, getAllPhones]
  );

  const toggleSelection = useCallback(
    (id: string) => setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])),
    []
  );

  return {
    // State
    selectedIds, setSelectedIds,
    searchTerm, setSearchTerm,
    filterStatus, setFilterStatus,
    selectedBatch, setSelectedBatch,
    showAdvancedFilters, setShowAdvancedFilters,
    activeFilters, setActiveFilters,
    hasSkiptracePhoneFilter, setHasSkiptracePhoneFilter,
    hasSkiptraceEmailFilter, setHasSkiptraceEmailFilter,
    phoneFieldFilter, setPhoneFieldFilter,
    selectedPhoneColumn, setSelectedPhoneColumn,
    selectedEmailColumn, setSelectedEmailColumn,
    // Derived
    countWithSkiptracePhones,
    countWithSkiptraceEmails,
    phoneFieldCounts,
    selectedProps,
    filteredProperties,
    // Functions
    getAllPhones,
    getContactStats,
    toggleSelection,
  };
};

export type CampaignFiltersReturn = ReturnType<typeof useCampaignFilters>;