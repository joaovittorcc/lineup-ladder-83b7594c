import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PilotSetting {
  id: string;
  pilotName: string;
  initiationCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export function usePilotSettings() {
  const [settings, setSettings] = useState<Map<string, PilotSetting>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('pilot_settings')
        .select('*');

      if (fetchError) throw fetchError;

      const settingsMap = new Map<string, PilotSetting>();
      (data || []).forEach((row: any) => {
        settingsMap.set(row.pilot_name.toLowerCase(), {
          id: row.id,
          pilotName: row.pilot_name,
          initiationCompleted: row.initiation_completed,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        });
      });

      setSettings(settingsMap);
      setError(null);
    } catch (err) {
      console.error('Error fetching pilot settings:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    const channel = supabase
      .channel('pilot-settings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pilot_settings' }, () => {
        fetchSettings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSettings]);

  const hasCompletedInitiation = useCallback(
    (pilotName: string): boolean => {
      const setting = settings.get(pilotName.toLowerCase());
      return setting?.initiationCompleted ?? false;
    },
    [settings]
  );

  const setInitiationCompleted = useCallback(
    async (pilotName: string, completed: boolean): Promise<string | null> => {
      try {
        const { error: upsertError } = await supabase
          .from('pilot_settings')
          .upsert(
            {
              pilot_name: pilotName,
              initiation_completed: completed,
            },
            { onConflict: 'pilot_name' }
          );

        if (upsertError) throw upsertError;

        await fetchSettings();
        return null;
      } catch (err) {
        console.error('Error setting initiation completed:', err);
        return err instanceof Error ? err.message : 'Unknown error';
      }
    },
    [fetchSettings]
  );

  return {
    settings,
    loading,
    error,
    hasCompletedInitiation,
    setInitiationCompleted,
    refreshSettings: fetchSettings,
  };
}
