#!/usr/bin/env bash
# Copia el certificado que Caddy sacó para el dominio hacia el broker MQTT. Falla si todavía no existe.
set -euo pipefail
cd "$(dirname "$0")"
DOMINIO=$(grep '^DOMINIO=' .env | cut -d= -f2)
BASE=$(docker compose exec -T web sh -c "find /data/caddy/certificates -type d -name '$DOMINIO' | head -1")
[ -n "$BASE" ] || exit 1
docker compose exec -T web cat "$BASE/$DOMINIO.crt" > secretos/mosquitto/cert.pem.nuevo
docker compose exec -T web cat "$BASE/$DOMINIO.key" > secretos/mosquitto/key.pem.nuevo
[ -s secretos/mosquitto/cert.pem.nuevo ] || exit 1
if ! cmp -s secretos/mosquitto/cert.pem.nuevo secretos/mosquitto/cert.pem 2>/dev/null; then
  mv secretos/mosquitto/cert.pem.nuevo secretos/mosquitto/cert.pem
  mv secretos/mosquitto/key.pem.nuevo secretos/mosquitto/key.pem
  chown 1883:1883 secretos/mosquitto/*.pem && chmod 600 secretos/mosquitto/*.pem
  docker compose restart mosquitto 2>/dev/null || true
fi
rm -f secretos/mosquitto/*.nuevo
