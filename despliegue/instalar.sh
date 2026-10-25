#!/usr/bin/env bash
# Instala Memora en una EC2 (Ubuntu o Amazon Linux, arm64 o x86). Se corre UNA vez desde Session Manager:
#   curl -fsSL https://raw.githubusercontent.com/Peugh18/Memora/main/despliegue/instalar.sh -o instalar.sh && sudo bash instalar.sh
# Volver a correrlo actualiza el código y conserva datos y claves.
set -euo pipefail

DIR=/opt/memora
REPO=https://github.com/Peugh18/Memora.git
paso() { echo; echo "==> $*"; }

[ "$(id -u)" = 0 ] || { echo "Córrelo con sudo"; exit 1; }

paso "1/8 Memoria de intercambio (la t4g.micro tiene 1 GB)"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q /swapfile /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

paso "2/8 Docker y git"
if ! command -v docker >/dev/null || ! docker compose version >/dev/null 2>&1; then
  if command -v apt-get >/dev/null; then
    apt-get update -y && apt-get install -y docker.io docker-compose-v2 git curl
  else
    dnf install -y docker git
    mkdir -p /usr/local/lib/docker/cli-plugins
    curl -fsSL "https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-$(uname -m)" \
      -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
  fi
  systemctl enable --now docker
fi

paso "3/8 Código"
if [ -d "$DIR/.git" ]; then git -C "$DIR" pull --ff-only; else git clone "$REPO" "$DIR"; fi
cd "$DIR/despliegue"
mkdir -p secretos/mosquitto && chmod 700 secretos

paso "4/8 Dominio y clave del pastillero"
if [ ! -f .env ]; then
  read -rp "Dominio (ej. memora.duckdns.org): " DOMINIO
  echo "DOMINIO=$DOMINIO" > .env
fi
DOMINIO=$(grep '^DOMINIO=' .env | cut -d= -f2)
if [ ! -f secretos/clave-MEM-0001 ]; then
  read -rsp "Clave del QR del pastillero MEM-0001 (las 6 letras después de MEM-0001-): " CLAVE; echo
  printf '%s' "${CLAVE^^}" > secretos/clave-MEM-0001 && chmod 600 secretos/clave-MEM-0001
fi
CLAVE=$(cat secretos/clave-MEM-0001)

paso "5/8 Claves del servidor (se generan una sola vez)"
if [ ! -f secretos/servidor.env ]; then
  CLAVE_MQTT=$(head -c 24 /dev/urandom | base64 | tr -dc 'A-Za-z0-9')
  cat > secretos/servidor.env <<EOF
APP_NAME=Memora
APP_ENV=production
APP_KEY=base64:$(head -c 32 /dev/urandom | base64)
APP_DEBUG=false
APP_URL=https://$DOMINIO
APP_LOCALE=es
APP_FALLBACK_LOCALE=es
LOG_CHANNEL=stderr
DB_CONNECTION=sqlite
DB_DATABASE=/app/storage/datos/database.sqlite
SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync
MAIL_MAILER=log
MQTT_HOST=mosquitto
MQTT_PORT=1883
MQTT_AUTH_USERNAME=servidor
MQTT_AUTH_PASSWORD=$CLAVE_MQTT
MQTT_CONNECT_TIMEOUT=5
EOF
  chmod 600 secretos/servidor.env
fi
CLAVE_MQTT=$(grep '^MQTT_AUTH_PASSWORD=' secretos/servidor.env | cut -d= -f2)
# Usuarios del broker: el servidor y cada pastillero (usuario = su ID, clave = la del QR)
docker run --rm -v "$PWD/secretos/mosquitto:/s" eclipse-mosquitto:2 sh -c \
  "mosquitto_passwd -b -c /s/passwd servidor '$CLAVE_MQTT' && mosquitto_passwd -b /s/passwd MEM-0001 '$CLAVE' && chown -R 1883:1883 /s && chmod 700 /s && chmod 600 /s/passwd"

paso "6/8 API (la primera vez tarda varios minutos en construir)"
docker compose build web
docker compose up -d web
docker compose exec -T web sh -c 'touch storage/datos/database.sqlite && php artisan migrate --force'
docker compose exec -T web php artisan pastillero:crear MEM-0001 "$CLAVE"

paso "7/8 Esperando el certificado HTTPS de $DOMINIO (requiere DuckDNS apuntando a esta IP y los puertos 80/443 abiertos)"
for i in $(seq 1 60); do
  bash "$DIR/despliegue/renovar-cert.sh" >/dev/null 2>&1 && break
  sleep 5
done
[ -f secretos/mosquitto/cert.pem ] || { echo "No llegó el certificado. Revisa DuckDNS y el grupo de seguridad, y vuelve a correr el script."; exit 1; }

paso "8/8 Broker, oyente y revisor de tomas"
docker compose up -d
# Copia el certificado renovado al broker cada día a las 4:00
echo "0 4 * * * root bash $DIR/despliegue/renovar-cert.sh" > /etc/cron.d/memora-cert

echo
echo "Listo: https://$DOMINIO/up debe responder. Broker MQTT: $DOMINIO:8883 (usuario MEM-0001, clave del QR)."
docker compose ps
