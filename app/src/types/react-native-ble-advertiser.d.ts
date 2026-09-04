/**
 * react-native-ble-advertiser ships no TypeScript types of its own, so we
 * declare the slice of its API this app actually calls.
 * https://github.com/vitorpamplona/react-native-ble-advertiser
 */
declare module 'react-native-ble-advertiser' {
  export interface BroadcastOptions {
    advertiseMode?: number;
    txPowerLevel?: number;
    connectable?: boolean;
    includeDeviceName?: boolean;
    includeTxPowerLevel?: boolean;
  }

  interface BLEAdvertiserStatic {
    ADVERTISE_MODE_LOW_POWER: number;
    ADVERTISE_MODE_BALANCED: number;
    ADVERTISE_MODE_LOW_LATENCY: number;
    ADVERTISE_TX_POWER_ULTRA_LOW: number;
    ADVERTISE_TX_POWER_LOW: number;
    ADVERTISE_TX_POWER_MEDIUM: number;
    ADVERTISE_TX_POWER_HIGH: number;

    setCompanyId(companyId: number): void;
    broadcast(serviceUUIDs: string[], manufacturerData: number[], options: BroadcastOptions): Promise<void>;
    stopBroadcast(): Promise<void>;
  }

  const BLEAdvertiser: BLEAdvertiserStatic;
  export default BLEAdvertiser;
}
