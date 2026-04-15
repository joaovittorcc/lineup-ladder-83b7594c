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
  { username: 'sant', displayName: 'Sant', pin: '0001', isAdmin: true, isPilot: true, isJoker: false, role: 'admin' },
  { username: 'zanin', displayName: 'Zanin', pin: '1236', isAdmin: true, isPilot: true, isJoker: false, role: 'admin' },
  { username: 'flpn', displayName: 'Flpn', pin: '1327', isAdmin: false, isPilot: true, isJoker: false, role: 'midnight-driver' },
  { username: 'rocxs', displayName: 'Rocxs', pin: '3085', isAdmin: false, isPilot: true, isJoker: false, role: 'midnight-driver' },
  { username: 'pedrin', displayName: 'Pedrin', pin: '0007', isAdmin: false, isPilot: true, isJoker: false, role: 'midnight-driver' },
  { username: 'repre', displayName: 'Repre', pin: '0006', isAdmin: false, isPilot: true, isJoker: false, role: 'street-runner' },
  { username: 'chico penha', displayName: 'Chico Penha', pin: '2144', isAdmin: false, isPilot: true, isJoker: false, role: 'street-runner' },
  { username: 'load', displayName: 'Load', pin: '5214', isAdmin: false, isPilot: true, isJoker: false, role: 'street-runner' },
  { username: '0000', displayName: '0000', pin: '0000', isAdmin: false, isPilot: true, isJoker: false, role: 'street-runner' },
  { username: 'blake', displayName: 'Blake', pin: '1425', isAdmin: false, isPilot: true, isJoker: false, role: 'street-runner' },
  { username: 'nash', displayName: 'Nash', pin: '1122', isAdmin: false, isPilot: true, isJoker: false, role: 'street-runner' },
  { username: 'cyber', displayName: 'Cyber', pin: '1232', isAdmin: false, isPilot: true, isJoker: false, role: 'street-runner' },
  { username: 'leite', displayName: 'Leite', pin: '0002', isAdmin: false, isPilot: true, isJoker: false, role: 'street-runner' },
  { username: '12yph', displayName: 'ph', pin: '1608', isAdmin: false, isPilot: true, isJoker: false, role: 'night-driver' },
  { username: 'vitin', displayName: 'Vitin', pin: '1234', isAdmin: false, isPilot: true, isJoker: false, role: 'night-driver' },
  { username: 'mnz', displayName: 'Mnz', pin: '8574', isAdmin: false, isPilot: true, isJoker: false, role: 'night-driver' },
  { username: 'k1', displayName: 'K1', pin: '2815', isAdmin: false, isPilot: true, isJoker: false, role: 'night-driver' },
  { username: 'veiga', displayName: 'Veiga', pin: '1507', isAdmin: false, isPilot: true, isJoker: false, role: 'night-driver' },
  { username: 'gus', displayName: 'Gus', pin: '1301', isAdmin: false, isPilot: true, isJoker: false, role: 'night-driver' },
  { username: 'watzel', displayName: 'Watzel', pin: '1946', isAdmin: false, isPilot: true, isJoker: false, role: 'night-driver' },
  { username: 'gui', displayName: 'Gui', pin: '2601', isAdmin: false, isPilot: true, isJoker: false, role: 'night-driver' },
  { username: 'f.mid', displayName: 'F.mid', pin: '1020', isAdmin: false, isPilot: true, isJoker: false, role: 'night-driver' },
  { username: 'porto', displayName: 'Porto', pin: '0005', isAdmin: false, isPilot: true, isJoker: false, role: 'night-driver' },
  { username: 'p1n0', displayName: 'P1N0', pin: '7004', isAdmin: false, isPilot: false, isJoker: true, role: 'joker' },
  { username: 'furiatti', displayName: 'Furiatti', pin: '7777', isAdmin: false, isPilot: false, isJoker: true, role: 'joker' },
  { username: 'syds', displayName: 'Syds', pin: '1327', isAdmin: false, isPilot: false, isJoker: true, role: 'joker' },
  { username: 'dasmilf', displayName: 'Dasmilf', pin: '1907', isAdmin: false, isPilot: false, isJoker: true, role: 'joker' },
  { username: 'rev', displayName: 'Rev', pin: '4691', isAdmin: false, isPilot: false, isJoker: true, role: 'joker' },
  { username: 'connor', displayName: 'Connor', pin: '1234', isAdmin: false, isPilot: true, isJoker: false, role: 'night-driver' },
  { username: 'dgp1', displayName: 'DGP1', pin: '1303', isAdmin: false, isPilot: false, isJoker: true, role: 'joker' },
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
