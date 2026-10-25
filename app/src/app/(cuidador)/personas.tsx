import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Avatar, Aviso, Boton, ICONOS, Icono, Pantalla, Titulo } from '@/components/ui';
import { useSesion } from '@/lib/sesion';
import { useDatos } from '@/lib/useDatos';
import { C, F, franja, FRANJAS } from '@/lib/tema';

export type Persona = {
  id: number;
  nombre: string;
  alias: string;
  parentesco: string;
  puede_editar: boolean;
  celular: string | null;
  tiene_whatsapp: boolean;
  pastillero: { id: string; en_linea: boolean; ultima_conexion: string | null } | null;
  tomas: { franja: string; estado: string }[];
  omitida: { franja: string; updated_at: string } | null;
};

export default function Personas() {
  const { usuario } = useSesion();
  const { datos, error } = useDatos<Persona[]>('/personas', 20000);
  const alertas = datos?.filter((p) => p.omitida) ?? [];

  return (
    <Pantalla>
      {usuario?.es_paciente && (
        <View style={{ flexDirection: 'row', gap: 4, backgroundColor: '#DDEBF0', borderRadius: 14, padding: 4 }} accessibilityRole="tablist">
          <Pressable onPress={() => router.replace('/hoy')} accessibilityRole="tab" style={{ flex: 1, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: F.negrita, fontSize: 15, color: C.suave }}>Mi rutina</Text>
          </Pressable>
          <View accessibilityRole="tab" accessibilityState={{ selected: true }} style={{ flex: 1, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: C.blanco }}>
            <Text style={{ fontFamily: F.negrita, fontSize: 15, color: C.marcaOscuro }}>Personas que cuido</Text>
          </View>
        </View>
      )}
      <Titulo chico>Personas que cuido</Titulo>
      <Aviso texto={error} />

      {alertas.map((p) => (
        <Pressable key={`a${p.id}`} onPress={() => router.push(`/persona/${p.id}`)} accessibilityRole="button"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 20, backgroundColor: C.alertaSuave, borderWidth: 2, borderColor: C.sinConfirmar }}>
          <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: C.alerta, alignItems: 'center', justifyContent: 'center' }}>
            <Icono d={ICONOS.campana} color={C.alertaTexto} />
          </View>
          <Text style={{ flex: 1, fontFamily: F.negrita, fontSize: 16, color: C.alertaSuaveTexto }}>
            {p.alias} no confirmó {franja(p.omitida!.franja).nombre.toLowerCase()}
          </Text>
          <Icono d={ICONOS.derecha} color={C.alertaSuaveTexto} />
        </Pressable>
      ))}

      {datos?.length === 0 && (
        <Text style={{ fontFamily: F.semi, fontSize: 16, color: C.suave }}>Todavía no cuidas a nadie. Pídele su código a tu familiar.</Text>
      )}
      {datos?.map((p) => (
        <Pressable key={p.id} onPress={() => router.push(`/persona/${p.id}`)} accessibilityRole="button" accessibilityLabel={`Ver a ${p.alias}`}
          style={{ padding: 16, gap: 12, backgroundColor: C.blanco, borderRadius: 22 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar nombre={p.alias} />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ fontFamily: F.negrita, fontSize: 18, color: C.texto }}>{p.alias}</Text>
              <Text style={{ fontFamily: F.normal, fontSize: 14, color: C.suave }}>
                {p.parentesco} · {!p.pastillero ? 'sin pastillero' : p.pastillero.en_linea ? 'pastillero conectado' : 'pastillero sin conexión'}
              </Text>
            </View>
            <Icono d={ICONOS.derecha} color={C.suave} />
          </View>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {FRANJAS.map((f) => {
              const t = p.tomas.find((x) => x.franja === f.id);
              const ok = t?.estado === 'tomada';
              const mal = t?.estado === 'omitida';
              return (
                <View key={f.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999,
                  backgroundColor: ok ? C.celeste : mal ? C.alertaSuave : '#EDF3F5' }}>
                  {ok && <Icono d={ICONOS.check} tam={13} grosor={3} color={C.marcaOscuro} />}
                  <Text style={{ fontFamily: F.negrita, fontSize: 13, color: ok ? C.marcaOscuro : mal ? C.alertaSuaveTexto : C.suave }}>{f.nombre}</Text>
                </View>
              );
            })}
          </View>
        </Pressable>
      ))}
      <Boton tipo="claro" icono={ICONOS.mas} texto="Tengo un código de invitación" onPress={() => router.push('/codigo')} />
    </Pantalla>
  );
}
