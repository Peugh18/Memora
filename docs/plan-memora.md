# Memora: plan del sistema

Fecha: 22 de octubre de 2026 · Estado: decisiones tomadas

Contexto: proyecto universitario que simula un producto real. Se presenta y después se apaga todo en AWS. Objetivo de costo: lo mínimo posible, dentro de los US$ 100 de crédito.

## 1. Qué es Memora

Un pastillero inteligente de 7 × 4 (28 compartimentos: lunes a domingo × mañana, mediodía, tarde, noche) que avisa con sonido y luz cuando toca una toma, y una app (Memora) donde el paciente confirma que la tomó y sus cuidadores ven si la tomó o no.

No es solo para adultos mayores: lo usa cualquier persona que tome medicación.

## 2. Arquitectura en una frase

**El ESP32 se conecta por Wi-Fi a un servidor en AWS (MQTT con TLS). La app habla con ese mismo servidor por HTTPS. El ESP32 y el celular nunca se hablan directo**, salvo en la configuración inicial del Wi-Fi.

```
 [Pastillero ESP32] --MQTT TLS :8883--> [EC2 AWS] <--HTTPS :443-- [App Memora (paciente / cuidador)]
   buzzer + LED                          Mosquitto                    React Native (Expo)
   horario guardado                      API Laravel                  notificaciones push
   hora por NTP                          PostgreSQL
                                         Caddy (HTTPS)
```

### ¿Bluetooth o Wi-Fi?

| Opción | Veredicto |
|---|---|
| Solo Bluetooth (celular ↔ ESP32) | No. Si el celular del paciente está lejos o apagado, el cuidador no se entera de nada. |
| **Wi-Fi a la nube** | **Sí.** El pastillero funciona aunque el celular no esté cerca, y los cuidadores reciben alertas desde cualquier lugar. |
| Bluetooth solo para pasar la clave del Wi-Fi | Posible, pero obliga a usar BLE en React Native (build nativo, permisos). Lo dejamos para después. |

**Configuración del Wi-Fi (primera vez):** el ESP32 crea su propia red `Memora-XXXX`. El usuario se conecta desde el celular, se abre una página, elige su Wi-Fi y escribe la clave (librería WiFiManager). Cero código BLE.

**Vincular el pastillero con la cuenta:** el pastillero lleva pegado un código QR con su ID y un código secreto (`memora://vincular?id=MEM-0001&codigo=XXXX`). El paciente lo escanea con la app (`expo-camera`) y queda vinculado. Debajo del QR va el ID escrito, por si la cámara falla.

## 3. Hardware (según la lista comprada)

| Pieza | Uso | Pin sugerido |
|---|---|---|
| ESP32 DevKit 38 pines (WROOM-32D, micro-USB) | Wi-Fi, horario, alarmas | — |
| Buzzer pasivo MH-FMD | Sonido de alarma (tono con PWM) | GPIO 25 |
| LED verde + 220 Ω | Parpadea en alarma; fijo = conectado | GPIO 26 |
| Pulsador 12 mm (comprar, ~S/ 0,50) | "Ya la tomé" (apaga la alarma) | GPIO 27 ↔ GND, con pull-up interno |
| Powerbank 10 000 mAh + cable USB-C | Alimentación | USB |

Notas importantes:

- **Botón:** se compra un pulsador y va visible en la tapa. Una pata al GPIO 27 y la otra a GND; no necesita resistencia (se usa `INPUT_PULLUP`).
- **Hora sin internet:** reloj **DS3231** (SDA en GPIO 33, SCL en GPIO 32, VCC desde GPIO 14 para no bajar el 3V3 al arrancar). Al encender toma la hora del reloj; cuando hay internet la corrige por NTP.
- **Powerbank:** muchos se apagan solos cuando el consumo es bajo. Probar el suyo con el ESP32 encendido 1 hora. Si se apaga, usar cargador de pared.
- **Un solo LED:** no puede señalar qué compartimento abrir. La app y el sonido avisan; el compartimento lo indica la app ("Martes · Noche"). Si más adelante quieren luz por compartimento, se pasa a una tira WS2812 de 21 LEDs (un solo pin).
- Sin sensores reed: el sistema **no sabe** si se abrió el compartimento. La toma se confirma con el botón o en la app.

## 4. Cómo funciona una toma

