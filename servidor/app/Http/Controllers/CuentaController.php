<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CuentaController extends Controller
{
    private const HORA = ['required_with:horario', 'date_format:H:i'];

    public function registro(Request $request): array
    {
        $datos = $request->validate([
            'nombre' => ['required', 'string', 'max:60'],
            'apellido' => ['required', 'string', 'max:60'],
            'alias' => ['nullable', 'string', 'max:30'],
            'email' => ['required', 'email', 'max:120', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'max:72'], // bcrypt solo usa 72 bytes; evita cuerpos gigantes
            'celular' => ['nullable', 'digits:9'],
            'tiene_whatsapp' => ['boolean'],
            'rol' => ['required', Rule::in(['toma', 'cuida', 'ambos'])],
            'horario' => ['array'],
            'horario.manana' => self::HORA, 'horario.mediodia' => self::HORA,
            'horario.tarde' => self::HORA, 'horario.noche' => self::HORA,
            'medicamento' => ['nullable', 'array'],
            'medicamento.nombre' => ['required_with:medicamento', 'string', 'max:80'],
            'medicamento.dosis' => ['nullable', 'string', 'max:80'],
            'medicamento.franjas' => ['required_with:medicamento', 'array', 'min:1'],
            'medicamento.franjas.*' => [Rule::in(User::FRANJAS)],
        ]);

        $user = User::create([
            'name' => trim($datos['nombre']).' '.trim($datos['apellido']),
            'alias' => trim($datos['alias'] ?? '') ?: strtok(trim($datos['nombre']), ' '),
            'email' => $datos['email'],
            'password' => $datos['password'],
            'celular' => $datos['celular'] ?? null,
            'tiene_whatsapp' => $datos['tiene_whatsapp'] ?? false,
            'es_paciente' => $datos['rol'] !== 'cuida',
            'es_cuidador' => $datos['rol'] !== 'toma',
        ] + collect($datos['horario'] ?? [])->mapWithKeys(fn ($h, $f) => ["hora_$f" => $h])->all())->refresh(); // refresh: trae las horas por defecto de la base

        if (! empty($datos['medicamento'])) {
            $user->medications()->create($datos['medicamento'] + ['dias' => range(1, 7)]);
        }

        return ['token' => $user->createToken('app')->plainTextToken, 'usuario' => $this->datos($user)];
    }

    public function login(Request $request): array
    {
        $datos = $request->validate(['email' => ['required', 'email', 'max:120'], 'password' => ['required', 'string', 'max:72']]);
        $user = User::where('email', $datos['email'])->first();
        if (! $user || ! Hash::check($datos['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => 'El correo o la contraseña no coinciden.']);
        }

        return ['token' => $user->createToken('app')->plainTextToken, 'usuario' => $this->datos($user)];
    }

    public function logout(Request $request): array
    {
        $request->user()->currentAccessToken()->delete();

        return ['ok' => true];
    }

    /** Manda un código de 6 dígitos al correo. Siempre responde lo mismo: no revela si el correo existe. */
    public function olvido(Request $request): array
    {
        $email = $request->validate(['email' => ['required', 'email', 'max:120']])['email'];
        if (User::where('email', $email)->exists()) {
            $codigo = (string) random_int(100000, 999999);
            DB::table('password_reset_tokens')->updateOrInsert(['email' => $email], ['token' => Hash::make($codigo), 'created_at' => now()]);
            Mail::raw("Tu código para crear una contraseña nueva en Memora es: $codigo

Vence en 15 minutos. Si no lo pediste, ignora este correo.",
                fn ($m) => $m->to($email)->subject("Tu código de Memora: $codigo"));
        }

        return ['ok' => true];
    }

    public function restablecer(Request $request): array
    {
        $datos = $request->validate([
            'email' => ['required', 'email', 'max:120'],
            'codigo' => ['required', 'digits:6'],
            'password' => ['required', 'string', 'min:8', 'max:72'],
        ]);
        // Cuenta el intento antes de revisar (evita pedidos en paralelo). Máx. 5 por correo cada 15 min, desde cualquier IP
        // y aunque pidan códigos nuevos; al pasarse se borra el código.
        if (RateLimiter::hit('restablecer:'.$datos['email'], 900) > 5) {
            DB::table('password_reset_tokens')->where('email', $datos['email'])->delete();
            throw ValidationException::withMessages(['codigo' => 'Demasiados intentos. Espera 15 minutos y pide un código nuevo.']);
        }
        $fila = DB::table('password_reset_tokens')->where('email', $datos['email'])->first();
        $user = User::where('email', $datos['email'])->first();
        if (! $fila || ! $user || now()->subMinutes(15)->gt($fila->created_at) || ! Hash::check($datos['codigo'], $fila->token)) {
            throw ValidationException::withMessages(['codigo' => 'El código no es correcto o ya venció. Pide uno nuevo.']);
        }

        RateLimiter::clear('restablecer:'.$datos['email']);
        DB::table('password_reset_tokens')->where('email', $datos['email'])->delete();
        $user->tokens()->delete(); // cierra la sesión en los otros celulares
        $user->update(['password' => $datos['password']]);

        return ['token' => $user->createToken('app')->plainTextToken, 'usuario' => $this->datos($user)];
    }

    public function yo(Request $request): array
    {
        return $this->datos($request->user());
    }

    public function actualizar(Request $request): array
    {
        $user = $request->user();
        $datos = $request->validate([
            'nombre' => ['sometimes', 'string', 'max:120'],
            'alias' => ['sometimes', 'string', 'max:30'],
            'email' => ['sometimes', 'email', 'max:120', Rule::unique('users')->ignore($user)],
            'celular' => ['sometimes', 'nullable', 'digits:9'],
            'tiene_whatsapp' => ['sometimes', 'boolean'],
            'minutos_tolerancia' => ['sometimes', 'integer', Rule::in([15, 30, 45, 60])],
            'avisos_push' => ['sometimes', 'boolean'],
            'avisos_whatsapp' => ['sometimes', 'boolean'],
            'expo_push_token' => ['sometimes', 'nullable', 'string', 'max:200'],
        ]);
        if (isset($datos['nombre'])) {
            $datos['name'] = $datos['nombre'];
        }
        $user->update($datos);

        return $this->datos($user);
    }

    public function clave(Request $request): array
    {
        $datos = $request->validate(['actual' => ['required', 'string', 'max:72', 'current_password'], 'nueva' => ['required', 'string', 'min:8', 'max:72']]);
        $request->user()->update(['password' => $datos['nueva']]);

        return ['ok' => true];
    }

    private function datos(User $user): array
    {
        $user->loadMissing('device');

        return [
            'id' => $user->id,
            'nombre' => $user->name,
            'alias' => $user->saludo(),
            'email' => $user->email,
            'celular' => $user->celular,
            'tiene_whatsapp' => $user->tiene_whatsapp,
            'es_paciente' => $user->es_paciente,
            'es_cuidador' => $user->es_cuidador,
            'horario' => $user->horario(),
            'minutos_tolerancia' => $user->minutos_tolerancia,
            'avisos_push' => $user->avisos_push,
            'avisos_whatsapp' => $user->avisos_whatsapp,
            'pastillero' => $user->device?->only('id', 'en_linea', 'ultima_conexion'),
        ];
    }
}
