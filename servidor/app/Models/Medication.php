<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['nombre', 'dosis', 'franjas', 'dias'])]
class Medication extends Model
{
    protected function casts(): array
    {
        return ['franjas' => 'array', 'dias' => 'array'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
