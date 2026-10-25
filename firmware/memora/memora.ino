// Memora: firmware del pastillero (ESP32 DevKit 38 pines, WROOM-32D; en Arduino IDE: "ESP32 Dev Module")
// Librerías (Arduino IDE > Herramientas > Gestor de librerías):
//   WiFiManager (tzapu), PubSubClient (Nick O'Leary), ArduinoJson 7 (Benoit Blanchon), RTClib (Adafruit)
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <WiFiManager.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <time.h>
#include <Wire.h>
#include <RTClib.h>
#include <esp_sntp.h>
#include "secreto.h"  // dominio y clave del QR: copiar secreto.h.example a secreto.h (no se sube a git)

// ---- Configuración ----
const char* DEVICE_ID = "MEM-0001";
const char* MQTT_HOST = MEMORA_DOMINIO;        // broker propio en la EC2 (Mosquitto con TLS)
const int   MQTT_PORT = 8883;
const char* MQTT_USER = DEVICE_ID;             // cada pastillero entra con su ID...
const char* MQTT_PASS = MEMORA_CLAVE;          // ...y la clave impresa en su QR
const char* ZONA_HORARIA = "<-05>5";           // Perú, UTC-5
const char* WIFI_RED   = "";                   // opcional: red fija (2,4 GHz) que se prueba antes del portal
const char* WIFI_CLAVE = "";

const int PIN_BUZZER = 25;  // 25, 26 y 27 están seguidos en la fila de 3V3
const int PIN_LED    = 26;
const int PIN_BOTON  = 27;
const int PIN_SDA    = 33;  // reloj DS3231: 33 y 32 están en la misma fila, junto a 25
const int PIN_SCL    = 32;
const int PIN_RTC_VCC = 14;  // el DS3231 se alimenta desde este pin: si va al 3V3, al prender baja el voltaje y el ESP32 no arranca
// Con transistor NPN (S8050): pin 25 en ALTO = el transistor baja el I/O del buzzer = suena a 5 V. En reposo, LOW.
// Sin transistor (buzzer directo al pin y a 3V3) era HIGH: cambiarlo de vuelta si se quita el transistor.
const int BUZZER_APAGADO = LOW;
int tonoHz = 2700;               // ajustar: cada buzzer suena más fuerte en una frecuencia distinta
const unsigned long ALARMA_MAX_MS = 30UL * 60 * 1000;  // igual a la tolerancia del servidor
const unsigned long RESET_WIFI_MS = 10000;             // mantener el botón 10 s (sin alarma) borra el Wi-Fi

// El pastillero tiene 4 filas: Morning, Midday, Afternoon, Night
const int N_FRANJAS = 4;
const char* FRANJAS[N_FRANJAS] = {"manana", "mediodia", "tarde", "noche"};
const int PRUEBA = N_FRANJAS;  // alarma de prueba: no se reporta como toma

// Raíces de Let's Encrypt (ISRG Root X1 y X2): el certificado del broker es el mismo que el HTTPS de Caddy
const char* CA_LETSENCRYPT = R"(
-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4
WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu
ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY
MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc
h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+
0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U
A5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sW
T8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyH
B5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3x+UC
B5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0SHzUv
KBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWn
OlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTn
jh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbw
qHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CI
rU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV
HRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkq
hkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL
ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ
3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KK
NFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5
ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhdjsnvzqvHu7Ur
TkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW0wdeRlN8NwdC
jNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb+ZAJzVc
oyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq
4RgqsahDYVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPA
mRGunUHBcnWEvgJBQl9nJEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57d
emyPxgcYxn/eR44/KJ4EBs+lVDR3veyJm+kXQ99b21/+jh5Xos1AnX5iItreGCc=
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
MIICGzCCAaGgAwIBAgIQQdKd0XLq7qeAwSxs6S+HUjAKBggqhkjOPQQDAzBPMQsw
CQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJuZXQgU2VjdXJpdHkgUmVzZWFyY2gg
R3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBYMjAeFw0yMDA5MDQwMDAwMDBaFw00
MDA5MTcxNjAwMDBaME8xCzAJBgNVBAYTAlVTMSkwJwYDVQQKEyBJbnRlcm5ldCBT
ZWN1cml0eSBSZXNlYXJjaCBHcm91cDEVMBMGA1UEAxMMSVNSRyBSb290IFgyMHYw
EAYHKoZIzj0CAQYFK4EEACIDYgAEzZvVn4CDCuwJSvMWSj5cz3es3mcFDR0HttwW
+1qLFNvicWDEukWVEYmO6gbf9yoWHKS5xcUy4APgHoIYOIvXRdgKam7mAHf7AlF9
ItgKbppbd9/w+kHsOdx1ymgHDB/qo0IwQDAOBgNVHQ8BAf8EBAMCAQYwDwYDVR0T
AQH/BAUwAwEB/zAdBgNVHQ4EFgQUfEKWrt5LSDv6kviejM9ti6lyN5UwCgYIKoZI
zj0EAwMDaAAwZQIwe3lORlCEwkSHRhtFcP9Ymd70/aTSVaYgLXTWNLxBo1BfASdW
tL4ndQavEi51mI38AjEAi/V3bNTIZargCyzuFJ0nN6T5U6VR5CmD1/iQMVtCnwr1
/q4AaOeMSQ+2b1tbFfLn
-----END CERTIFICATE-----
)";

