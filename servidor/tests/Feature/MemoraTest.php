<?php

namespace Tests\Feature;

use App\Models\Device;
use App\Models\User;
use App\Services\Pastillero;
use App\Services\Tomas;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Mockery\MockInterface;
use Tests\TestCase;

class MemoraTest extends TestCase
{
    use RefreshDatabase;

    private MockInterface $pastillero;

    protected function setUp(): void
    {
        parent::setUp();
        $this->pastillero = $this->mock(Pastillero::class);
        $this->pastillero->shouldReceive('publicarHorario')->byDefault();
        $this->pastillero->shouldReceive('comando')->andReturn(true)->byDefault();
        $this->travelTo(now()->setDate(2026, 10, 22)->setTime(18, 0)); // jueves
    }

    /** Cambia de persona: sin esto, el guard recuerda al usuario del pedido anterior. */
    private function como(string $token): static
    {
        $this->app['auth']->forgetGuards();

        return $this->withToken($token);
    }

    private function registrar(string $email = 'rosa@correo.com', string $rol = 'toma'): array
    {
        return $this->postJson('/api/registro', [
            'nombre' => 'Rosa María', 'apellido' => 'Guevara Torres', 'alias' => 'Rosa', 'email' => $email, 'password' => 'secreto123', 'celular' => '987654321',
            'tiene_whatsapp' => true, 'rol' => $rol,
            'horario' => ['manana' => '08:00', 'mediodia' => '13:00', 'tarde' => '18:00', 'noche' => '21:00'],
            'medicamento' => ['nombre' => 'Metformina', 'dosis' => '850 mg', 'franjas' => ['manana', 'tarde']],
        ])->assertOk()->json();
    }

    public function test_el_registro_arma_la_rutina_y_los_28_compartimentos(): void
    {
        $r = $this->registrar();
        $rosa = User::first();

        $this->assertNotEmpty($r['token']);
        $this->assertTrue($rosa->es_paciente);
        $this->assertSame(str_repeat('1010', 7), $rosa->tomas());
    }

    public function test_el_registro_sin_horario_usa_las_horas_por_defecto_y_responde_en_espanol(): void
    {
        $this->postJson('/api/registro', ['nombre' => 'José Miguel', 'apellido' => 'Urcia Guevara', 'email' => 'rosa@correo.com', 'password' => 'secreto123', 'rol' => 'toma'])
            ->assertOk()->assertJsonPath('usuario.horario.manana', '08:00')
            ->assertJsonPath('usuario.nombre', 'José Miguel Urcia Guevara')->assertJsonPath('usuario.alias', 'José');
        $this->postJson('/api/registro', ['nombre' => 'Otra', 'apellido' => 'Persona', 'email' => 'rosa@correo.com', 'password' => 'corta', 'rol' => 'toma'])
            ->assertJsonValidationErrors(['email' => 'Ya hay una cuenta con este correo.', 'password' => 'Debe tener al menos 8 caracteres.']);
    }

    public function test_hoy_muestra_la_toma_de_ahora_y_ya_la_tome_apaga_el_pastillero(): void
    {
        $token = $this->registrar()['token'];
        $this->pastillero->shouldReceive('comando')->once()->withArgs(fn ($paciente, $comando) => $comando === 'silenciar' && $paciente->alias === 'Rosa')->andReturn(true);

        $hoy = $this->como($token)->getJson('/api/pacientes/yo/hoy')->assertOk()->json('tomas');
        $this->assertSame(['pendiente', 'sin_medicamentos', 'pendiente', 'sin_medicamentos'], array_column($hoy, 'estado'));

        $this->como($token)->postJson('/api/tomas/tarde')->assertOk()->assertJson(['estado' => 'tomada']);
        $this->como($token)->getJson('/api/pacientes/yo/hoy')->assertJsonPath('tomas.2.estado', 'tomada')->assertJsonPath('confirmadas', 1);
    }

    public function test_el_boton_del_pastillero_confirma_la_toma(): void
    {
        $this->registrar();
        $rosa = User::first();

        app(Tomas::class)->confirmar($rosa, 'manana', 'pastillero');

        $this->assertDatabaseHas('doses', ['user_id' => $rosa->id, 'franja' => 'manana', 'estado' => 'tomada', 'confirmada_por' => 'pastillero']);
    }

