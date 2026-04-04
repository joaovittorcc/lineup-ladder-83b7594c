import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type LogType = 'CHALLENGE' | 'FRIENDLY' | 'INITIATION' | 'PROMOTION' | 'AUTO_PROMOTION' | 'DEMOTION';

export interface GlobalLog {
  id: string;
  created_at: string;
  type: LogType;
  description: string;
  player_one: string | null;
  player_two: string | null;
  winner: string | null;
  category: string;
}

export async function insertGlobalLog(log: {
  type: LogType;
  description: string;
  player_one?: string;
  player_two?: string;
  winner?: string;
  category?: string;
}) {
  const { error } = await supabase.from('global_logs').insert({
    type: log.type,
    description: log.description,
    player_one: log.player_one ?? null,
    player_two: log.player_two ?? null,
    winner: log.winner ?? null,
    category: log.category ?? 'general',
  });
  if (error) console.error('Failed to insert log:', error);
}

export function useGlobalLogs() {
  const [logs, setLogs] = useState<GlobalLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('global_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (!error && data) setLogs(data as GlobalLog[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Subscribe to realtime
  useEffect(() => {
    const channel = supabase
      .channel('global_logs_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'global_logs' }, (payload) => {
        setLogs(prev => [payload.new as GlobalLog, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return { logs, loading, refetch: fetchLogs };
}