Preferences prefs;
WiFiClientSecure red;
PubSubClient mqtt(red);
RTC_DS3231 rtc;
bool hayRtc = false;
volatile bool ntpSincronizado = false;

int horaMin[N_FRANJAS] = {8 * 60, 13 * 60, 18 * 60, 21 * 60};  // minutos desde la medianoche
String tomas = "0000000000000000000000000000";                  // 28 caracteres: lunes mañana, lunes mediodía, ..., domingo noche
int ultimoDia[N_FRANJAS] = {-1, -1, -1, -1};                    // día del año en que ya sonó cada franja
int alarmaFranja = -1;                         // -1 = sin alarma
unsigned long alarmaDesde = 0;
int tonoSonando = -1;                          // lo que sonarAlarma() puso por última vez

String tema(const char* sufijo) { return String("memora/") + DEVICE_ID + "/" + sufijo; }

// {"manana":"08:00","mediodia":"13:00","tarde":"18:00","noche":"21:00","tomas":"1111111111111111111111111111"}
bool aplicarHorario(const String& json, bool guardar) {
  JsonDocument doc;
  if (deserializeJson(doc, json)) return false;
  const char* nuevas = doc["tomas"] | "";
  if (strlen(nuevas) != 7 * N_FRANJAS) return false;
  int minutos[N_FRANJAS];
  for (int f = 0; f < N_FRANJAS; f++) {
    int hh, mm;
    if (sscanf(doc[FRANJAS[f]] | "", "%d:%d", &hh, &mm) != 2 || hh > 23 || mm > 59) return false;
    minutos[f] = hh * 60 + mm;
  }
  memcpy(horaMin, minutos, sizeof minutos);
  tomas = nuevas;
  if (guardar) {
    prefs.begin("memora", false);
    prefs.putString("horario", json);
    prefs.end();
  }
  return true;
}

void cargarHorario() {
  prefs.begin("memora", true);
  String json = prefs.getString("horario", "");
  prefs.end();
  if (json.length()) aplicarHorario(json, false);
}

// ponytail: si no hay conexión al confirmar, el evento se pierde y el servidor la marcará omitida; guardar una cola si molesta en la demo
void publicarEvento(const char* tipo, int franja) {
  struct tm t;
  if (!getLocalTime(&t, 0)) return;
  char fecha[11];
  strftime(fecha, sizeof fecha, "%Y-%m-%d", &t);
  JsonDocument doc;
  doc["tipo"] = tipo;
  doc["franja"] = FRANJAS[franja];
  doc["fecha"] = fecha;
  String out;
  serializeJson(doc, out);
  mqtt.publish(tema("eventos").c_str(), out.c_str());
  Serial.println("Evento: " + out);
}

void iniciarAlarma(int franja) {
  alarmaFranja = franja;
  alarmaDesde = millis();
  tonoSonando = -1;
  if (franja != PRUEBA) publicarEvento("alarma", franja);
}

void detenerAlarma() {
  alarmaFranja = -1;
  noTone(PIN_BUZZER);
  digitalWrite(PIN_BUZZER, BUZZER_APAGADO);
}

