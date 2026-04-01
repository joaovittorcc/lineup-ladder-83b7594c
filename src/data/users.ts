export interface AuthUser {
  username: string; // stored lowercase for case-insensitive matching
  pin: string;
  isAdmin: boolean;
  isPilot: boolean;
}

// Add new users here following the same pattern
export const authorizedUsers: AuthUser[] = [
  { username: 'evojota', pin: '0481', isAdmin: true, isPilot: true },
];

export function authenticateUser(username: string, pin: string): AuthUser | null {
  const found = authorizedUsers.find(
    u => u.username === username.trim().toLowerCase() && u.pin === pin
  );
  return found ?? null;
}
