# Memora — Bitácora

## 2026-10-28 · Aviso al paciente a la hora de la toma
- El usuario no recibía notificaciones: el diseño solo mandaba push al cuidador cuando una toma quedaba omitida; el paciente nunca recibía nada.
- Ahora `Tomas::revisar()` manda "Hora de tus pastillas de …" al paciente cuando se abre la toma (una vez, `wasRecentlyCreated`). La app vuelve a registrar el token al abrirse (requiere APK nuevo; el actual lo registra al iniciar sesión). 14 pruebas pasan.

## 2026-10-28 · Olvidé mi contraseña
- Fallaba: con un correo registrado la API daba 500 (`Route [password.reset] not defined`, Laravel quería armar un enlace web) y el correo estaba en `MAIL_MAILER=log`, así que nunca salía.
- Ahora: `POST /api/clave/olvido` manda un código de 6 dígitos (guardado con hash en `password_reset_tokens`, vence en 15 min, un solo uso) y `POST /api/clave/restablecer` cambia la clave, cierra las otras sesiones y entra. Límite 5/min. Ojo: los `throttle` sin nombre comparten contador por IP.
- App: `olvide.tsx` pide correo → código + contraseña nueva. 12 pruebas pasan; tsc y eslint limpios.
- Correo: Gmail SMTP con contraseña de aplicación; `instalar.sh` la pide (oculta) y la guarda en `secretos/servidor.env`. Falta: push, correr el instalador en la EC2 y nuevo APK.

## 2026-10-28 · Manual de usuario y APK
- Manual en `docs/manual/Manual-de-usuario-Memora.pdf` (17 páginas, 14 secciones), generado con `python generar_manual.py` desde `docs/manual/img/` (capturas del diseño publicado, no de la app compilada).
- Ojo: dos pantallas del diseño difieren de la app real (Nombre pide un solo campo; Pastillero usa cajas de hora en vez de −/+). El texto describe la app real.
- APK EAS listo (build 74917899…, perfil preview, apunta a AWS); Firebase FCM V1 cargado en EAS. Push y rol cuidador aún sin probar en el APK.

## 2026-10-25 · Contexto de Claude y estado reconciliado
- Se identificó la carpeta activa del chat «Memora: planificación del sistema»: `D:\TiomiguelonGgs\Desktop\Memora`; `Documents\MEMORA` es otra versión (React Native 7×3) y no corresponde a esta conversación.
- Leídos AGENTS/CLAUDE, memoria de Claude, PROYECTO/PLAN/BITACORA/DECISIONES, especificación del producto, botones, armado, firmware, app, servidor, despliegue y el historial del chat.
- Estado más reciente confirmado en los registros: prueba app→AWS→MQTT/TLS→ESP32 real con horario, alarma y evento del botón; la app reflejó `Tomada`. La EC2 quedó encendida por decisión del usuario usando créditos; no se volvió a consultar AWS en vivo.
- Commit local `23b5283` (25 oct, 15:07) actualiza el dibujo/guía de distribución por rieles para la variante de buzzer y LED a 5 V; el montaje con transistores aún no está verificado físicamente.
- La respuesta de simulación recomienda Wokwi para ESP32 y Falstad/Tinkercad para el transistor; Wokwi usa DS1307 y no transistores. Mantener esa diferencia frente al montaje real con DS3231 y drivers.
- Pendiente: segundo teléfono/cuidador, probar silenciamiento desde la app, montar/probar variante 5 V y generar APK EAS/configurar Firebase Push. No se modificó código de producto ni se corrieron pruebas en esta tarea.

## 2026-10-22 a 23 · Pastillero y diseño
- Plan del sistema, marca (logo con cápsula en la O), 24 pantallas en el canvas de diseño.
- Armado en protoboard componente por componente. Problemas resueltos: arranque en bucle por carga en 3V3, riel GND cortado, pulsador que rebota, Wi-Fi de 5 GHz.
- Archivos: `firmware/memora/memora.ino`, `docs/armado-y-pruebas.md`.