// Tres bips cortos y una pausa, alternando dos tonos: se nota más que un pitido parejo con el mismo volumen
void sonarAlarma() {
  unsigned long t = (millis() - alarmaDesde) % 1200;
  int ahora = (t < 600 && (t % 200) < 120) ? 1 + (t / 200) % 2 : 0;  // 0 = silencio, 1 y 2 = tonos
  if (ahora == tonoSonando) return;
  tonoSonando = ahora;
  digitalWrite(PIN_LED, ahora != 0);
  if (ahora) tone(PIN_BUZZER, ahora == 1 ? tonoHz : tonoHz + 800);
  else { noTone(PIN_BUZZER); digitalWrite(PIN_BUZZER, BUZZER_APAGADO); }
}

void alRecibir(char* topic, byte* payload, unsigned int len) {
  String msg;
  for (unsigned int i = 0; i < len; i++) msg += (char)payload[i];
  String t = topic;
  if (t == tema("horario")) {
    Serial.println(aplicarHorario(msg, true) ? "Horario actualizado" : "Horario inválido: " + msg);
  } else if (t == tema("comando")) {
    Serial.println("Comando: " + msg);
    if (msg == "silenciar") detenerAlarma();             // el paciente confirmó desde la app
    else if (msg == "probar_alarma") iniciarAlarma(PRUEBA);
    else if (msg.startsWith("tono:")) {  // "tono:3000": prueba una frecuencia para buscar la más fuerte
      tonoHz = msg.substring(5).toInt();
      Serial.printf("Tono %d Hz\n", tonoHz);
      tone(PIN_BUZZER, tonoHz);
      delay(1200);
      noTone(PIN_BUZZER);
      digitalWrite(PIN_BUZZER, BUZZER_APAGADO);
    }
  }
}

void conectarMqtt() {
  static unsigned long ultimoIntento = 0;
  if (mqtt.connected() || millis() - ultimoIntento < 10000) return;
  ultimoIntento = millis();
  String estado = tema("estado");
  const char* usuario = *MQTT_USER ? MQTT_USER : nullptr;
  const char* clave = *MQTT_PASS ? MQTT_PASS : nullptr;
  if (mqtt.connect(DEVICE_ID, usuario, clave, estado.c_str(), 1, true, "fuera_de_linea")) {
    mqtt.publish(estado.c_str(), "en_linea", true);
    mqtt.subscribe(tema("horario").c_str());
    mqtt.subscribe(tema("comando").c_str());
    Serial.println("MQTT conectado");
  }
}

void revisarHorario() {
  struct tm t;
  if (!getLocalTime(&t, 0)) return;  // todavía no hay hora (sin NTP)
  int dia = (t.tm_wday + 6) % 7;     // 0 = lunes
  int ahora = t.tm_hour * 60 + t.tm_min;
  for (int f = 0; f < N_FRANJAS; f++) {
    if (ahora != horaMin[f] || ultimoDia[f] == t.tm_yday) continue;
    ultimoDia[f] = t.tm_yday;
    if (tomas[dia * N_FRANJAS + f] == '1' && alarmaFranja == -1) iniciarAlarma(f);
  }
}

// Al encender, la hora sale del DS3231 (sigue contando con su pila aunque no haya luz ni Wi-Fi)
void iniciarReloj() {
  pinMode(PIN_RTC_VCC, OUTPUT);
  digitalWrite(PIN_RTC_VCC, HIGH);
  delay(50);  // que el reloj despierte antes de hablarle
  Wire.begin(PIN_SDA, PIN_SCL);
  hayRtc = rtc.begin();
  if (!hayRtc) {
    // Lista lo que responde en el bus: 0x68 es el reloj, 0x57 su memoria. Nada = cables o energía.
    Serial.print("No se encontró el reloj DS3231. En el bus I2C responde:");
    int vistos = 0;
    for (byte dir = 1; dir < 127; dir++) {
      Wire.beginTransmission(dir);
      if (Wire.endTransmission() == 0) { Serial.printf(" 0x%02X", dir); vistos++; }
    }
    Serial.println(vistos ? "" : " nada (revisar VCC→14, GND, SDA→33, SCL→32)");
    return;
  }
  if (rtc.lostPower()) { Serial.println("El DS3231 perdió la hora: se corrige con internet"); return; }
  struct timeval tv = {(time_t)rtc.now().unixtime(), 0};  // el DS3231 guarda la hora en UTC
  settimeofday(&tv, nullptr);
  Serial.println("Hora tomada del DS3231");
}

