export interface Player {
  id: string;
  name: string;
  status: 'available' | 'racing' | 'cooldown';
  defenseCount: number;
  cooldownUntil: number | null;
  challengeCooldownUntil: number | null;
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
  tracks?: [string, string, string];
  score?: [number, number]; // [challenger, challenged]
}

// Tracks which initiation players each joker has defeated
// Key: joker username (lowercase), Value: array of defeated player IDs
export interface JokerProgress {
  [jokerUsername: string]: string[];
}

export interface ChampionshipState {
  lists: PlayerList[];
  challenges: Challenge[];
  jokerProgress: JokerProgress;
}