    public function test_sin_confirmar_en_30_minutos_queda_omitida_y_avisa_al_cuidador(): void
    {
        Http::fake();
        $this->registrar();
        $carlos = User::factory()->create(['es_paciente' => false, 'expo_push_token' => 'ExponentPushToken[abc]']);
        $carlos->pacientes()->attach(User::first()->id, ['parentesco' => 'Mamá']);

        app(Tomas::class)->revisar(); // 18:00: se abre la toma de la tarde
        $this->assertDatabaseHas('doses', ['franja' => 'tarde', 'estado' => 'pendiente']);

        $this->travel(29)->minutes();
        app(Tomas::class)->revisar();
        $this->assertDatabaseHas('doses', ['franja' => 'tarde', 'estado' => 'pendiente']);
        Http::assertNothingSent();

        $this->travel(1)->minutes();
        app(Tomas::class)->revisar();
        $this->assertDatabaseHas('doses', ['franja' => 'tarde', 'estado' => 'omitida']);
        Http::assertSent(fn ($req) => $req[0]['to'] === 'ExponentPushToken[abc]' && $req[0]['title'] === 'Rosa no confirmó la tarde');
    }

    public function test_el_cuidador_ve_la_rutina_y_edita_solo_con_permiso(): void
    {
        $rosaToken = $this->registrar()['token'];
        $codigo = $this->como($rosaToken)->getJson('/api/familia')->json('codigo');
        $carlosToken = $this->registrar('carlos@correo.com', 'cuida')['token'];
        $rosaId = User::where('email', 'rosa@correo.com')->value('id');

        $this->como($carlosToken)->postJson('/api/invitaciones', ['codigo' => $codigo, 'parentesco' => 'Mamá'])->assertOk();
        $this->como($carlosToken)->getJson("/api/pacientes/$rosaId/hoy")->assertOk()->assertJsonPath('alias', 'Rosa');
        $this->como($carlosToken)->getJson('/api/personas')->assertJsonPath('0.alias', 'Rosa');

        $horario = ['manana' => '07:30', 'mediodia' => '13:00', 'tarde' => '18:00', 'noche' => '21:00'];
        $this->como($carlosToken)->putJson("/api/pacientes/$rosaId/horario", $horario)->assertForbidden();

        $vinculo = $this->como($rosaToken)->getJson('/api/familia')->json('cuidadores.0.vinculo');
        $this->como($rosaToken)->patchJson("/api/familia/$vinculo", ['puede_editar' => true])->assertOk();
        $this->como($carlosToken)->putJson("/api/pacientes/$rosaId/horario", $horario)->assertOk();
        $this->assertSame('07:30', User::find($rosaId)->hora_manana);
    }

    public function test_un_extrano_no_ve_la_rutina_de_nadie(): void
    {
        $this->registrar();
        $otro = $this->registrar('otro@correo.com')['token'];
        $rosaId = User::where('email', 'rosa@correo.com')->value('id');

        $this->como($otro)->getJson("/api/pacientes/$rosaId/hoy")->assertNotFound();
    }

    public function test_vincular_el_pastillero_con_el_codigo_del_qr(): void
    {
        $token = $this->registrar()['token'];
        Device::create(['id' => 'MEM-0001', 'clave_hash' => Hash::make('K7Q9PX')]);
        $this->pastillero->shouldReceive('publicarHorario')->once();

        $this->como($token)->postJson('/api/pastillero/vincular', ['codigo' => 'MEM-0001-MALA00'])->assertUnprocessable();
        $this->como($token)->postJson('/api/pastillero/vincular', ['codigo' => 'mem-0001-k7q9px'])->assertOk();

        $this->assertSame(User::first()->id, Device::find('MEM-0001')->user_id);
    }

    public function test_si_el_broker_no_responde_la_toma_igual_queda_confirmada(): void
    {
        $token = $this->registrar()['token'];
        Device::create(['id' => 'MEM-0001', 'clave_hash' => Hash::make('X'), 'user_id' => User::first()->id]);
        $this->pastillero->shouldReceive('comando')->andReturn(false);

        $this->como($token)->postJson('/api/tomas/tarde')->assertOk()->assertJson(['estado' => 'tomada']);
        $this->como($token)->postJson('/api/pastillero/comando', ['comando' => 'silenciar'])
            ->assertStatus(503)->assertJson(['message' => 'No pudimos llegar al pastillero ahora. Apágalo con su botón.']);
    }

