/**
 * Host-based branding gate — Aigameria v1.02 split-brand architecture.
 *
 * - aipetros.xyz  → mother project: every hub (game / cinema / audio).
 * - aigameria.com → game-only brand: the master hub is locked to 'game'
 *   (no cinema / audio entry points), while auth, invitations and
 *   transactional email keep the mother-domain sender identity
 *   (MAIL_FROM=noreply@aipetros.xyz, set in the instance env).
 */
export const IS_GAME_ONLY_HOST: boolean =
  typeof window !== 'undefined' &&
  /(^|\.)aigameria\.com$/i.test(window.location.hostname);

/** Which hubs are reachable from the current host. */
export const allowedMasterHubs = (): Array<'game' | 'cinema' | 'audio'> =>
  IS_GAME_ONLY_HOST ? ['game'] : ['game', 'cinema', 'audio'];
