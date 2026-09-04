/** How long after someone's "quiero ser detectado" goes off before they're removed from the detected list. */
export const OFFLINE_REMOVE_AFTER_MS = 60 * 60 * 1000;

/** How often, while the app is open, to re-check every detected person's live presence against the rule above. */
export const PRESENCE_RECHECK_INTERVAL_MS = 5 * 60 * 1000;