// Cuando llega la hora de internet, se corrige el DS3231
void guardarHoraEnReloj() {
  if (!ntpSincronizado) return;
  ntpSincronizado = false;
  if (hayRtc) rtc.adjust(DateTime((uint32_t)time(nullptr)));
}

// El pulsador rebota mucho (decenas de contactos por apretada): se apaga la alarma al primer contacto
// y la apretada larga se mide desde el último momento en que estuvo suelto.
// Si la apretada apagó una alarma, no cuenta para borrar el Wi-Fi aunque el paciente la mantenga.
void revisarBoton() {
  static unsigned long ultimoSuelto = 0;
  static bool apagoAlarma = false;
  if (digitalRead(PIN_BOTON) == HIGH) {
    if (millis() - ultimoSuelto > 200) apagoAlarma = false;  // suelto de verdad, no un rebote
    ultimoSuelto = millis();
    return;
  }
  if (alarmaFranja != -1) {
    Serial.println("Pulsador: alarma apagada");
    if (alarmaFranja != PRUEBA) publicarEvento("tomada", alarmaFranja);
    detenerAlarma();
    apagoAlarma = true;
  }
  if (!apagoAlarma && millis() - ultimoSuelto >= RESET_WIFI_MS) {
    Serial.println("Borrando Wi-Fi y reiniciando");
    WiFiManager wm;
    wm.resetSettings();
    ESP.restart();
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_LED, OUTPUT);
  pinMode(PIN_BOTON, INPUT_PULLUP);
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, BUZZER_APAGADO);
  cargarHorario();
  setenv("TZ", ZONA_HORARIA, 1);
  tzset();
  iniciarReloj();
  sntp_set_time_sync_notification_cb([](struct timeval*) { ntpSincronizado = true; });

  // Lista lo que ve el ESP32: si tu red no sale aquí, no es la clave sino la red (banda, canal, oculta o WPA3)
  WiFi.mode(WIFI_STA);
  int redes = WiFi.scanNetworks();
  Serial.printf("Redes que veo (%d):\n", redes);
  for (int i = 0; i < redes; i++) {
    Serial.printf("  \"%s\"  canal %d  señal %d  %s\n", WiFi.SSID(i).c_str(), WiFi.channel(i), WiFi.RSSI(i),
                  WiFi.encryptionType(i) == WIFI_AUTH_WPA3_PSK ? "WPA3 (no sirve)" : "");
  }
  if (*WIFI_RED) {
    Serial.printf("Conectando a %s...\n", WIFI_RED);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_RED, WIFI_CLAVE);
    for (int i = 0; i < 30 && WiFi.status() != WL_CONNECTED; i++) delay(500);
  }
  if (WiFi.status() != WL_CONNECTED) {
    WiFiManager wm;
    wm.setConfigPortalTimeout(180);  // si nadie lo configura en 3 min, sigue con el horario guardado
    String nombreRed = String("Memora-") + DEVICE_ID;
    if (!wm.autoConnect(nombreRed.c_str())) Serial.println("Sin Wi-Fi");
  }
  if (WiFi.status() == WL_CONNECTED) Serial.println("Wi-Fi conectado: " + WiFi.SSID());

  configTzTime(ZONA_HORARIA, "pool.ntp.org", "time.google.com");
  red.setCACert(CA_LETSENCRYPT);  // valida el certificado: necesita la hora (DS3231 o NTP)
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(alRecibir);
  mqtt.setBufferSize(512);
  mqtt.setSocketTimeout(3);  // con Wi-Fi sin datos, cada intento bloquea 3 s y no 15
}

void loop() {
  static unsigned long ultimoWifi = 0;
  if (WiFi.status() == WL_CONNECTED) {
    if (alarmaFranja == -1) conectarMqtt();  // reconectar bloquea unos segundos: nunca mientras suena
    mqtt.loop();
  } else if (millis() - ultimoWifi > 30000) {  // sin Wi-Fi: corta el intento trabado y vuelve a empezar
    ultimoWifi = millis();
    WiFi.reconnect();
  }
  guardarHoraEnReloj();
  revisarBoton();
  revisarHorario();
  if (alarmaFranja == -1) {
    digitalWrite(PIN_LED, mqtt.connected());  // LED fijo = conectado
  } else {
    sonarAlarma();
    if (millis() - alarmaDesde > ALARMA_MAX_MS) detenerAlarma();  // el servidor la marca omitida
  }
}
