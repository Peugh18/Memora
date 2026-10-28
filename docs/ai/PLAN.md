# Memora — Plan

## Estado actual (actualizado 2026-10-25)
- **AWS y circuito principal:** servidor Laravel/Mosquitto propio instalado en EC2 us-east-2; HTTPS y MQTT/TLS verificados. En la prueba del 2026-10-24, la app Expo Go contra AWS vinculó el pastillero por QR, envió un horario y el ESP32 real sonó; el botón físico informó `tomada` y la app mostró `Tomada`. El usuario decidió dejar la EC2 encendida usando sus créditos; no detenerla sin una nueva indicación. No se volvió a comprobar la cuenta en vivo en esta revisión.
- **App:** 22 vistas Expo SDK 58; TypeScript y lint estaban limpios. Hoy, Pastillero y Personas consultan cada 5 s y al volver a primer plano, y se actualizan tras guardar horarios. El flujo de cuidador con segundo celular y el APK EAS/Firebase Push aún no están probados/entregados.
- **Hardware real:** ESP32 DevKit de 38 pines, DS3231, 28 posiciones (7 × mañana/mediodía/tarde/noche), caja adaptada de un joyero. Pines vigentes: buzzer 25, LED 26, botón 27, SDA 33, SCL 32 y alimentación RTC desde GPIO14. El armado actual a 3,3 V fue probado; la nueva variante de buzzer/LED a 5 V con transistores sigue pendiente de montar y verificar.
- **Último cambio local:** commit `23b5283` en `main`, alineado con `origin/main` al revisar; actualiza la guía de armado para distribuir 5 V/GND por los rieles. La guía conserva el armado anterior y señala qué se debe retirar al cambiar a la variante con transistores.
- **Simulación:** la conversación recomienda Wokwi para lógica/firmware ESP32 y Falstad o Tinkercad para entender el transistor. Wokwi usa un RTC DS1307 y no representa los transistores de este montaje; no se debe asumir que el circuito/firmware completo es idéntico al DS3231 real.

## Siguiente paso
1. Probar el rol cuidador con un segundo celular y confirmar qué puede ver y qué no puede hacer.
2. Probar en el sistema real la acción «Ya la tomé» desde la app mientras suena el pastillero; diferenciarla del botón «Solo apagar el sonido».
3. Cuando estén los transistores y resistencias, montar la variante 5 V siguiendo el dibujo actualizado y probarla componente por componente.
4. Preparar APK con EAS y configurar Firebase para probar avisos push; hoy Expo Go no los valida.
5. Si se crea una simulación Wokwi, adaptar/validar el reloj simulado aparte; no tratar el DS1307 como sustituto probado del DS3231.

## Fases

### Fase 0 · Pastillero ✅
- [x] Firmware: Wi-Fi (WiFiManager), reloj DS3231, MQTT, alarma bip-bip, botón, horario guardado
- [x] Probado: suena sin internet, botón confirma, se reconecta solo, botón 10 s borra el Wi-Fi
- [ ] (opcional) Cola local para enviar `tomada` cuando vuelve internet
- [ ] Montar y verificar la variante de buzzer/LED a 5 V con transistores según `docs/armado-y-pruebas.md`.

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
- [x] Botón físico → la toma queda `tomada` (probado ya contra AWS)
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
- [x] Firmware con TLS cargado (`firmware/memora/secreto.h`, fuera de git) y pastillero conectado al broker propio (Wi-Fi de casa "Peugu")
- [x] App apuntando a `https://memmora.duckdns.org`: registro, vincular con QR, horario → pastillero, suena a la hora, botón físico → "Tomada" en la app (2026-10-24 21:45)
- [ ] Probar rol cuidador con un segundo celular
- [ ] Al terminar la presentación: terminar EC2, borrar disco, liberar IP

### Fase 6 · Entrega
- [ ] `eas build -p android --profile preview` (el usuario hace `eas login`) → APK
- [ ] Ensayo de la demo completa
