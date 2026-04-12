/** Client-side meta for pilots not always represented as `players` rows (Joker, pre–Lista 02 Street Runner). */

const srDebutKey = (nick: string) => `mc-sr-list02-until:${nick.trim().toLowerCase()}`;
const jokerInitCdKey = (nick: string) => `mc-joker-init-cd-until:${nick.trim().toLowerCase()}`;

export function getStreetRunnerList02UnlockAt(nick: string): number | null {
  try {
    const raw = localStorage.getItem(srDebutKey(nick));
    if (!raw) return null;
    const t = parseInt(raw, 10);
    return Number.isFinite(t) ? t : null;
  } catch {
    return null;
  }
}

export function setStreetRunnerList02UnlockAt(nick: string, untilMs: number): void {
  try {
    localStorage.setItem(srDebutKey(nick), String(untilMs));
  } catch {
    /* ignore */
  }
}

export function clearStreetRunnerList02UnlockAt(nick: string): void {
  try {
    localStorage.removeItem(srDebutKey(nick));
  } catch {
    /* ignore */
  }
}

export function getJokerInitiationCooldownUntil(nick: string): number | null {
  try {
    const raw = localStorage.getItem(jokerInitCdKey(nick));
    if (!raw) return null;
    const t = parseInt(raw, 10);
    return Number.isFinite(t) ? t : null;
  } catch {
    return null;
  }
}

export function setJokerInitiationCooldownUntil(nick: string, untilMs: number): void {
  try {
    localStorage.setItem(jokerInitCdKey(nick), String(untilMs));
  } catch {
    /* ignore */
  }
}

export function clearJokerInitiationCooldownUntil(nick: string): void {
  try {
    localStorage.removeItem(jokerInitCdKey(nick));
  } catch {
    /* ignore */
  }
}
