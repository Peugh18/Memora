# Memora: armado del prototipo y pruebas

Todo va en protoboard, sin soldar. Se arma en casa o en el laboratorio de la universidad; solo hace falta una laptop con Arduino IDE y un cable **micro-USB de datos** (algunos cables solo cargan).

## 0. La placa

**ESP32 DevKit de 38 pines** (módulo ESP32-WROOM-32D, chip USB CP2102, conector **micro-USB**). Viene con los pines ya soldados.

- El cable del powerbank tiene que ser **USB-A a micro-USB**, no USB-C.
- El firmware usa los pines 25, 26 y 27, que están seguidos en la misma fila que 3V3 y GND.

## 1. Conexiones

Fila de pines del lado de **3V3**, leyendo desde el USB hacia la antena:

`5V · CMD · D3 · D2 · 13 · GND · 12 · 14 · `**`27 · 26 · 25`**` · 33 · 32 · 35 · 34 · VN · VP · EN · 3V3`

| Componente | Pata | Va a |
|---|---|---|
| Buzzer MH-FMD | VCC | **3V3** |
| | I/O (S) | **25** |
| | GND | riel azul (−) |
| LED verde | pata larga (+) | resistencia 220 Ω → **26** |
| | pata corta (−) | riel azul (−) |
| Pulsador (4 patas) | una pata | **27** |
| | la pata **en diagonal** | riel azul (−) (no lleva resistencia) |
| Puente | **GND** de la placa (el que está entre 13 y 12) | riel azul (−) |
| Powerbank | USB-A → micro-USB | puerto de la placa |

### Cómo ponerla en la protoboard

Esta placa es ancha: en la protoboard de 830 deja **un solo hueco libre en un lado** y ninguno en el otro.

1. Pónganla atravesando el canal central, con la fila de **3V3 / 25 / 26 / 27** en el lado que queda con un hueco libre. Prueben girándola: si el lado de 3V3 queda sin huecos, denle la vuelta (USB al otro extremo).
2. En el hueco libre de cada pin (25, 26, 27, GND y 3V3) va **un cable macho-macho** hacia la otra mitad de la protoboard o al riel.
3. La resistencia de 220 Ω va en la protoboard, entre el cable del 26 y el cable que sube al LED.
4. Todas las tierras van al riel azul (−).

### Hueco por hueco (armado probado el 23 de octubre de 2026)

ESP32 con el micro-USB a la izquierda, fila de 3V3/25/26/27 en la **fila b**, columnas **10 a 28** (GND en b15, 14 en b17, 27 en b18, 26 en b19, 25 en b20, 33 en b21, 32 en b22, 3V3 en b28). Solo la fila **a** queda libre para cables.

**Importante:** en esta protoboard el riel − está cortado a la mitad. **Todas las tierras van a la mitad izquierda** del riel − de arriba.

| Pieza | Conexión |
|---|---|
| Tierra | a15 (GND) → riel − izquierdo |
| Reloj DS3231 (hembra-macho) | VCC → **a17 (pin 14)** · SDA → a21 (33) · SCL → a22 (32) · GND → riel − izquierdo |
| LED (al frente de la caja) | a19 (26) → a48 · resistencia b48 → b50 · pata larga a la col. 50 · pata corta → riel − izquierdo |
| Pulsador 12 mm (soldado, al frente) | a18 (27) → una pata · la pata **en diagonal** → riel − izquierdo |
| Buzzer MH-FMD (orden impreso: GND · I/O · VCC) | puente a28 (3V3) → a33 · puente a20 (25) → a37 · **resistencia 220 Ω c33 → c37** · VCC → b33 · I/O → b37 · GND → riel − izquierdo |