1. El servidor envía el horario al pastillero (mensaje MQTT retenido). El ESP32 lo guarda en su memoria.
2. A la hora (ej. 08:00), el ESP32 suena y parpadea **aunque no haya internet en ese momento**.
3. El paciente toma la pastilla y presiona el botón, o toca "Ya la tomé" en la app.
4. El ESP32 apaga la alarma y avisa al servidor: `tomada`.
5. Si en **30 minutos** (configurable) no hay confirmación, el servidor marca `omitida` y envía una notificación push a todos sus cuidadores. Si el cuidador activó "Avisos por WhatsApp", también le llega un mensaje (para la demo: CallMeBot, gratis; cada cuidador lo activa una vez enviando un mensaje al bot). Desde la app, los botones "Llamar" y "WhatsApp" usan `tel:` y `https://wa.me/51…`, sin costo.
6. Si el pastillero lleva más de 10 minutos sin conectarse, los cuidadores ven "Pastillero desconectado".

Temas MQTT:

| Tema | Dirección | Contenido |
|---|---|---|
| `memora/{id}/horario` | servidor → ESP32 (retenido) | horas por franja y qué días tienen toma |
| `memora/{id}/comando` | servidor → ESP32 | `silenciar`, `probar_alarma` |
| `memora/{id}/eventos` | ESP32 → servidor | `alarma`, `tomada`, `encendido` |
| `memora/{id}/estado` | ESP32 → servidor (última voluntad) | `en_linea` / `fuera_de_linea` |

Cada pastillero tiene su propio usuario y clave en Mosquitto y solo puede leer y escribir en `memora/{su id}/#`.

## 5. Roles: paciente y cuidador

- Una **persona** se registra una vez. Puede ser paciente, cuidador o ambos.
- Un paciente puede tener **varios cuidadores** (familiares, enfermera).
- Un cuidador puede tener **varios pacientes**.
- El vínculo se crea con una **invitación**: el paciente comparte un código o enlace; el cuidador lo acepta.

### Qué hace cada uno (decidido)

| Acción | Paciente | Cuidador |
|---|---|---|
| Ver horario y tomas de hoy | Sí | Sí |
| Confirmar "Ya la tomé" | Sí | No, solo el paciente confirma |
| Recibir alerta de toma omitida | Opcional | Sí |
| Crear o editar medicamentos y horarios | Sí | Solo si el paciente le da permiso de "editar" |
| Ver historial y porcentaje de cumplimiento | Sí | Sí |
| Ver estado del pastillero (conectado, batería) | Sí | Sí |
| Quitar a un cuidador | Sí | Puede salirse él mismo |

### Datos (tablas)

```
users            id, nombre, email, celular, tiene_whatsapp, avisos_whatsapp, password, expo_push_token
patients         id, user_id, hora_manana, hora_tarde, hora_noche, minutos_tolerancia, zona_horaria
care_links       patient_id, caregiver_user_id, parentesco, puede_editar, estado (pendiente/activo)
devices          id (del QR), patient_id, secreto_hash, ultima_conexion, firmware
medications      id, patient_id, nombre, dosis, notas
schedule_slots   patient_id, dia (1-7), franja (manana/tarde/noche), medication_id
doses            patient_id, fecha, franja, estado (pendiente/tomada/omitida), confirmada_por, confirmada_en
```

`doses` se genera cada día a partir de `schedule_slots`. Es la tabla que alimenta el historial y las alertas.

## 6. Servidor en AWS (con los US$ 100 de crédito)

Todo en **una sola EC2** (la que ya crearon en us-east-2, sin SSH, administrada con SSM), con Docker Compose:

