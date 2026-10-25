# Memora — Prompt maestro

> Léelo antes de cualquier tarea. Es la fuente de verdad para cualquier modelo (Claude, GPT, Gemini, Codex u otro).
> Última actualización: 2026-10-24

## Qué es
Pastillero inteligente de 7 × 4 (lunes a domingo × mañana, mediodía, tarde, noche) que suena y parpadea a la hora de cada toma, más una app Android donde el paciente confirma y sus cuidadores ven si la tomó. Proyecto universitario (Trujillo, Perú): se presenta y después se apaga todo en AWS.

## Objetivo de esta etapa
Terminar el sistema completo para la presentación: servidor en AWS + app (APK) conectados al pastillero real. Listo cuando confirmar en la app apaga la alarma del ESP32, y una toma sin confirmar en 30 min le avisa al cuidador. Fecha de presentación: por definir.

## Usuarios
- **Paciente:** recibe la alarma, confirma con el botón físico o en la app, maneja su rutina y su familia.
- **Cuidador:** ve las tomas de las personas que cuida, recibe aviso si una se omite, llama o escribe por WhatsApp. **Nunca confirma tomas.** Edita horarios solo si el paciente le da `puede_editar`.
- Una persona puede ser las dos cosas.

## Partes y carpetas
| Carpeta | Qué hay |
|---|---|
| `firmware/memora/memora.ino` | ESP32 (probado con hardware real). Ver `docs/armado-y-pruebas.md` |
| `servidor/` | API Laravel 13 (PHP 8.3), SQLite, Sanctum, php-mqtt |
| `app/` | App Expo SDK 58 (expo-router). Pantallas en `src/app/`, tokens en `src/lib/tema.ts`, componentes en `src/components/ui.tsx` |
| `diseno/vistas/*.dc.html` | **Diseño aprobado de las 24 pantallas** (HTML con estilos en línea). Copiar fielmente |
| `docs/app-botones.md` | Qué hace cada botón de cada pantalla y a qué endpoint llama |
| `docs/plan-memora.md` | Plan original y decisiones de producto |
| `assets/marca/`, `assets/qr/` | Logo, ícono, ilustraciones; QR imprimible del pastillero MEM-0001 |
| `caja/` | Caja de trupán (descartada por costo: se usa un joyero). Solo respaldo |

## Arquitectura
```
[ESP32] --MQTT--> [Mosquitto] <--php-mqtt-- [Laravel: API + mqtt:escuchar + scheduler] <--HTTPS-- [App Expo]
```
- Temas MQTT: `memora/{id}/horario` (servidor→ESP32, retenido: `{"manana":"08:00",...,"tomas":"28 chars"}`), `memora/{id}/comando` (`silenciar`, `probar_alarma`), `memora/{id}/eventos` (ESP32→servidor: `{"tipo":"alarma|tomada","franja":"manana","fecha":"2026-10-24"}`), `memora/{id}/estado` (`en_linea` / `fuera_de_linea`, última voluntad).
- `tomas`: 28 caracteres, de 4 en 4 por día empezando el lunes, orden mañana-mediodía-tarde-noche. `1` = hay medicamento.
- La app **nunca** habla MQTT: llama a la API y el servidor publica.
- Lógica de negocio en `servidor/app/Services/Tomas.php` (estados de tomas, omitidas, push) y `Pastillero.php` (publicar por MQTT).
- Producción: `https://memmora.duckdns.org` (API) y `memmora.duckdns.org:8883` (Mosquitto con TLS; usuario = ID del pastillero, clave = la del QR). Despliegue en `despliegue/` (ver su README).

## Comandos (servidor)
| Para | Comando (en `servidor/`) |
|---|---|
| Instalar | `composer install && cp .env.example .env && php artisan key:generate && php artisan migrate` |
| API local | `php artisan serve --host=0.0.0.0` |
| Escuchar pastilleros | `php artisan mqtt:escuchar` |
| Revisar tomas cada minuto | `php artisan schedule:work` |
| Registrar el pastillero | `php artisan pastillero:crear MEM-0001 <clave de assets/qr/clave-MEM-0001.txt>` |
| Pruebas | `php artisan test` (9 pruebas, deben pasar todas) |

## Comandos (app, en `app/`)
| Para | Comando |
|---|---|
| Instalar | `npm install` (paquetes nuevos: `npx expo install <paquete>`) |
| Probar en el celular | `npx expo start --lan` y escanear con Expo Go (mismo Wi-Fi que la PC) |
| URL de la API | `app/.env` → `EXPO_PUBLIC_API_URL=http://<IP de la PC>:8000` |
| Revisar | `npx tsc --noEmit && npx eslint src` |
| APK | `npx eas-cli@latest build -p android --profile preview` (el usuario hace `eas login`) |

## Diseño (tokens del diseño aprobado)
- Fuente: **Onest** (400–800). Fondo: degradado `#DDF1F7 → #F3FAFC`. Texto `#0E2733`, secundario `#4A5F68`.
- Marca: turquesa `#0D7385`, petróleo `#0A4A66`, `#0E7C8E`; tarjetas blancas radio 20–26 px y sombra suave `rgba(10,74,102,.5)`.
- Acento de alarma: ámbar `#FFB547`. Confirmada `#0095A8`, sin confirmar `#E08A1E`.
- Filas del pastillero: mañana amarilla `#FDF1C7`/`#7A5A00`, mediodía celeste `#DCEEFB`/`#1F5F94`, tarde lila `#EEE6FB`/`#5B3E9E`, noche rosa `#FCE4EE`/`#9B2C57`.
- Botón principal 58 px de alto, radio 18 px, degradado `#0E7C8E → #0A4A66`. Letra grande: lo usan personas mayores.
- Navegación inferior del paciente: Hoy · Historial · (+) · Pastillero · Familia. Cuidador: Personas · Perfil.

## Convenciones
- Todo texto visible en **español de Perú**, claro y sin jerga. Celulares de 9 dígitos con +51.
- Zona horaria `America/Lima`. Franjas: `manana`, `mediodia`, `tarde`, `noche` (sin tildes en el código).
- Laravel: controladores delgados, validación en el controlador, lógica en `app/Services`. Fechas de tomas como texto `Y-m-d`.
- Comentarios solo cuando explican el porqué. Marcar con `ponytail:` los atajos con límite conocido.

## Reglas de trabajo
1. No hacer commit ni push sin que el usuario lo pida. No agregar dependencias sin avisar.
2. Antes de decir "listo": correr `php artisan test` y mostrar el resultado.
3. Las conexiones de hardware se explican **siempre con dibujo** de la protoboard.
4. Nunca escribir contraseñas ni la clave del Wi-Fi del usuario en el chat o en archivos.
5. Al terminar una tarea: actualizar `docs/ai/PLAN.md` y agregar entrada en `docs/ai/BITACORA.md`.

## No tocar
- Pines del firmware (25 buzzer, 26 LED, 27 botón, 33/32 reloj, 14 VCC del reloj): están probados; ver `docs/armado-y-pruebas.md`.
- La clave de `assets/qr/clave-MEM-0001.txt`: ya está impresa en el QR.
