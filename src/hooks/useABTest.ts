import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type Variant = 'A' | 'B';

interface ABTestHook {
  variant: Variant;
  sessionId: string;
  trackEvent: (event: string) => void;
  trackFormSubmit: () => void;
  trackTimeOnPage: (seconds: number) => void;
}

const getOrCreateSessionId = (): string => {
  const stored = sessionStorage.getItem('ab_session_id');
  if (stored) return stored;
  
  const newId = crypto.randomUUID();
  sessionStorage.setItem('ab_session_id', newId);
  return newId;
};

const getOrAssignVariant = (): Variant => {
  const stored = sessionStorage.getItem('ab_variant');
  if (stored === 'A' || stored === 'B') return stored;
  
  // 50/50 split
  const variant: Variant = Math.random() < 0.5 ? 'A' : 'B';
  sessionStorage.setItem('ab_variant', variant);
  return variant;
};

export const useABTest = (propertyId: string): ABTestHook => {
  const [sessionId] = useState(getOrCreateSessionId);
  const [variant] = useState(getOrAssignVariant);
  const [testId, setTestId] = useState<string | null>(null);

  // Initialize AB test record
  useEffect(() => {
    const initTest = async () => {
      try {
        // Check if already exists for this session/property
        const { data: existing } = await supabase
          .from('ab_tests')
          .select('id')
          .eq('session_id', sessionId)
          .eq('property_id', propertyId)
          .maybeSingle();

        if (existing) {
          setTestId(existing.id);
          return;
        }

        // Create new test record
        const { data, error } = await supabase
          .from('ab_tests')
          .insert({
            property_id: propertyId,
            session_id: sessionId,
            variant,
            source: document.referrer || 'direct',
            viewed_hero: true,
          })
          .select('id')
          .single();

        if (!error && data) {
          setTestId(data.id);
        }
      } catch (error) {
        console.error('Error initializing AB test:', error);
      }
    };

    if (propertyId) {
      initTest();
    }
  }, [propertyId, sessionId, variant]);

  const trackEvent = useCallback(async (event: string) => {
    if (!testId) return;

    const updateField: Record<string, boolean> = {};
    switch (event) {
      case 'viewed_offer':
        updateField.viewed_offer = true;
        break;
      case 'viewed_benefits':
        updateField.viewed_benefits = true;
        break;
      case 'viewed_process':
        updateField.viewed_process = true;
        break;
      case 'viewed_form':
        updateField.viewed_form = true;
        break;
    }

    if (Object.keys(updateField).length > 0) {
      await supabase
        .from('ab_tests')
        .update(updateField)
        .eq('id', testId);
    }
  }, [testId]);

  const trackFormSubmit = useCallback(async () => {
    if (!testId) return;
    
    await supabase
      .from('ab_tests')
      .update({ submitted_form: true })
      .eq('id', testId);
  }, [testId]);

  const trackTimeOnPage = useCallback(async (seconds: number) => {
    if (!testId) return;
    
    await supabase
      .from('ab_tests')
      .update({ time_on_page: seconds })
      .eq('id', testId);
  }, [testId]);

  return {
    variant,
    sessionId,
    trackEvent,
    trackFormSubmit,
    trackTimeOnPage,
  };
};
