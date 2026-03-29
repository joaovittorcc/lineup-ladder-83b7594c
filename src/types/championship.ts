export interface Player {
  id: string;
  name: string;
  status: 'available' | 'racing' | 'cooldown';
  defenseCount: number;
  cooldownUntil: number | null;
  initiationComplete: boolean;
}

export interface PlayerList {
  id: string;
  title: string;
  players: Player[];
}

export interface Challenge {
  id: string;
  listId: string;
  challengerId: string;
  challengedId: string;
  challengerName: string;
  challengedName: string;
  challengerPos: number;
  challengedPos: number;
  status: 'pending' | 'racing' | 'completed';
  type: 'ladder' | 'initiation';
  createdAt: number;
}

export interface ChampionshipState {
  lists: PlayerList[];
  challenges: Challenge[];
}
