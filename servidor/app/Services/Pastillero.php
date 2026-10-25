<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;
use PhpMqtt\Client\Facades\MQTT;

/**
 * Lo que el servidor le manda al ESP32 por MQTT (ver firmware/memora/memora.ino).
 * Si el broker no responde, la API sigue funcionando: se registra el error y se devuelve false.
 */
class Pastillero
{
    /** Horario retenido: el pastillero lo recibe aunque se conecte después. */
    public function publicarHorario(User $paciente): bool
    {
        $device = $paciente->device;
        if (! $device) {
            return false;
        }

        return $this->publicar("memora/{$device->id}/horario", json_encode($paciente->horario() + ['tomas' => $paciente->tomas()]), true);
    }

    /** "silenciar" o "probar_alarma". */
    public function comando(User $paciente, string $comando): bool
    {
        $device = $paciente->device;

        return $device && $this->publicar("memora/{$device->id}/comando", $comando);
    }

    private function publicar(string $tema, string $mensaje, bool $retener = false): bool
    {
        try {
            MQTT::publish($tema, $mensaje, $retener);

            return true;
        } catch (\Throwable $e) {
            // ponytail: sin cola de reintentos; el horario se vuelve a publicar con el próximo cambio
            Log::warning("MQTT no disponible ($tema): ".$e->getMessage());
            try {
                MQTT::disconnect();
            } catch (\Throwable) {
                // la conexión ya estaba rota
            }

            return false;
        }
    }
}
