# Gente Cerca — detección de personas por Bluetooth

App móvil (React Native + Expo) que permite detectar, en un mismo lugar, a otras
personas que también quieren ser detectadas. No usa GPS ni servidores: todo
funciona de forma peer-to-peer por **Bluetooth Low Energy (BLE)**, a corto
alcance (unos metros).

## Cómo funciona

1. Activas el interruptor **"Quiero ser detectado"**.
2. Tu teléfono empieza a **anunciar** (BLE advertising) un pequeño paquete con
   tu nombre/apodo y un emoji, usando un UUID de servicio propio de esta app.
3. Al mismo tiempo, tu teléfono **escanea** buscando ese mismo UUID en el aire.
4. Cuando detecta a otra persona con la app abierta y el interruptor también
   activado, aparece en tu lista con una estimación de qué tan cerca está
   ("Muy cerca", "Cerca", "Lejos"), calculada a partir de la potencia de la
   señal (RSSI).
5. Si apagas el interruptor, dejas de anunciarte y de ver a los demás — es
   recíproco: solo ves a quien también te puede ver a ti.

No hay backend, no hay cuentas, no se guarda ni transmite tu ubicación real.
Todo el "descubrimiento" ocurre localmente entre los teléfonos que están a
pocos metros unos de otros.

## Estructura del proyecto

```
src/
  constants/ble.ts        UUID del servicio, ID de fabricante, timeouts
  types/                  Tipos compartidos (UserProfile, NearbyPerson)
  utils/
    base64.ts              Codificación/decodificación base64 sin dependencias
    profileEncoding.ts      Empaqueta nombre + emoji en pocos bytes para el anuncio BLE
    distance.ts             RSSI -> distancia aproximada y nivel de proximidad
  services/
    bleService.ts            Escaneo (react-native-ble-plx) y anuncio (react-native-ble-advertiser)
    permissions.ts            Permisos de Bluetooth/ubicación según versión de Android
  store/useAppStore.ts       Estado global (zustand) con persistencia del perfil
  hooks/useProximityDetection.ts  Ciclo de vida completo del BLE atado al interruptor
  components/                DetectableToggle, NearbyPersonCard
  screens/                    HomeScreen, ProfileScreen
  navigation/RootNavigator.tsx
```

## Por qué dos librerías de BLE

Ninguna librería mantenida activamente cubre bien los dos roles de BLE a la
vez:

- **`react-native-ble-plx`** actúa como "central" (escanear dispositivos cercanos).
- **`react-native-ble-advertiser`** actúa como "periférico" (anunciarnos a
  nosotros mismos), algo que `ble-plx` no soporta.

Ambas usan el mismo UUID de servicio propio de la app (`APP_SERVICE_UUID` en
`src/constants/ble.ts`), así que solo detectamos otras instancias de esta
app — nunca auriculares, autos u otros dispositivos Bluetooth del entorno.

## Requisitos y cómo correrla

Esta app usa módulos nativos de Bluetooth, así que **no funciona en Expo Go**.
Necesitas un *development build* (dev client) propio:

```bash
npm install
npx expo prebuild        # genera las carpetas ios/ y android/
npx expo run:android     # o: npx expo run:ios (requiere macOS + Xcode)
```

También puedes compilar en la nube sin instalar Android Studio/Xcode con
[EAS Build](https://docs.expo.dev/build/introduction/):

```bash
npx eas build --platform android --profile development
```

### Importante: se necesita hardware real

BLE **no funciona en simuladores/emuladores** (ni el simulador de iOS ni la
mayoría de emuladores de Android exponen un adaptador Bluetooth real). Para
probar la detección necesitas al menos **dos teléfonos físicos** con
Bluetooth activado, corriendo esta app cerca uno del otro.

### Permisos

- **Android 12+**: se piden en tiempo de ejecución `BLUETOOTH_SCAN`,
  `BLUETOOTH_ADVERTISE` y `BLUETOOTH_CONNECT` (con la bandera
  "neverForLocation", por lo que **no** se solicita ubicación).
- **Android 11 y anteriores**: Android exige permiso de ubicación
  (`ACCESS_FINE_LOCATION`) para poder escanear BLE, aunque la app no la usa
  para nada más que eso — es una restricción del sistema operativo, no de
  esta app.
- **iOS**: se pide automáticamente la primera vez que se usa Bluetooth,
  usando el texto configurado en `app.json` (`NSBluetoothAlwaysUsageDescription`).

## Limitaciones conocidas

- El alcance real de BLE es de pocos metros (más corto en interiores, con
  paredes o mucha gente alrededor).
- La distancia estimada a partir del RSSI es aproximada — el RSSI es ruidoso
  y varía según el modelo de teléfono, la orientación y los obstáculos.
- En segundo plano, iOS limita fuertemente el anuncio BLE con UUIDs
  personalizados (política del sistema operativo, no de esta app): para que
  te detecten de forma confiable, la app debe estar abierta en primer plano.
- Antes de escanear/anunciar, revisa la documentación versionada de Expo
  (`https://docs.expo.dev/versions/v57.0.0/`) si actualizas el SDK, ya que la
  configuración de plugins y permisos cambia entre versiones.

## Personalizar antes de publicar

Antes de subir la app a una tienda, cambia el identificador de paquete en
`app.json` (`ios.bundleIdentifier` y `android.package`, actualmente
`com.persondetection.app`) por uno propio.
