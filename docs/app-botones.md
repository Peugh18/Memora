# Memora: qué hace cada botón de la app

Guía para programar la app (Expo). Las pantallas están en el diseño: https://claude.ai/artifact/PHbUzRPzKR3KtrSFbLGTHj

Comandos al pastillero por MQTT (`memora/MEM-0001/comando`): `probar_alarma`, `silenciar`. El horario se publica en `memora/MEM-0001/horario` (retenido) con las 4 horas y los 28 `tomas`. El pastillero publica `alarma` y `tomada` en `memora/MEM-0001/eventos`. La app no habla MQTT directo: llama a la API y el servidor publica.

## Crear la rutina

| Pantalla | Botón | Qué hace |
|---|---|---|
| Bienvenida | Crear mi rutina | Va a Nombre |
| | Iniciar sesión | Va a Login |
| Nombre, Celular | Continuar | Guarda en memoria local y avanza |
| Rol | Continuar | Paciente o ambos → Horarios. Solo cuida → Cuenta → Código |
| Horarios | Continuar | Guarda las 4 horas (08:00, 13:00, 18:00 y 21:00 por defecto) |
| 1.er medicamento | Agregar y continuar / Lo agrego después | Guarda o salta |
| Cuenta | Crear cuenta | `POST /registro` con todo lo anterior → token |
| | Ojo | Muestra u oculta la contraseña |
| Vincular | (cámara) | Lee el QR `memora://vincular?d=MEM-0001&c=CLAVE` → `POST /pastilleros/vincular` |
| | Escribir el código a mano | Campo `MEM-0001-CLAVE` (está bajo el QR) |
| | Ya lo conecté / Lo haré después | Va a Lista |
| Lista | Ir a mi día / Invitar a un familiar | Hoy / Mi familia |
| Login | Ingresar | `POST /login`. Paciente → Hoy, solo cuidador → Personas que cuido |
| Olvidé mi contraseña | Enviar enlace | `POST /clave/olvido` (siempre responde "revisa tu correo") |

## Paciente

| Pantalla | Botón | Qué hace |
|---|---|---|
| Hoy | Ya la tomé | `POST /tomas/{id}/tomada`. El servidor marca tomada y manda `silenciar` |
| | Solo apagar el sonido | `POST /pastillero/silenciar` → `silenciar`. La toma sigue pendiente (a los 30 min, omitida y aviso a la familia) |
| | Deshacer | `DELETE /tomas/{id}/tomada` (solo unos minutos después) |
| | Avatar / En línea | Perfil / Pastillero |
| Pastillero | Probar sonido / Apagar | `probar_alarma` / `silenciar` |
| | Guardar horarios | `PUT /horario` → el servidor publica el horario retenido |
| Medicamentos | Cada medicamento | Abre el formulario con sus datos (editar) |
| Nuevo medicamento | Guardar medicamento | `POST` o `PUT /medicamentos` → recalcula `tomas` y publica el horario |
| Historial | (solo lectura) | `GET /historial?semana=` |
| Mi familia | Llamar / WhatsApp | `tel:` / `https://wa.me/51…` |
| | Puede editar mis horarios | `PATCH /cuidadores/{id}` `puede_editar` |
| | Copiar código | Copia el código de invitación (vence en 24 h) |
| | Compartir por WhatsApp | `https://wa.me/?text=…código…` |
| Perfil | Datos personales / Cambiar contraseña | Pantalla Datos personales |
| | Avisar a mi familia tras | `PATCH /perfil` tolerancia (15–60 min) |
| | Avisos en el celular / por WhatsApp | `PATCH /perfil` |
| | Cambiar el Wi-Fi del pastillero | Pantalla Vincular (pasos del Wi-Fi) |
| | Cerrar sesión | Borra el token → Bienvenida |
| Datos personales | Guardar cambios | `PATCH /perfil` y `PUT /clave` si llenó la contraseña |

## Cuidador

| Pantalla | Botón | Qué hace |
|---|---|---|
| Código de invitación | Unirme | `POST /invitaciones/{codigo}` con parentesco |
| Personas que cuido | Cada persona / aviso | Detalle de la persona |
| Detalle | Llamar / WhatsApp | `tel:` / `wa.me` con mensaje listo |
| | Editar sus horarios | Pastillero de esa persona, solo si `puede_editar`; si no, el botón no aparece |

## Lo que el hardware ya hace (probado el 24 oct 2026)

- Suena a la hora aunque no haya internet (hora del DS3231 y horario guardado).
- El botón físico apaga la alarma y avisa `tomada`; mantenerlo 10 s sin alarma borra el Wi-Fi.
- Se reconecta solo al volver el Wi-Fi.
- Si no hay internet al apretar el botón, el aviso `tomada` se pierde (pendiente: cola local).
