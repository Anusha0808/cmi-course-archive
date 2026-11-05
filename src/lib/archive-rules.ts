export const MODERATOR_EMAIL = "anuzrella@gmail.com";

export function emailAllowed(email: string) {
  const normalized = email.trim().toLowerCase();
  return /^[^@\s]+@cmi\.ac\.in$/.test(normalized) || normalized === MODERATOR_EMAIL;
}

export function verifiedModerator(email: string, confirmed: boolean) {
  return confirmed && email.trim().toLowerCase() === MODERATOR_EMAIL;
}

export function parseTags(value: string) {
  return [...new Set(value.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
}

/** Password-reset emails must land on the app's own reset page. */
export function resetRedirectUrl(origin: string) {
  return `${origin.replace(/\/+$/, "")}/reset-password`;
}

/** True only for recovery links (type=recovery), never for signup or magic-link hashes. */
export function isRecoveryHash(hash: string) {
  return /(?:^|[&#?])type=recovery(?:&|$)/.test(hash);
}