    public function test_no_se_puede_adivinar_la_clave_del_qr_probando(): void
    {
        $token = $this->registrar()['token'];
        Device::create(['id' => 'MEM-0001', 'clave_hash' => Hash::make('K7Q9PX')]);

        for ($i = 0; $i < 5; $i++) {
            $this->como($token)->postJson('/api/pastillero/vincular', ['codigo' => "MEM-0001-MALA0$i"])->assertUnprocessable();
        }
        $this->como($token)->postJson('/api/pastillero/vincular', ['codigo' => 'MEM-0001-K7Q9PX'])->assertTooManyRequests();
    }

    public function test_un_medicamento_nuevo_cambia_el_horario_del_pastillero(): void
    {
        $token = $this->registrar()['token'];
        $this->pastillero->shouldReceive('publicarHorario')->once();

        $this->como($token)->postJson('/api/pacientes/yo/medicamentos', [
            'nombre' => 'Atorvastatina', 'dosis' => '20 mg', 'franjas' => ['noche'], 'dias' => [1, 2, 3, 4, 5, 6, 7],
        ])->assertCreated();

        $this->assertSame(str_repeat('1011', 7), User::first()->load('medications')->tomas());
    }

    public function test_olvide_mi_clave_manda_un_codigo_por_correo_y_permite_una_nueva(): void
    {
        $this->registrar();
        $this->postJson('/api/clave/olvido', ['email' => 'nadie@correo.com'])->assertOk(); // no revela si existe
        $this->postJson('/api/clave/olvido', ['email' => 'rosa@correo.com'])->assertOk();

        $correos = app('mailer')->getSymfonyTransport()->messages();
        $this->assertCount(1, $correos);
        preg_match('/(\d{6})/', $correos[0]->getOriginalMessage()->getSubject(), $m);

        $this->postJson('/api/clave/restablecer', ['email' => 'rosa@correo.com', 'codigo' => '000000', 'password' => 'nueva-clave-1'])
            ->assertUnprocessable();
        $this->postJson('/api/clave/restablecer', ['email' => 'rosa@correo.com', 'codigo' => $m[1], 'password' => 'nueva-clave-1'])
            ->assertOk()->assertJsonStructure(['token']);
        $this->postJson('/api/login', ['email' => 'rosa@correo.com', 'password' => 'nueva-clave-1'])->assertOk();

        // el código sirve una sola vez y vence a los 15 minutos (1 min después: el límite por IP es compartido)
        $this->travel(1)->minutes();
        $this->postJson('/api/clave/restablecer', ['email' => 'rosa@correo.com', 'codigo' => $m[1], 'password' => 'otra-clave-2'])
            ->assertUnprocessable();
        $this->postJson('/api/clave/olvido', ['email' => 'rosa@correo.com']);
        preg_match('/(\d{6})/', app('mailer')->getSymfonyTransport()->messages()[1]->getOriginalMessage()->getSubject(), $m);
        $this->travel(16)->minutes();
        $this->postJson('/api/clave/restablecer', ['email' => 'rosa@correo.com', 'codigo' => $m[1], 'password' => 'otra-clave-2'])
            ->assertUnprocessable();
    }

    public function test_cinco_codigos_malos_borran_el_codigo_aunque_cambie_la_ip(): void
    {
        $this->registrar();
        $this->postJson('/api/clave/olvido', ['email' => 'rosa@correo.com']);
        preg_match('/(\d{6})/', app('mailer')->getSymfonyTransport()->messages()[0]->getOriginalMessage()->getSubject(), $m);
        $malo = $m[1] === '111111' ? '222222' : '111111';
        foreach (range(1, 5) as $i) {
            $this->withServerVariables(['REMOTE_ADDR' => "10.0.0.$i"])
                ->postJson('/api/clave/restablecer', ['email' => 'rosa@correo.com', 'codigo' => $malo, 'password' => 'nueva-clave-1'])
                ->assertUnprocessable();
        }
        $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.9'])
            ->postJson('/api/clave/restablecer', ['email' => 'rosa@correo.com', 'codigo' => $m[1], 'password' => 'nueva-clave-1'])
            ->assertUnprocessable();
    }
}
