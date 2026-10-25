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

Route::middleware('auth:sanctum')->group(function () {
    Route::post('logout', [CuentaController::class, 'logout']);
    Route::get('yo', [CuentaController::class, 'yo']);
    Route::patch('yo', [CuentaController::class, 'actualizar']);
    Route::put('yo/clave', [CuentaController::class, 'clave']);

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
        Route::post('pastillero/vincular', 'vincular');
        Route::post('pastillero/comando', 'comando');
        Route::post('tomas/{franja}', 'tomada');
        Route::delete('tomas/{franja}', 'deshacer');
    });

    Route::controller(FamiliaController::class)->group(function () {
        Route::get('familia', 'index');
        Route::patch('familia/{vinculo}', 'permiso');
        Route::delete('familia/{vinculo}', 'quitar');
        Route::post('invitaciones', 'unirse');
        Route::get('personas', 'personas');
    });
});
