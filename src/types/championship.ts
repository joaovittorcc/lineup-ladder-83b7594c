export interface Player {
  id: string;
  name: string;
  status: 'available' | 'racing' | 'cooldown' | 'pending';
  defenseCount: number;
  cooldownUntil: number | null;
  challengeCooldownUntil: number | null;
  initiationComplete: boolean;
  /** Consecutive defenses while occupying last place / 8º (Lista 02). */
  defensesWhileSeventhStreak: number;
  /** Cannot receive Street Runner challenge until this time (Lista 02 temp rule). */
  list02ExternalBlockUntil: number | null;
  /** New last place (8º): cannot receive outside challenge until this time. */
  list02ExternalEligibleAfter: number | null;
  /** Elegível para desafiar o 8º da Lista 02 (Desafio de Vaga). */
  elegivelDesafioVaga?: boolean;
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
  status: 'pending' | 'accepted' | 'racing' | 'completed' | 'wo' | 'cancelled';
  type: 'ladder' | 'initiation' | 'friendly' | 'desafio-vaga';
  createdAt: number;
  expiresAt?: number | null;
  tracks?: string[];
  score?: [number, number];
  /** Formato do desafio: MD3 (melhor de 3) ou MD5 (melhor de 5) */
  format?: 'MD3' | 'MD5';
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
  trackName?: string | null;
}

export interface PendingFriendlyChallenge {
  id: string;
  challengerName: string;
  challengedName: string;
  status: 'pending' | 'racing';
  trackName: string | null;
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
