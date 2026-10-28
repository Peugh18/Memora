<?php

use App\Http\Controllers\CuentaController;
use App\Http\Controllers\FamiliaController;
use App\Http\Controllers\PastilleroController;
use App\Http\Controllers\RutinaController;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:10,1')->group(function () {
    Route::post('registro', [CuentaController::class, 'registro']);
    Route::post('login', [CuentaController::class, 'login']);
    Route::post('clave/olvido', [CuentaController::class, 'olvido']);
});

// 5 intentos por minuto: el código de 6 dígitos no se puede adivinar probando
Route::post('clave/restablecer', [CuentaController::class, 'restablecer'])->middleware('throttle:5,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('logout', [CuentaController::class, 'logout']);
    Route::get('yo', [CuentaController::class, 'yo']);
    Route::patch('yo', [CuentaController::class, 'actualizar']);
    Route::put('yo/clave', [CuentaController::class, 'clave'])->middleware('throttle:5,1');

    // {paciente} = "yo" o el id de alguien que cuido
    Route::prefix('pacientes/{paciente}')->controller(RutinaController::class)->group(function () {
        Route::get('hoy', 'hoy');
        Route::get('pastillero', 'pastillero');
        Route::put('horario', 'horario');
        Route::get('historial', 'historial');
        Route::get('medicamentos', 'medicamentos');
        Route::post('medicamentos', 'guardarMedicamento');
        Route::put('medicamentos/{medicamento}', 'guardarMedicamento');
        Route::delete('medicamentos/{medicamento}', 'borrarMedicamento');
    });

    Route::controller(PastilleroController::class)->group(function () {
        // 5 intentos por minuto: la clave del QR y el código de invitación no se pueden adivinar probando
        Route::post('pastillero/vincular', 'vincular')->middleware('throttle:5,1');
        Route::post('pastillero/comando', 'comando');
        Route::post('tomas/{franja}', 'tomada');
        Route::delete('tomas/{franja}', 'deshacer');
    });

    Route::controller(FamiliaController::class)->group(function () {
        Route::get('familia', 'index');
        Route::patch('familia/{vinculo}', 'permiso');
        Route::delete('familia/{vinculo}', 'quitar');
        Route::post('invitaciones', 'unirse')->middleware('throttle:5,1');
        Route::get('personas', 'personas');
    });
});
