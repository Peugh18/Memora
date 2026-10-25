<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\User;
use App\Services\Pastillero;
use App\Services\Tomas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** Acciones del paciente sobre su propio pastillero. El cuidador no confirma tomas. */
class PastilleroController extends Controller
{
    public function __construct(private readonly Pastillero $pastillero, private readonly Tomas $tomas) {}

    /** Código del QR o escrito a mano: "MEM-0001-K7Q9PX". */
    public function vincular(Request $request): array
    {
        $request->validate(['codigo' => ['required', 'string', 'max:40']]);
        $partes = explode('-', strtoupper(trim($request->codigo)));
        $clave = array_pop($partes);
        $device = Device::find(implode('-', $partes));
        if (! $device || ! Hash::check($clave, $device->clave_hash)) {
            throw ValidationException::withMessages(['codigo' => 'Ese código no corresponde a ningún pastillero.']);
        }
        if ($device->user_id && $device->user_id !== $request->user()->id) {
            throw ValidationException::withMessages(['codigo' => 'Este pastillero ya está vinculado a otra cuenta.']);
        }
        $user = $request->user();
        $user->device()->where('id', '!=', $device->id)->update(['user_id' => null]);
        $device->update(['user_id' => $user->id]);
        $this->pastillero->publicarHorario($user->load('medications', 'device'));

        return ['pastillero' => $device->only('id', 'en_linea', 'ultima_conexion')];
    }

    public function tomada(Request $request, string $franja): array
    {
        abort_unless(in_array($franja, User::FRANJAS), 404);
        $dosis = $this->tomas->confirmar($request->user(), $franja, 'app');

        return ['estado' => $dosis->estado, 'confirmada_en' => $dosis->confirmada_en->format('H:i')];
    }

    public function deshacer(Request $request, string $franja): array
    {
        abort_unless(in_array($franja, User::FRANJAS), 404);
        $this->tomas->deshacer($request->user(), $franja);

        return ['estado' => 'pendiente'];
    }

    public function comando(Request $request): array
    {
        $datos = $request->validate(['comando' => ['required', Rule::in(['silenciar', 'probar_alarma'])]]);
        abort_unless($request->user()->device, 409, 'Todavía no vinculaste un pastillero.');
        abort_unless($this->pastillero->comando($request->user(), $datos['comando']), 503,
            'No pudimos llegar al pastillero ahora. Apágalo con su botón.');

        return ['ok' => true];
    }
}
