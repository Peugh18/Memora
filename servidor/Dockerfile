# API de Memora con FrankenPHP: PHP + Caddy (HTTPS automático con Let's Encrypt) en una sola imagen.
# La misma imagen corre la web, el oyente MQTT (mqtt:escuchar) y el revisor de tomas (schedule:work).
FROM dunglas/frankenphp:1-php8.3

RUN install-php-extensions pdo_sqlite pcntl intl opcache zip \
    && mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

COPY . .
RUN composer dump-autoload --optimize --no-dev \
    && mkdir -p storage/datos storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache

# SERVER_NAME llega desde compose.yaml (el dominio); Caddy sirve /app/public
