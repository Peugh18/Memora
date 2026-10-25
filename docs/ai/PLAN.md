# Memora — Plan

## Estado actual (2026-10-24)
Pastillero probado. API Laravel con 9 pruebas pasando; el pastillero ya recibe el horario desde la API. App Expo escrita (22 pantallas), compila sin errores de tipos ni lint; falta probarla en el celular con Expo Go.

## Siguiente paso
0. Terminar Fase 5: firmware con TLS en el pastillero y prueba completa contra AWS.
1. Probar la app en el celular (Expo Go) contra la API local. 2. Terminar la Fase 3 (botón físico → tomada; "Ya la tomé" → se calla) cuando la zona Wi-Fi esté estable.

## Fases

### Fase 0 · Pastillero ✅
- [x] Firmware: Wi-Fi (WiFiManager), reloj DS3231, MQTT, alarma bip-bip, botón, horario guardado
- [x] Probado: suena sin internet, botón confirma, se reconecta solo, botón 10 s borra el Wi-Fi
- [ ] (opcional) Cola local para enviar `tomada` cuando vuelve internet
- [ ] (opcional) Transistor NPN para buzzer a 5 V (más fuerte)

### Fase 1 · Diseño ✅
- [x] Marca (logo, ícono, ilustraciones) en `assets/marca/`
- [x] 24 pantallas en `diseno/vistas/` y botones definidos en `docs/app-botones.md`
- [x] QR imprimible `assets/qr/hoja-qr-A4.pdf` (código MEM-0001-…)
- [ ] Imprimir el QR y pegarlo dentro de la tapa del joyero

### Fase 2 · API (`servidor/`) — en curso
- [x] Modelos: users (con horario y rol), devices, care_links, medications, doses
- [x] Endpoints (ver `routes/api.php`): registro, login, yo, hoy, pastillero, horario, medicamentos, historial, tomas, comando, vincular, familia, invitaciones, personas
- [x] `mqtt:escuchar` (eventos y estado) y `tomas:revisar` cada minuto (omitidas + push Expo)
- [x] 8 pruebas de flujo (`tests/Feature/MemoraTest.php`)
- Criterio: `php artisan test` en verde

### Fase 3 · Prueba local con hardware
- [x] `php artisan migrate`, `pastillero:crear MEM-0001 <clave>`, `serve`, `mqtt:escuchar`
- [x] Registrar con curl, vincular → el ESP32 imprime "Horario actualizado" (horario publicado por la API)
- [ ] Botón físico → la toma queda `tomada` en `GET /api/pacientes/yo/hoy`
- [ ] `POST /api/tomas/{franja}` → el ESP32 se calla
- Criterio: los 3 caminos funcionan con el pastillero real

### Fase 4 · App Expo (`app/`)
- [x] Expo SDK 58 con expo-router, secure-store, camera, notifications, clipboard, react-native-svg, fuente Onest
- [x] Diseño copiado: `src/lib/tema.ts` (tokens) y `src/components/ui.tsx` (botón, campo, tarjeta, íconos…)
- [x] Cliente de API (`src/lib/api.ts`) con token en SecureStore; `EXPO_PUBLIC_API_URL` en `app/.env`
- [x] Pantallas: bienvenida, nombre, celular, rol, horarios, medicamento-inicial, cuenta, vincular (QR), listo, login, olvide, codigo; pestañas paciente (hoy, historial, pastillero, familia) y cuidador (personas, ajustes); medicamentos, medicamento, perfil, datos, persona/[id], persona-horario/[id]
- [x] `npx tsc --noEmit` y `npx eslint src` sin errores
- [ ] Probar con Expo Go en el celular contra la API local (misma red)
- Criterio: cada botón de `docs/app-botones.md` hace lo que dice

### Fase 5 · AWS — en curso
- [x] EC2 `i-0ef9b7a94381cc3b8` (t4g.small arm64, us-east-2, IP 3.151.97.85, rol MemoraEc2Profile, SG sg-01c0e8a3f136a780f con 80/443/8883)
- [x] DuckDNS `memmora.duckdns.org` (doble m) → 3.151.97.85
- [x] `despliegue/instalar.sh` corrido por Session Manager: web (FrankenPHP + HTTPS), escuchar, tareas, Mosquitto TLS 8883 con usuario por pastillero
- [x] Verificado: https://memmora.duckdns.org/up 200; broker acepta MEM-0001 con la clave del QR y rechaza otras
- [ ] Firmware con TLS cargado (`firmware/memora/secreto.h`, fuera de git) y pastillero conectado al broker propio
- [ ] App apuntando a `https://memmora.duckdns.org` y prueba completa (registro, vincular, botón, "Ya la tomé")
- [ ] Al terminar la presentación: terminar EC2, borrar disco, liberar IP

### Fase 6 · Entrega
- [ ] `eas build -p android --profile preview` (el usuario hace `eas login`) → APK
- [ ] Ensayo de la demo completa
