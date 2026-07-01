import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { config } from '@/utils/config';
import { useAuth } from './AuthContext';

interface AiFeatureContextType {
  /** Whether the AI feature should be shown to the patient. */
  aiEnabled: boolean;
  /** Re-fetch the toggle from user_patients.ai_assistant (e.g. on pull-to-refresh). */
  refreshAiFeature: () => Promise<void>;
}

const AiFeatureContext = createContext<AiFeatureContextType>({
  aiEnabled: false,
  refreshAiFeature: async () => {},
});

export const useAiFeature = () => useContext(AiFeatureContext);

/**
 * Reads user_patients.ai_assistant for the logged-in patient via an edge
 * function (service role). A direct supabase query is blocked by RLS because
 * patients authenticate with a custom session token, not Supabase Auth.
 *
 * Defaults to hidden: no patient, a missing row, or any error keeps the AI
 * feature OFF, so we never flash the tab on while the lookup is in flight or fails.
 */
async function fetchAiEnabled(patientId?: string): Promise<boolean> {
  console.log('[AiFeature] fetchAiEnabled patientId=', patientId, 'url=', config.supabaseUrl);
  if (!patientId) {
    console.log('[AiFeature] no patientId — hiding AI');
    return false;
  }
  try {
    const response = await fetch(
      `${config.supabaseUrl}/functions/v1/mobile-get-ai-feature?patientId=${patientId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const result = await response.json();
    console.log('[AiFeature] response status=', response.status, 'body=', JSON.stringify(result));
    if (!response.ok || !result.success) {
      return false;
    }
    return result.ai_assistant === true;
  } catch (e) {
    console.warn('[AiFeature] lookup failed — keeping it hidden:', e);
    return false;
  }
}

export const AiFeatureProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  const patientId = session?.patient?.id;
  const [aiEnabled, setAiEnabled] = useState(false);

  const refreshAiFeature = useCallback(async () => {
    const enabled = await fetchAiEnabled(patientId);
    console.log('[AiFeature] setAiEnabled ->', enabled);
    setAiEnabled(enabled);
  }, [patientId]);

  useEffect(() => {
    refreshAiFeature();
  }, [refreshAiFeature]);

  return (
    <AiFeatureContext.Provider value={{ aiEnabled, refreshAiFeature }}>
      {children}
    </AiFeatureContext.Provider>
  );
};
