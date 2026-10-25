<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // name = nombres y apellidos; alias = cómo la app saluda a la persona ("Rosa")
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('alias', 30)->nullable()->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('alias');
        });
    }
};
