<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

abstract class Controller
{
    /**
     * "yo" = la persona que inició sesión. Un número = alguien que cuido (si el vínculo existe).
     * Para modificar su rutina hace falta el permiso puede_editar que da el paciente.
     */
    protected function paciente(Request $request, string $paciente, bool $editar = false): User
    {
        $yo = $request->user();
        if ($paciente === 'yo') {
            return $yo;
        }
        $otro = $yo->pacientes()->whereKey($paciente)->first();
        abort_if(! $otro, 404, 'No cuidas a esta persona.');
        abort_if($editar && ! $otro->pivot->puede_editar, 403, 'No tienes permiso para editar su rutina.');

        return $otro;
    }
}
