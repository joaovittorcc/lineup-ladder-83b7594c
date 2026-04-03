export type PilotRole = 'admin' | 'midnight-driver' | 'night-driver' | 'street-runner' | 'joker';

export interface AuthUser {
  username: string;
  displayName: string;
  pin: string;
  isAdmin: boolean;
  isPilot: boolean;
  isJoker: boolean;
  role: PilotRole;
}

export const authorizedUsers: AuthUser[] = [
  { username: 'evojota', displayName: 'Evojota', pin: '0481', isAdmin: true, isPilot: true, isJoker: false, role: 'admin' },
  { username: 'lunatic', displayName: 'Lunatic', pin: '1234', isAdmin: true, isPilot: true, isJoker: false, role: 'admin' },
  { username: 'flpn', displayName: 'Flpn', pin: '1327', isAdmin: false, isPilot: true, isJoker: false, role: 'midnight-driver' },
  { username: 'rocxs', displayName: 'Rocxs', pin: '3085', isAdmin: false, isPilot: true, isJoker: false, role: 'midnight-driver' },
  { username: 'chico penha', displayName: 'Chico Penha', pin: '2144', isAdmin: false, isPilot: true, isJoker: false, role: 'street-runner' },
  { username: 'load', displayName: 'Load', pin: '5214', isAdmin: false, isPilot: true, isJoker: false, role: 'street-runner' },
  { username: '12yph', displayName: 'ph', pin: '1608', isAdmin: false, isPilot: true, isJoker: false, role: 'night-driver' },
  { username: 'vitin', displayName: 'Vitin', pin: '1234', isAdmin: false, isPilot: true, isJoker: false, role: 'night-driver' },
  { username: 'muniz', displayName: 'Muniz', pin: '8574', isAdmin: false, isPilot: true, isJoker: false, role: 'night-driver' },
  { username: 'k1', displayName: 'K1', pin: '2815', isAdmin: false, isPilot: true, isJoker: false, role: 'night-driver' },
  { username: 'veiga', displayName: 'Veiga', pin: '1507', isAdmin: false, isPilot: true, isJoker: false, role: 'night-driver' },
  { username: 'gus', displayName: 'Gus', pin: '1301', isAdmin: false, isPilot: true, isJoker: false, role: 'night-driver' },
  { username: 'watzel', displayName: 'Watzel', pin: '1946', isAdmin: false, isPilot: true, isJoker: false, role: 'night-driver' },
  { username: 'dasmilf', displayName: 'Dasmilf', pin: '1907', isAdmin: false, isPilot: false, isJoker: true, role: 'joker' },
  { username: 'rev', displayName: 'Rev', pin: '4691', isAdmin: false, isPilot: false, isJoker: true, role: 'joker' },
];

export function authenticateUser(username: string, pin: string): AuthUser | null {
  const found = authorizedUsers.find(
    u => u.username === username.trim().toLowerCase() && u.pin === pin
  );
  return found ?? null;
}

export function getUserByName(name: string): AuthUser | undefined {
  return authorizedUsers.find(
    u => u.username === name.trim().toLowerCase() || u.displayName.toLowerCase() === name.trim().toLowerCase()
  );
}

export function getRoleLabel(role: PilotRole): string {
  switch (role) {
    case 'admin': return 'Admin';
    case 'midnight-driver': return 'Midnight Driver';
    case 'night-driver': return 'Night Driver';
    case 'street-runner': return 'Street Runner';
    case 'joker': return 'Joker';
  }
}

export function getRoleColor(role: PilotRole): string {
  switch (role) {
    case 'admin': return 'bg-red-500/20 text-red-400 border-red-500/40';
    case 'midnight-driver': return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
    case 'night-driver': return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    case 'street-runner': return 'bg-green-500/20 text-green-400 border-green-500/40';
    case 'joker': return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
  }
}

export const ALL_ROLES: PilotRole[] = ['admin', 'midnight-driver', 'night-driver', 'street-runner', 'joker'];