Por qué así:
- **Reloj desde el pin 14** y **resistencia entre el pin 25 y 3V3**: si algo consume del 3V3 justo al arrancar, el ESP32 no lee su memoria y se reinicia en bucle (`invalid header: 0xffffffff`).
- **Pulsador soldado**: las hembras Dupont no agarran sus patas. El código apaga la alarma al primer contacto porque el botón rebota mucho.
- **Energía**: usar un cargador de celular (5V, 2A) o el powerbank. El USB de la laptop da poca corriente y causa reinicios (`Guru Meditation Error`).
- **Buzzer y LED a 5 V con transistores (versión final, 25 oct 2026)**: 2 × S8050 (o 2N2222/BC547), 2 × 1 kΩ, 1 × 10 kΩ, 1 × 150 Ω.
  - Buzzer: a10 (5V) → a33; VCC → b33; 10 kΩ c33→c37 (reemplaza la de 220 Ω); I/O → b37; T1 E=d40 B=d41 C=d42; a37→a42; 1 kΩ c41→c44; a20 (pin 25) → a44; a40 → riel − izquierdo. Quitar a28→a33 y a20→a37.
  - LED: a19 (pin 26) → a46; 1 kΩ c46→c49; T2 E=d48 B=d49 C=d50; a48 → riel − izquierdo; pata corta → b50; pata larga → b54; 150 Ω c54→c57; e33→e57 (5V).
  - Firmware: `BUZZER_APAGADO = LOW`. El LED no cambia de lógica.

### Del protoboard al frente de la caja

LED, pulsador y buzzer **no van en la protoboard**: van fijos en el frente de la caja. Se conectan con los cables **hembra-macho**:

- El lado **macho** entra en la protoboard.
- En el lado **hembra** se meten directamente las patas del LED, del pulsador y los pines del buzzer.
- Aseguren cada unión con un poco de cinta aislante o silicona caliente para que no se suelte al mover la caja.

Primero prueben todo sobre la mesa con los componentes en la protoboard; recién cuando funcione, pásenlos al frente de la caja.

## 2. Cargar el firmware

