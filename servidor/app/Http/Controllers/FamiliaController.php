<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/** Cuidadores del paciente y personas que cuida el cuidador. */
class FamiliaController extends Controller
{
    /** Mis cuidadores y mi código de invitación (vence en 24 h). */
    public function index(Request $request): array
    {
        $yo = $request->user();
        if (! $yo->codigo_invitacion || $yo->codigo_vence->isPast()) {
            do {
                $codigo = Str::upper(Str::random(3)).'-'.Str::upper(Str::random(3));
            } while (User::where('codigo_invitacion', $codigo)->exists());
            $yo->forceFill(['codigo_invitacion' => $codigo, 'codigo_vence' => now()->addDay()])->save();
        }

        return [
            'codigo' => $yo->codigo_invitacion,
            'vence' => $yo->codigo_vence,
            'cuidadores' => $yo->cuidadores->map(fn (User $c) => [
                'vinculo' => $c->pivot->id, 'nombre' => $c->name, 'alias' => $c->saludo(), 'parentesco' => $c->pivot->parentesco,
                'celular' => $c->celular, 'tiene_whatsapp' => $c->tiene_whatsapp, 'puede_editar' => (bool) $c->pivot->puede_editar,
            ]),
        ];
    }

    /** El paciente da o quita el permiso de editar. */
    public function permiso(Request $request, int $vinculo): array
    {
        $datos = $request->validate(['puede_editar' => ['required', 'boolean']]);
        $n = DB::table('care_links')->where('id', $vinculo)->where('patient_id', $request->user()->id)
            ->update(['puede_editar' => $datos['puede_editar'], 'updated_at' => now()]);
        abort_if(! $n, 404);

        return ['ok' => true];
    }

    /** El paciente quita a un cuidador, o el cuidador se sale. */
    public function quitar(Request $request, int $vinculo): array
    {
        $yo = $request->user()->id;
        $n = DB::table('care_links')->where('id', $vinculo)
            ->where(fn ($q) => $q->where('patient_id', $yo)->orWhere('caregiver_id', $yo))->delete();
        abort_if(! $n, 404);

        return ['ok' => true];
    }

    public function unirse(Request $request): array
    {
        $datos = $request->validate(['codigo' => ['required', 'string', 'max:7'], 'parentesco' => ['required', 'string', 'max:30']]);
        $paciente = User::where('codigo_invitacion', strtoupper($datos['codigo']))->where('codigo_vence', '>', now())->first();
        $yo = $request->user();
        if (! $paciente || $paciente->id === $yo->id) {
            throw ValidationException::withMessages(['codigo' => 'El código no existe o ya venció. Pide uno nuevo.']);
        }
        $yo->pacientes()->syncWithoutDetaching([$paciente->id => ['parentesco' => $datos['parentesco']]]);
        $yo->update(['es_cuidador' => true]);

        return ['paciente' => ['id' => $paciente->id, 'nombre' => $paciente->name, 'alias' => $paciente->saludo()]];
    }

    /** Personas que cuido, con cómo va su día. */
    public function personas(Request $request): array
    {
        $hoy = today()->toDateString();

        return $request->user()->pacientes()->with(['device', 'doses' => fn ($q) => $q->where('fecha', $hoy)])->get()
            ->map(fn (User $p) => [
                'id' => $p->id,
                'nombre' => $p->name,
                'alias' => $p->saludo(),
                'parentesco' => $p->pivot->parentesco,
                'puede_editar' => (bool) $p->pivot->puede_editar,
                'celular' => $p->celular,
                'tiene_whatsapp' => $p->tiene_whatsapp,
                'pastillero' => $p->device?->only('id', 'en_linea', 'ultima_conexion'),
                'tomas' => $p->doses->map->only('franja', 'estado'),
                'omitida' => $p->doses->firstWhere('estado', 'omitida')?->only('franja', 'updated_at'),
            ])->all();
    }
}
