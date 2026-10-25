<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'fecha', 'franja', 'estado', 'confirmada_por', 'confirmada_en'])]
class Dose extends Model
{
    protected function casts(): array
    {
        return ['confirmada_en' => 'datetime']; // fecha queda como texto Y-m-d: así se compara igual en SQLite y Postgres
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
