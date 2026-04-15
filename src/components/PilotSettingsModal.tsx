import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, X, Search } from 'lucide-react';
import { authorizedUsers } from '@/data/users';
import { usePilotSettings } from '@/hooks/usePilotSettings';
import { Input } from '@/components/ui/input';

interface PilotSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PilotSettingsModal({ open, onOpenChange }: PilotSettingsModalProps) {
  const { hasCompletedInitiation, setInitiationCompleted, loading } = usePilotSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  const handleToggleInitiation = async (pilotName: string, currentStatus: boolean) => {
    setUpdating(pilotName);
    const error = await setInitiationCompleted(pilotName, !currentStatus);
    if (error) {
      console.error('Error updating pilot setting:', error);
    }
    setUpdating(null);
  };

  // Filtrar pilotos que são Jokers (não estão nas listas)
  const jokers = authorizedUsers.filter(u => u.isJoker);

  // Filtrar por termo de busca
  const filteredPilots = jokers.filter(pilot =>
    pilot.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pilot.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col bg-secondary border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground font-['Orbitron'] tracking-wider">
            ⚙️ Configurações de Pilotos
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Marque os pilotos que completaram a lista de iniciação e podem desafiar o 8º da Lista 02
          </p>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar piloto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background border-border text-foreground"
            />
          </div>

          {/* Lista de pilotos */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando...
              </div>
            ) : filteredPilots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'Nenhum piloto encontrado' : 'Nenhum Joker cadastrado'}
              </div>
            ) : (
              filteredPilots.map((pilot) => {
                const completed = hasCompletedInitiation(pilot.username);
                const isUpdating = updating === pilot.username;

                return (
                  <div
                    key={pilot.username}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-background/50 hover:bg-background transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-bold text-foreground">{pilot.displayName}</div>
                      <div className="text-xs text-muted-foreground">@{pilot.username}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      {completed ? (
                        <span className="text-xs font-bold text-green-400 flex items-center gap-1">
                          <Check className="h-4 w-4" />
                          Completou Iniciação
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                          <X className="h-4 w-4" />
                          Não completou
                        </span>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isUpdating}
                        onClick={() => handleToggleInitiation(pilot.username, completed)}
                        className={`h-9 text-xs font-bold transition-all ${
                          completed
                            ? 'bg-destructive/20 text-destructive hover:bg-destructive/30 border-destructive/50'
                            : 'bg-primary/20 text-primary hover:bg-primary/30 border-primary/50'
                        }`}
                      >
                        {isUpdating ? (
                          'Atualizando...'
                        ) : completed ? (
                          <>
                            <X className="h-3 w-3 mr-1" />
                            Remover
                          </>
                        ) : (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Marcar como Completo
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
