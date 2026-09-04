# Gente Cerca — detección de personas por Bluetooth + chat

App móvil (React Native + Expo) que permite detectar, en un mismo lugar, a otras
personas que también quieren ser detectadas, y después chatear con ellas aunque
ya no estén cerca. El descubrimiento es peer-to-peer por **Bluetooth Low
Energy (BLE)**, a corto alcance (unos metros); el chat usa un backend liviano
(Firebase) precisamente porque Bluetooth deja de funcionar apenas alguien se
aleja.

## Cómo funciona

Son dos acciones independientes:

1. **"Quiero ser detectado"** (interruptor): tu teléfono empieza a **anunciar**
   (BLE advertising) un token aleatorio de 8 bytes propio de esta instalación,
   usando un UUID de servicio propio de la app. Ese mismo estado ("estoy
   detectable") se refleja en Firestore, así quien ya te encontró antes puede
   saber si todavía te puede escribir aunque ya no estén cerca. El interruptor
   controla si *otros* pueden encontrarte a vos; no busca a nadie por sí solo.
2. **"Buscar gente"** (botón): tu teléfono **escanea** buscando ese mismo UUID
   en el aire. Es una acción explícita — abrir la app o activar el interruptor
   nunca dispara un escaneo por sí solo. Al captar el token de alguien, busca
   su nombre/emoji público en Firestore.
3. A cada persona detectada la agrega (o actualiza, si ya la habías
   detectado antes) a una **lista persistente**: nombre, emoji, distancia
   aproximada ("Muy cerca", "Cerca", "Lejos" según el RSSI) y fecha/hora de
   detección. La lista no expira sola — solo se borra si vaciás todo o
   eliminás a alguien manualmente.
4. Desde cada tarjeta de la lista podés tocar **"Abrir chat"**. La
   conversación sigue funcionando por internet aunque ninguno de los dos siga
   en rango de Bluetooth — para eso existe el backend. Si la otra persona
   apaga "Quiero ser detectado", no le podés seguir escribiendo hasta que lo
   vuelva a activar (se chequea en el momento de cada envío, tanto en el
   cliente como en las reglas de Firestore). Esta opción solo existe del lado
   de quien busca — quien es detectado no ve ninguna lista ni recibe aviso de
   haber sido encontrado.
5. El número de teléfono es **opcional y nunca se transmite por Bluetooth ni
   se comparte solo**. Dentro de un chat, cualquiera de los dos puede tocar
   "Compartir mi WhatsApp" si decide hacerlo con esa persona en particular; el
   otro lado recibe un botón para abrir esa conversación de WhatsApp.

No se guarda ni transmite tu ubicación real, y no hay cuentas de usuario -
cada instalación es anónima, identificada solo por su token aleatorio.

## Backend (chat)

El chat necesita Firebase (plan gratuito Spark alcanza de sobra para esto):

1. Creá un proyecto en <https://console.firebase.google.com>.
2. **Build > Firestore Database > Create database** (modo producción).
3. **Configuración del proyecto > General > Tus apps > Agregar app (Web)** -
   te da un objeto de configuración.
4. Pegá esos valores en `src/services/firebaseConfig.ts` (no son secretos:
   la seguridad de Firebase vive en las reglas, no en ocultar esta config).
5. Publicá `/firestore.rules` (raíz del repo, no de `app/`) en **Firestore
   Database > Reglas**, o con la CLI: `firebase deploy --only firestore:rules`.

Sin este paso, la detección por Bluetooth sigue funcionando (mostrará
"Alguien" en vez del nombre real, ya que no hay Firestore para buscarlo), pero
el chat no va a poder enviar ni recibir mensajes.

### Modelo de datos y seguridad

No hay autenticación de usuarios: cada instalación es un token aleatorio de
8 bytes (`src/utils/token.ts`), y conocerlo (solo posible si esa persona te lo
transmitió por Bluetooth, o ya estás en una conversación con ella) es lo que
reemplaza el login. Las reglas (`/firestore.rules`) validan la forma de cada
documento y, en cada mensaje nuevo, exigen que el destinatario tenga
`isDetectable == true` en ese momento - es la aplicación real (no solo del
lado del cliente) de "no se le puede escribir si apagó el interruptor".

## Estructura del proyecto

```
src/
  constants/
    ble.ts                   UUID del servicio, ID de fabricante
    emoji.ts                  Paleta de emojis para el perfil
  types/                     Tipos compartidos (UserProfile, DetectedPerson, Presence, ChatMessage)
  utils/
    base64.ts                 Codificación/decodificación base64 sin dependencias
    token.ts                   Genera y (de)serializa el token de dispositivo de 8 bytes
    distance.ts                RSSI -> distancia aproximada y nivel de proximidad
    time.ts                    Formatea fechas/horas
    whatsapp.ts                 Abre un chat de WhatsApp por número de teléfono
  services/
    bleService.ts               Escaneo (react-native-ble-plx) y anuncio (react-native-ble-advertiser) del token
    permissions.ts               Permisos de Bluetooth/ubicación según versión de Android
    firebase.ts / firebaseConfig.ts   Inicialización de Firebase (Firestore)
    presenceService.ts           Publica/lee/suscribe el estado "quiero ser detectado" en Firestore
    chatService.ts                Conversaciones y mensajes en Firestore, con el chequeo de presencia
  store/useAppStore.ts          Estado global (zustand): token propio, perfil y lista de detectados
                                 persistidos; toggle/búsqueda en memoria
  hooks/useProximityDetection.ts   Dos ciclos de vida BLE independientes: anunciar+presencia (atado
                                 al interruptor) y escanear (atado al botón "Buscar gente")
  components/                   DetectableToggle, SearchButton, DetectedPersonCard
  screens/                      HomeScreen, ProfileScreen, ChatScreen
  navigation/RootNavigator.tsx
firestore.rules                 Reglas de seguridad de Firestore (raíz del repo)
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

### Nota sobre Metro y Firebase

`metro.config.js` desactiva `unstable_enablePackageExports` a propósito - el
SDK de Firebase (v10+) todavía no es del todo compatible con la resolución
de módulos basada en el campo `exports` que Metro activa por defecto en
Expo SDK 53+. No hace falta tocar nada, ya viene configurado.

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