| Servicio | Para qué |
|---|---|
| Caddy | HTTPS automático (Let's Encrypt) para la API |
| Laravel (API + Sanctum) | Cuentas, roles, horarios, historial |
| Worker Laravel (`mqtt:escuchar`) | Recibe eventos del ESP32 y publica horarios (php-mqtt/laravel-client) |
| Scheduler Laravel (cada minuto) | Genera las tomas del día y marca las omitidas |
| Mosquitto | Broker MQTT con TLS en el puerto 8883 |
| PostgreSQL | Base de datos |

- **Dominio:** gratis con DuckDNS (ej. `memora.duckdns.org`). Caddy saca el certificado HTTPS solo.
- **Puertos abiertos:** 80 (solo para el certificado), 443 (API), 8883 (MQTT). Sin 22.
- **Costo:** t4g.micro (1 GB + 2 GB de swap) ≈ US$ 6 + disco 20 GB ≈ US$ 2 + IP pública ≈ US$ 3,6 → **≈ US$ 12/mes**. Con 100 de crédito sobra para el semestre.
- **Al terminar la presentación:** terminar la EC2, borrar el disco, liberar la IP y borrar el grupo de seguridad. Así no queda nada cobrando.
- Sin respaldos a S3: es un prototipo.

¿Por qué no AWS IoT Core? Funciona, pero exige certificados por dispositivo y reglas extra. Mosquitto en la misma máquina es más simple para un prototipo.

## 7. App Memora (React Native)

- **Expo** con `expo-router` y `expo-notifications` (push). Se prueba con Expo Go en el celular mientras se desarrolla.
- **Se entrega como APK** para Android: `eas build -p android --profile preview` (plan gratuito de EAS) genera el `.apk` para instalar directo en cualquier celular.
- La APK es solo la app. Igual necesita el servidor: sin él, el cuidador no se entera de nada y el pastillero no recibe horarios.
- Un solo inicio de sesión. Si la persona tiene pacientes a cargo, aparece un selector "Yo / Mamá / Papá…".

Pantallas:

1. Ingreso y registro
2. **Hoy:** las 3 tomas del día con estado y botón "Ya la tomé"
3. **Pastillero:** cuadrícula 7 × 4 con los medicamentos de cada compartimento (igual al físico)
4. Medicamentos (crear, editar)
5. Historial y cumplimiento semanal
6. Cuidadores (invitar, permisos) / Mis pacientes
7. Vincular pastillero (escanear QR + guía para el Wi-Fi)
8. Ajustes (horas de mañana, tarde y noche; tolerancia)

## 8. Marca

- Nombre: **Memora** (memoria + hora).
- Logo: "MEMORA" con la O como aro turquesa y una cápsula adentro, más tres rayitos de aviso. Ícono de app: la cápsula sobre olas (assets/marca).
- Color: verde azulado calmado (salud, confianza) con un acento cálido para las alertas. Alto contraste y letra grande: la app la usan personas con poca vista.
- Flujo: GPT genera referencias → se elige una → se redibuja en SVG → se entrega en SVG, PNG y PDF en la carpeta de assets `01 Marca`.

## 9. Fases

| Fase | Resultado | Cómo se comprueba |
|---|---|---|
| 0. Pastillero en protoboard | Firmware: WiFiManager, NTP, MQTT, alarma, botón ([firmware](../firmware/memora/memora.ino), [guía](armado-y-pruebas.md)) | Con MQTT Explorer y el broker público: suena a la hora y llega `tomada` |
| 1. Diseño | Logo, íconos y vistas móviles con su flujo ([lienzo](https://claude.ai/artifact/PHbUzRPzKR3KtrSFbLGTHj)) | Vistas aprobadas por el equipo |
| 2. Servidor | EC2 con Docker, Caddy, Mosquitto con TLS y Postgres | `mosquitto_sub` desde la PC por 8883 |
| 3. API | Laravel: cuentas, pacientes, cuidadores, horarios, tomas, worker MQTT | Pruebas Pest del flujo tomada/omitida |
| 4. App | Expo: Hoy, Pastillero 7×3, Medicamentos, Vincular | Confirmar en la app apaga la alarma del ESP32 |
| 5. Cuidadores | Invitaciones, permisos, push de omitidas | Cuidador recibe push a los 30 min |
| 6. Caja y presentación | Base MDF, QR pegado, APK instalada | Prototipo completo para presentar |

## 10. Decisiones

1. El cuidador **no** confirma tomas; solo el paciente.
2. El cuidador edita horarios si el paciente le da el permiso (`puede_editar`).
3. **4 franjas**, como el pastillero que se consiguió: mañana, mediodía, tarde y noche (28 compartimentos).
4. Botón: se compra un pulsador.
5. Backend en Laravel en la EC2; la app se entrega como APK.
6. Dominio gratis con DuckDNS. Se apaga todo después de presentar.
7. Con QR: el pastillero se vincula escaneándolo (el ID escrito queda de respaldo).
8. Primero se prueba el pastillero sin servidor propio (broker público de pruebas). La EC2 se monta cuando el firmware y las vistas estén listos.
9. La app es solo para celular (Android, APK).

Pendiente: fecha de presentación.
