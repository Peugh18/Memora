<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'alias', 'email', 'password', 'celular', 'tiene_whatsapp', 'es_paciente', 'es_cuidador',
    'hora_manana', 'hora_mediodia', 'hora_tarde', 'hora_noche', 'minutos_tolerancia',
    'avisos_push', 'avisos_whatsapp', 'expo_push_token'])]
#[Hidden(['password', 'remember_token', 'expo_push_token', 'codigo_invitacion', 'codigo_vence'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    public const FRANJAS = ['manana', 'mediodia', 'tarde', 'noche'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'tiene_whatsapp' => 'boolean',
            'es_paciente' => 'boolean',
            'es_cuidador' => 'boolean',
            'avisos_push' => 'boolean',
            'avisos_whatsapp' => 'boolean',
            'codigo_vence' => 'datetime',
        ];
    }

    public function device(): HasOne
    {
        return $this->hasOne(Device::class);
    }

    public function medications(): HasMany
    {
        return $this->hasMany(Medication::class);
    }

    public function doses(): HasMany
    {
        return $this->hasMany(Dose::class);
    }

    /** Quienes me cuidan (yo soy el paciente). */
    public function cuidadores(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'care_links', 'patient_id', 'caregiver_id')
            ->withPivot('id', 'parentesco', 'puede_editar');
    }

    /** A quienes cuido. */
    public function pacientes(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'care_links', 'caregiver_id', 'patient_id')
            ->withPivot('id', 'parentesco', 'puede_editar');
    }

    /** Cómo la app saluda y nombra a la persona: el alias o su primer nombre. */
    public function saludo(): string
    {
        return $this->alias ?: strtok($this->name, ' ');
    }

    /** @return array<string, string> franja => HH:MM */
    public function horario(): array
    {
        return collect(self::FRANJAS)->mapWithKeys(fn ($f) => [$f => $this->{"hora_$f"}])->all();
    }

    /** 28 caracteres para el pastillero: lunes mañana, lunes mediodía, ..., domingo noche. 1 = hay toma. */
    public function tomas(): string
    {
        $meds = $this->medications;
        $s = '';
        for ($dia = 1; $dia <= 7; $dia++) {
            foreach (self::FRANJAS as $franja) {
                $s .= $meds->contains(fn ($m) => in_array($dia, $m->dias) && in_array($franja, $m->franjas)) ? '1' : '0';
            }
        }

        return $s;
    }
}
