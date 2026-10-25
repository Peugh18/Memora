<?php

namespace App\Console\Commands;

use App\Models\Device;
use App\Models\User;
use App\Services\Tomas;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use PhpMqtt\Client\Facades\MQTT;

#[Signature('mqtt:escuchar')]
#[Description('Recibe los eventos y el estado de los pastilleros (queda corriendo)')]
class EscucharPastilleros extends Command
{
    public function handle(Tomas $tomas): void
    {
        // Si el broker se cae o no responde, espera y vuelve a conectarse en vez de terminar
        while (true) {
            try {
                $this->escuchar($tomas);
            } catch (\Throwable $e) {
                $this->warn('Sin conexión con el broker MQTT: '.$e->getMessage().'. Reintento en 5 s.');
                try {
                    MQTT::disconnect();
                } catch (\Throwable) {
                    // la conexión ya estaba rota
                }
                sleep(5);
            }
        }
    }

    private function escuchar(Tomas $tomas): void
    {
        $mqtt = MQTT::connection();
        $this->info('Escuchando pastilleros');

        // {"tipo":"tomada","franja":"manana","fecha":"2026-10-24"}
        $mqtt->subscribe('memora/+/eventos', function (string $tema, string $mensaje) use ($tomas) {
            $this->info("$tema $mensaje");
            $device = Device::with('user')->find(explode('/', $tema)[1]);
            $evento = json_decode($mensaje, true);
            if (! $device?->user || ! in_array($evento['franja'] ?? null, User::FRANJAS)) {
                return;
            }
            $device->update(['en_linea' => true, 'ultima_conexion' => now()]);
            if ($evento['tipo'] === 'tomada') {
                $tomas->confirmar($device->user, $evento['franja'], 'pastillero');
            }
        });

        // "en_linea" al conectarse, "fuera_de_linea" (última voluntad) al perderse
        $mqtt->subscribe('memora/+/estado', function (string $tema, string $mensaje) {
            $this->info("$tema $mensaje");
            Device::whereKey(explode('/', $tema)[1])
                ->update(['en_linea' => $mensaje === 'en_linea', 'ultima_conexion' => now()]);
        });

        $mqtt->loop(true);
    }
}
