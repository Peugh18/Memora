<?php

namespace App\Services;

use App\Models\Dose;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/** Estado de cada toma del día: pendiente → tomada u omitida. */
class Tomas
{
    public function __construct(private readonly Pastillero $pastillero) {}

    /** Medicamentos que tocan hoy en una franja. */
    public function medicamentosDe(User $paciente, string $franja, ?Carbon $dia = null): array
    {
        $diaSemana = ($dia ?? now())->dayOfWeekIso;

        return $paciente->medications
            ->filter(fn ($m) => in_array($diaSemana, $m->dias) && in_array($franja, $m->franjas))
            ->values()->all();
    }

    public function confirmar(User $paciente, string $franja, string $por): Dose
    {
        $dosis = Dose::firstOrNew(['user_id' => $paciente->id, 'fecha' => today()->toDateString(), 'franja' => $franja]);
        if ($dosis->estado !== 'tomada') {
            $dosis->fill(['estado' => 'tomada', 'confirmada_por' => $por, 'confirmada_en' => now()])->save();
        }
        if ($por === 'app') {
            $this->pastillero->comando($paciente, 'silenciar');
        }

        return $dosis;
    }

    public function deshacer(User $paciente, string $franja): void
    {
        Dose::where(['user_id' => $paciente->id, 'fecha' => today()->toDateString(), 'franja' => $franja])
            ->update(['estado' => 'pendiente', 'confirmada_por' => null, 'confirmada_en' => null]);
    }

    /** Cada minuto: abre las tomas que empiezan y marca omitidas las que pasaron la tolerancia. */
    public function revisar(): void
    {
        $ahora = now();
        $hhmm = $ahora->format('H:i');
        $hoy = today()->toDateString();

        User::where('es_paciente', true)->with('medications')->each(function (User $p) use ($hhmm, $hoy) {
            foreach (User::FRANJAS as $franja) {
                if ($p->{"hora_$franja"} === $hhmm && $this->medicamentosDe($p, $franja)) {
                    Dose::firstOrCreate(['user_id' => $p->id, 'fecha' => $hoy, 'franja' => $franja]);
                }
            }
        });

        Dose::where('estado', 'pendiente')->where('fecha', $hoy)->with('user.cuidadores')->each(function (Dose $d) use ($ahora) {
            $limite = Carbon::parse($d->fecha.' '.$d->user->{"hora_{$d->franja}"})
                ->addMinutes($d->user->minutos_tolerancia);
            if ($ahora->greaterThanOrEqualTo($limite)) {
                $d->update(['estado' => 'omitida']);
                $this->avisarOmitida($d);
            }
        });
    }

    private function avisarOmitida(Dose $d): void
    {
        $nombres = ['manana' => 'la mañana', 'mediodia' => 'el mediodía', 'tarde' => 'la tarde', 'noche' => 'la noche'];
        $tokens = $d->user->cuidadores->where('avisos_push', true)->pluck('expo_push_token')->filter()->values();
        if ($tokens->isEmpty()) {
            return;
        }
        $mensajes = $tokens->map(fn ($t) => [
            'to' => $t,
            'title' => "{$d->user->saludo()} no confirmó {$nombres[$d->franja]}",
            'body' => 'Llámala o escríbele por WhatsApp desde Memora.',
            'data' => ['paciente' => $d->user_id],
            'sound' => 'default',
        ])->all();
        // ponytail: sin reintentos; si Expo falla, el cuidador igual lo ve en "Personas que cuido"
        try {
            Http::timeout(5)->post('https://exp.host/--/api/v2/push/send', $mensajes);
        } catch (\Throwable $e) {
            Log::warning('Push de omitida falló: '.$e->getMessage());
        }
    }
}
