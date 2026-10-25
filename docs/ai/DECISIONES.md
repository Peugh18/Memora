# Memora — Decisiones

| Fecha | Decisión | Por qué |
|---|---|---|
| 2026-10-22 | Wi-Fi a la nube (MQTT), no Bluetooth | El cuidador se entera aunque el celular del paciente esté lejos |
| 2026-10-22 | 4 franjas (7 × 4) | Es el pastillero que se compró |
| 2026-10-22 | Solo el paciente confirma tomas | Si el cuidador confirmara, se pierde el sentido del control |
| 2026-10-22 | Cuidador edita solo con `puede_editar` | Lo da el paciente desde "Mi familia" |
| 2026-10-23 | DS3231 alimentado desde GPIO 14 | En el 3V3 el ESP32 no arrancaba (`invalid header`) |
| 2026-10-23 | Buzzer a 3,3 V con patrón bip-bip de dos tonos | A 5 V hace falta transistor; el patrón se nota más con el mismo volumen |
| 2026-10-24 | Pastillero dentro de un joyero comprado | La caja de trupán con láser salió cara |
| 2026-10-24 | QR con `memora://vincular?d=MEM-0001&c=CLAVE` | Dice qué pastillero es de quién; la clave evita que otro lo vincule |
| 2026-10-24 | Botón "Solo apagar el sonido" en la app | El usuario pidió apagar desde el celular; la toma sigue pendiente |
| 2026-10-24 | Mantener el botón 10 s (sin alarma) borra el Wi-Fi | Antes 5 s: apagar la alarma con el botón presionado borraba el Wi-Fi |
| 2026-10-24 | SQLite en vez de PostgreSQL | Un solo servidor y pocos datos: un contenedor menos |
| 2026-10-24 | La rutina vive en `users` (sin tabla patients) | Cada persona tiene una sola rutina; menos tablas |
| 2026-10-24 | PHPUnit (ya viene), no Pest | No agregar dependencias |
| 2026-10-24 | APK con EAS en la nube | No hay Android SDK en la PC |
| 2026-10-24 | Pedir nombres, apellidos y alias | El nombre completo rompía el saludo; la familia ve el alias |
| 2026-10-24 | Push solo en la APK | Expo Go (Android) ya no incluye el módulo de notificaciones |
