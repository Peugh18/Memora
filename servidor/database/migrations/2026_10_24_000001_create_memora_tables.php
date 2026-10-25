<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // La rutina vive en el mismo usuario: quien toma medicamentos es "paciente".
        Schema::table('users', function (Blueprint $table) {
            $table->string('celular', 15)->nullable();
            $table->boolean('tiene_whatsapp')->default(false);
            $table->boolean('es_paciente')->default(true);
            $table->boolean('es_cuidador')->default(false);
            $table->string('hora_manana', 5)->default('08:00');
            $table->string('hora_mediodia', 5)->default('13:00');
            $table->string('hora_tarde', 5)->default('18:00');
            $table->string('hora_noche', 5)->default('21:00');
            $table->unsignedSmallInteger('minutos_tolerancia')->default(30);
            $table->boolean('avisos_push')->default(true);
            $table->boolean('avisos_whatsapp')->default(true);
            $table->string('expo_push_token')->nullable();
            $table->string('codigo_invitacion', 7)->nullable()->unique();
            $table->timestamp('codigo_vence')->nullable();
        });

        Schema::create('devices', function (Blueprint $table) {
            $table->string('id', 20)->primary(); // MEM-0001, el del QR
            $table->foreignId('user_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->string('clave_hash');
            $table->boolean('en_linea')->default(false);
            $table->timestamp('ultima_conexion')->nullable();
            $table->timestamps();
        });

        Schema::create('care_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('caregiver_id')->constrained('users')->cascadeOnDelete();
            $table->string('parentesco', 30);
            $table->boolean('puede_editar')->default(false);
            $table->timestamps();
            $table->unique(['patient_id', 'caregiver_id']);
        });

        Schema::create('medications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('nombre', 80);
            $table->string('dosis', 80)->nullable();
            $table->json('franjas'); // ["manana","noche"]
            $table->json('dias');    // [1..7], 1 = lunes
            $table->timestamps();
        });

        Schema::create('doses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('fecha');
            $table->string('franja', 10);
            $table->string('estado', 10)->default('pendiente'); // pendiente, tomada, omitida
            $table->string('confirmada_por', 12)->nullable();   // app, pastillero
            $table->timestamp('confirmada_en')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'fecha', 'franja']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doses');
        Schema::dropIfExists('medications');
        Schema::dropIfExists('care_links');
        Schema::dropIfExists('devices');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['celular', 'tiene_whatsapp', 'es_paciente', 'es_cuidador', 'hora_manana', 'hora_mediodia',
                'hora_tarde', 'hora_noche', 'minutos_tolerancia', 'avisos_push', 'avisos_whatsapp', 'expo_push_token',
                'codigo_invitacion', 'codigo_vence']);
        });
    }
};
