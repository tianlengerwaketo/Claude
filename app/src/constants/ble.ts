/**
 * Shared BLE protocol constants.
 *
 * Every installation of this app that opts in to being detected advertises
 * this same 128-bit service UUID. Scanning devices filter on it so we only
 * ever see other instances of this app - not random Bluetooth devices
 * (headphones, cars, etc.) in the area.
 */
export const APP_SERVICE_UUID = '5b3f9d10-6c2a-4b8e-9a1d-7e2c4f8a91b3';

/**
 * BLE manufacturer-specific data requires a 2-byte company identifier.
 * 0xFFFF is reserved by the Bluetooth SIG for development/testing and is
 * never assigned to a real company, so it's safe to use here.
 */
export const COMPANY_ID = 0xffff;

/** Max bytes of display name we can fit in the advertising payload. */
export const MAX_NAME_BYTES = 16;

/** Stop showing a nearby person if we haven't seen a fresh advert in this long. */
export const STALE_TIMEOUT_MS = 12_000;

/** How often the scan loop prunes stale entries from the nearby list. */
export const PRUNE_INTERVAL_MS = 2_000;