## 2026-10-24 · Revisión del sistema, QR y API
- Firmware: 4 correcciones (botón largo borraba el Wi-Fi, bloqueo de MQTT sin datos, no reconectaba, primer bip perdido). Probado con hardware: alarma, botón, toma sin internet, reconexión.
- Diseño: corregidas 9 pantallas (Cuenta cortada, botones sin acción, Jorge repetido, 7×3) y agregado "Solo apagar el sonido". Copia en `diseno/vistas/`.
- QR: `assets/qr/hoja-qr-A4.pdf`, clave en `assets/qr/clave-MEM-0001.txt`.
- Caja de trupán diseñada (`caja/`) y descartada por costo: se usa un joyero.
- API Laravel en `servidor/`: modelos, 20 endpoints, worker MQTT, scheduler, push Expo. `php artisan test`: 8 pasan.
- Pendiente: Fase 3 (probar la API con el pastillero real) y la app.

## 2026-10-24 (tarde) · App Expo y prueba de la API con el pastillero
- API: corregido registro sin horario y mensajes de validación en español (`lang/es/validation.php`); 9 pruebas pasan.
- Pastillero recibió el horario publicado por la API ("Horario actualizado"). Prueba del botón pendiente: la zona Wi-Fi del celular se apaga si no hay otro equipo conectado (anotado en armado-y-pruebas).
- Ojo: abrir el puerto serial desde la PC reinicia el ESP32. Vigilar por MQTT (`mqtt:escuchar`).
- App en `app/` (Expo SDK 58): 22 pantallas según `diseno/vistas/`. tsc y eslint limpios; el bundle de Android compila.
- Pendiente: probar en el celular con Expo Go, AWS y APK.

## 2026-10-24 (noche) · Primera prueba de la app en el celular
- La app abrió en Expo Go. Arreglado: expo-notifications no existe en Expo Go (Android) → se carga solo en la APK (`src/lib/push.ts`).
- Nombre completo + alias: la API guarda `name` (nombres y apellidos) y `alias` (cómo saludar; si falta, el primer nombre). El saludo largo rompía la pantalla Hoy.
- 9 pruebas del servidor pasan; tsc y eslint de la app limpios; bundle Android compila.

## 2026-10-25 · Broker público caído
- `test.mosquitto.org` dejó de responder (timeout). La API y el listener ahora lo toleran: `Pastillero` devuelve false y registra el error (la toma igual se confirma; `/pastillero/comando` responde 503 en ~5 s), y `mqtt:escuchar` reintenta cada 5 s. `MQTT_CONNECT_TIMEOUT=5`.
- 10 pruebas pasan. Conclusión: para la demo hace falta el broker propio en AWS (Fase 5).

## 2026-10-25 · Servidor en AWS
- Código en GitHub público `Peugh18/Memora` (sin secretos: clave QR, .env, sqlite, `firmware/memora/secreto.h` en .gitignore). Límite de 5 intentos/min al vincular, invitar y cambiar clave (11 pruebas).
- EC2 ya existía (t4g.small, Ubuntu, nginx de prueba en :80 → el instalador lo apaga). Puertos abiertos desde CloudShell; instalación por Session Manager: OK.
- Verificado desde la PC: HTTPS válido (Let's Encrypt, cadena hasta ISRG Root X1), API responde, broker 8883 con TLS exige usuario/clave.
- Para actualizar el servidor: Session Manager → `sudo bash ~/instalar.sh`.

## 2026-10-24 (21:45) · Prueba de punta a punta contra AWS ✅
- Pastillero con firmware TLS conectado a Mosquitto propio por el Wi-Fi de casa. App (Expo Go) contra https://memmora.duckdns.org: cuenta nueva, vinculado con el QR, horario de noche 21:45 → sonó, evento `alarma` llegó al broker, botón físico → la app mostró "Tomada".
- App: refresco cada 5 s y al volver del fondo; tras guardar horarios se refresca el perfil.
- Pendiente de hardware: buzzer a 5 V con NPN S8050 + 1 kΩ (base) + 10 kΩ (I/O a 5 V); al montarlo, invertir `BUZZER_APAGADO`. Alimentación recomendada: cargador de pared 5 V 2 A.
