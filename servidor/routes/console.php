<?php

use App\Services\Tomas;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('tomas:revisar', fn (Tomas $tomas) => $tomas->revisar())
    ->purpose('Abre las tomas que empiezan y marca omitidas las vencidas');

Schedule::command('tomas:revisar')->everyMinute()->withoutOverlapping();

// Registra un pastillero con la clave de su QR: php artisan pastillero:crear MEM-0001 K7Q9PX
Artisan::command('pastillero:crear {id} {clave}', function (string $id, string $clave) {
    App\Models\Device::updateOrCreate(['id' => strtoupper($id)], ['clave_hash' => Illuminate\Support\Facades\Hash::make(strtoupper($clave))]);
    $this->info("Pastillero $id listo para vincular.");
})->purpose('Registra un pastillero con la clave de su QR');
