-- Paridade com supabase/paste_championship_setup.sql: garantir privilégios de tabela para anon
-- (além das políticas RLS em 20260411180000_championship_command_center.sql)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.championship_seasons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.championship_registrations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.championship_race_results TO anon;
