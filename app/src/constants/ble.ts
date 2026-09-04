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
