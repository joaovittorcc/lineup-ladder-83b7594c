export interface Player {
  id: string;
  name: string;
  status: 'available' | 'racing' | 'cooldown' | 'pending';
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
  type: 'ladder' | 'initiation' | 'friendly';
  createdAt: number;
  tracks?: [string, string, string];
  score?: [number, number];
}

export interface JokerProgress {
  [jokerUsername: string]: string[];
}

export interface FriendlyMatch {
  id: string;
  challengerName: string;
  challengedName: string;
  winnerName: string;
  loserName: string;
  challengerEloBefore: number;
  challengedEloBefore: number;
  challengerEloAfter: number;
  challengedEloAfter: number;
  eloChange: number;
  createdAt: number;
}

export interface EloRatings {
  [playerName: string]: number;
}

export interface ChampionshipState {
  lists: PlayerList[];
  challenges: Challenge[];
  jokerProgress: JokerProgress;
}
