<?php

namespace App\Http\Controllers;

use App\Models\Dose;
use App\Models\Medication;
use App\Models\User;
use App\Services\Pastillero;
use App\Services\Tomas;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Lo que ven el paciente y sus cuidadores: hoy, pastillero, horario, medicamentos e historial. */
class RutinaController extends Controller
{
    public function __construct(private readonly Tomas $tomas, private readonly Pastillero $pastillero) {}

    public function hoy(Request $request, string $paciente): array
    {
        $p = $this->paciente($request, $paciente);
        $p->load('medications', 'device');
        $dosis = $p->doses()->where('fecha', today()->toDateString())->get()->keyBy('franja');

        $lista = collect(User::FRANJAS)->map(function ($franja) use ($p, $dosis) {
            $meds = $this->tomas->medicamentosDe($p, $franja);
            $d = $dosis->get($franja);
            $estado = match (true) {
                (bool) $d => $d->estado,
                ! $meds => 'sin_medicamentos',
                now()->format('H:i') < $p->{"hora_$franja"} => 'por_venir',
                default => 'pendiente',
            };

            return [
                'franja' => $franja,
                'hora' => $p->{"hora_$franja"},
                'estado' => $estado,
                'confirmada_en' => $d?->confirmada_en?->format('H:i'),
                'medicamentos' => collect($meds)->map->only('id', 'nombre', 'dosis')->values(),
            ];
        });

        return [
            'fecha' => today()->toDateString(),
            'dia_semana' => today()->dayOfWeekIso,
            'nombre' => $p->name,
            'alias' => $p->saludo(),
            'pastillero' => $p->device?->only('id', 'en_linea', 'ultima_conexion'),
            'tomas' => $lista,
            'confirmadas' => $lista->where('estado', 'tomada')->count(),
            'total' => $lista->where('estado', '!=', 'sin_medicamentos')->count(),
        ];
    }

    /** Cuadrícula 7 × 4: cuántos medicamentos van en cada compartimento. */
    public function pastillero(Request $request, string $paciente): array
    {
        $p = $this->paciente($request, $paciente);
        $p->load('medications', 'device');
        $celdas = collect(User::FRANJAS)->mapWithKeys(fn ($f) => [$f => collect(range(1, 7))->map(
            fn ($dia) => $p->medications->filter(fn ($m) => in_array($dia, $m->dias) && in_array($f, $m->franjas))->count()
        )]);

        return [
            'pastillero' => $p->device?->only('id', 'en_linea', 'ultima_conexion'),
            'horario' => $p->horario(),
            'celdas' => $celdas,
            'medicamentos' => $p->medications->count(),
        ];
    }

    public function horario(Request $request, string $paciente): array
    {
        $p = $this->paciente($request, $paciente, editar: true);
        $hora = ['required', 'date_format:H:i'];
        $datos = $request->validate(['manana' => $hora, 'mediodia' => $hora, 'tarde' => $hora, 'noche' => $hora]);
        $p->update(collect($datos)->mapWithKeys(fn ($h, $f) => ["hora_$f" => $h])->all());
        $this->pastillero->publicarHorario($p->load('medications'));

        return ['horario' => $p->horario()];
    }

    public function medicamentos(Request $request, string $paciente)
    {
        return $this->paciente($request, $paciente)->medications()->orderBy('nombre')->get();
    }

    public function guardarMedicamento(Request $request, string $paciente, ?Medication $medicamento = null): Medication
    {
        $p = $this->paciente($request, $paciente, editar: true);
        abort_if($medicamento && $medicamento->user_id !== $p->id, 404);
        $datos = $request->validate([
            'nombre' => ['required', 'string', 'max:80'],
            'dosis' => ['nullable', 'string', 'max:80'],
            'franjas' => ['required', 'array', 'min:1'],
            'franjas.*' => [Rule::in(User::FRANJAS)],
            'dias' => ['required', 'array', 'min:1'],
            'dias.*' => ['integer', 'between:1,7'],
        ]);
        $medicamento ??= $p->medications()->make();
        $medicamento->fill($datos)->save();
        $this->pastillero->publicarHorario($p->load('medications'));

        return $medicamento;
    }

    public function borrarMedicamento(Request $request, string $paciente, Medication $medicamento): array
    {
        $p = $this->paciente($request, $paciente, editar: true);
        abort_if($medicamento->user_id !== $p->id, 404);
        $medicamento->delete();
        $this->pastillero->publicarHorario($p->load('medications'));

        return ['ok' => true];
    }

    /** Semana actual (lunes a domingo) y cumplimiento de las últimas 4 semanas. */
    public function historial(Request $request, string $paciente): array
    {
        $p = $this->paciente($request, $paciente);
        $lunes = today()->startOfWeek();
        $dosis = $p->doses()->where('fecha', '>=', $lunes->copy()->subWeeks(3)->toDateString())->get();

        $semana = collect(range(0, 6))->map(function ($i) use ($lunes, $dosis) {
            $fecha = $lunes->copy()->addDays($i)->toDateString();
            $delDia = $dosis->where('fecha', $fecha);

            return ['fecha' => $fecha, 'tomadas' => $delDia->where('estado', 'tomada')->count(),
                'omitidas' => $delDia->where('estado', 'omitida')->count(),
                'pendientes' => $delDia->where('estado', 'pendiente')->count()];
        });

        $semanas = collect(range(3, 0))->map(function ($atras) use ($lunes, $dosis) {
            $desde = $lunes->copy()->subWeeks($atras)->toDateString();
            $hasta = $lunes->copy()->subWeeks($atras)->addDays(6)->toDateString();
            $d = $dosis->whereBetween('fecha', [$desde, $hasta]);
            $cerradas = $d->whereIn('estado', ['tomada', 'omitida'])->count();

            return ['desde' => $desde, 'porcentaje' => $cerradas ? round(100 * $d->where('estado', 'tomada')->count() / $cerradas) : null];
        });

        $omitidas = $dosis->where('estado', 'omitida')->where('fecha', '>=', $lunes->toDateString())
            ->sortByDesc('fecha')->values()->map(fn (Dose $d) => [
                'fecha' => $d->fecha, 'franja' => $d->franja, 'hora' => $p->{"hora_{$d->franja}"},
                'medicamentos' => collect($this->tomas->medicamentosDe($p, $d->franja, \Illuminate\Support\Carbon::parse($d->fecha)))->pluck('nombre'),
            ]);

        return ['semana' => $semana, 'semanas' => $semanas, 'omitidas' => $omitidas];
    }
}