1. Instalar [Arduino IDE 2](https://www.arduino.cc/en/software).
2. Archivo > Preferencias > URLs adicionales:
   `https://espressif.github.io/arduino-esp32/package_esp32_index.json`
3. Herramientas > Placa > Gestor de placas: instalar **esp32** de Espressif.
4. Gestor de librerías: instalar **WiFiManager** (tzapu), **PubSubClient** (Nick O'Leary), **ArduinoJson** (Benoit Blanchon) y **RTClib** (Adafruit).
5. Abrir `firmware/memora/memora.ino`. Placa: **ESP32 Dev Module**. Conectar el micro-USB y elegir el puerto COM que aparece.
6. Subir. Si se queda en `Connecting...`, mantener presionado el botón BOOT de la placa hasta que empiece.
7. Abrir el Monitor serie a **115200**.

Si Windows no ve el puerto COM, falta el driver **CP210x** de Silicon Labs (el chip que dice SILABS junto al USB).

## 3. Primera conexión al Wi-Fi

1. Al encender, el ESP32 crea la red **Memora-MEM-0001**.
2. Conectarse desde el celular. Se abre una página (si no, entrar a `192.168.4.1`).
3. Elegir el Wi-Fi de la casa y escribir la clave. Ojo: el ESP32 solo usa **2,4 GHz**.
4. El LED queda **fijo** cuando ya está conectado al servidor de mensajes.

Para cambiar de Wi-Fi: mantener el pulsador **5 segundos** y soltar.

## 4. Probar sin servidor propio

Usamos el broker público `test.mosquitto.org` y el programa **MQTT Explorer** en la PC. Cualquiera puede ver esos mensajes: no manden datos reales.

1. Instalar [MQTT Explorer](https://mqtt-explorer.com/). Conectar a `test.mosquitto.org`, puerto `1883`.
2. Buscar `memora/MEM-0001/estado`: debe decir `en_linea`.
3. **Prueba de sonido:** publicar en `memora/MEM-0001/comando` el texto `probar_alarma`. Suena y parpadea. Presionar el pulsador: se calla.
4. **Prueba de toma real:** publicar en `memora/MEM-0001/horario`, marcando **retain**, con la hora de mañana en 2 minutos:
   ```json
   {"manana":"10:32","mediodia":"13:00","tarde":"18:00","noche":"21:00","tomas":"1111111111111111111111111111"}
   ```
   El Monitor serie dice `Horario actualizado`. A las 10:32 suena; en `memora/MEM-0001/eventos` aparece `"tipo":"alarma"`. Presionar el pulsador: aparece `"tipo":"tomada"`.
5. **Silenciar desde la "app":** repetir la prueba 4 y, mientras suena, publicar `silenciar` en `comando`.
6. **Sin internet:** con el horario ya recibido, apagar el router. A la hora programada debe sonar igual.
7. **Apagado y sin internet:** apagar el router, desconectar el pastillero 1 minuto y volver a conectarlo. El Monitor serie dice `Hora tomada del DS3231` y a la hora programada suena igual.
8. **Powerbank:** dejarlo encendido 1 hora. Si el powerbank se apaga solo, usar un cargador de pared para la demo.

El texto `tomas` tiene 28 caracteres: de 4 en 4, de lunes a domingo, en orden mañana, mediodía, tarde y noche (las 4 filas del pastillero: Morning, Midday, Afternoon, Night). `1` = hay pastilla, `0` = vacío.

### Si algo falla

| Síntoma | Qué revisar |
|---|---|
| Suena todo el tiempo o hace un zumbido sin alarma | Cambiar `BUZZER_APAGADO` a `LOW` |
| Suena bajito | Probar `TONO_HZ` entre 2000 y 4000 |
| No suena a la hora | Que el Monitor serie haya dicho `Horario actualizado` y que el día tenga `1` en `tomas` |
| El ESP32 no ve la zona Wi-Fi del celular | El celular apaga la zona cuando nadie está conectado. En sus ajustes, poner "Apagar automáticamente" en "Nunca" (o mantener otro equipo conectado) |
| LED nunca queda fijo | Wi-Fi de 5 GHz o la red de la universidad con portal de ingreso: usar el hotspot del celular |

## 5. La caja (cofre de trupán con corte láser)

Archivos en `caja/`: **`memora-caja-manual.pdf`** (manual de armado paso a paso con dibujos), **`memora-caja-corte.pdf` / `.dxf` / `.svg`** para el taller (rojo = cortar, negro = grabar) y `memora-caja-guia.png` con el nombre de cada pieza. Para cambiar medidas, editar las primeras líneas de `caja/generar_caja.py` y correr `python generar_caja.py`.

Por dentro, de abajo hacia arriba:

1. **Piso.**
2. **Compartimiento de la electrónica**, de 4 cm de alto: protoboard y ESP32. LED, pulsador y buzzer van en el frente. El USB sale por el costado izquierdo.
3. **Repisa sacable** apoyada en 2 listones pegados a los costados. Se levanta por su agujero para mostrar la electrónica.
4. **Bandeja-pastillero sacable** de trupán: 28 huecos de 3 × 3 × 2,5 cm hechos con 9 separadores encajados en cruz. El piso tiene grabado el día y la toma de cada hueco, con la mañana adelante. Se saca agarrándola por las muescas de los costados de la caja.
5. **Tapa** con ventana de acrílico y bisagras atrás.

- **Material:** trupán (MDF) de 3 mm, 23 piezas. Aparte, acrílico transparente de 2 mm de 214 × 115 mm para la ventana.
- **Medidas exteriores:** 24,4 × 14,5 × 8 cm con la tapa. El acrílico queda 1 mm por encima de los separadores, así las pastillas no pasan de un hueco a otro.
- **Ferretería:** 2 bisagras pequeñas y 1 cierre tipo broche (como el cofre de referencia). Se pegan con pegamento epóxico porque el trupán de 3 mm no agarra tornillos.
- **Armado:** cola sintética en los cantos. Las paredes van sobre el piso; los costados van entre el frente y la parte de atrás. Los listones se pegan a 4 cm del piso por dentro.
- **Grabado:** el logo Memora va en el frente, entre el broche y los controles.

El QR se graba o pega en el costado cuando el servidor genere el código de cada pastillero.
