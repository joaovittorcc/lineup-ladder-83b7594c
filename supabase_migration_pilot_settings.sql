-- Tabela para armazenar configurações dos pilotos
-- Permite marcar se um piloto completou a lista de iniciação

CREATE TABLE IF NOT EXISTS pilot_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_name TEXT NOT NULL UNIQUE,
  initiation_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para busca rápida por nome
CREATE INDEX IF NOT EXISTS idx_pilot_settings_name ON pilot_settings(pilot_name);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_pilot_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pilot_settings_updated_at
  BEFORE UPDATE ON pilot_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_pilot_settings_updated_at();

-- Comentários
COMMENT ON TABLE pilot_settings IS 'Configurações dos pilotos, incluindo se completaram a lista de iniciação';
COMMENT ON COLUMN pilot_settings.pilot_name IS 'Nome do piloto (deve corresponder ao username ou displayName)';
COMMENT ON COLUMN pilot_settings.initiation_completed IS 'Se o piloto completou a lista de iniciação e pode desafiar o 8º da Lista 02';
