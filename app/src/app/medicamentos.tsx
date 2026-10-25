import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Atras, Aviso, Boton, ICONOS, Icono, Pantalla, Titulo } from '@/components/ui';
import { Medicamento } from '@/lib/api';
import { useDatos } from '@/lib/useDatos';
import { C, F, franja } from '@/lib/tema';

const dias = (d: number[]) => (d.length === 7 ? 'todos los días' : d.length === 5 && !d.includes(6) && !d.includes(7) ? 'lunes a viernes' : `${d.length} días`);

export default function Medicamentos() {
  const { datos, error } = useDatos<Medicamento[]>('/pacientes/yo/medicamentos');

  return (
    <Pantalla abajo={<View style={{ padding: 20 }}><Boton texto="Agregar medicamento" icono={ICONOS.mas} onPress={() => router.push('/medicamento')} /></View>}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Atras />
        <Titulo chico>Medicamentos</Titulo>
      </View>
      <Aviso texto={error} />
      {datos?.length === 0 && <Text style={{ fontFamily: F.semi, fontSize: 16, color: C.suave }}>Todavía no agregas medicamentos.</Text>}
      {datos?.map((m) => (
        <Pressable key={m.id} onPress={() => router.push({ pathname: '/medicamento', params: { id: String(m.id) } })} accessibilityRole="button"
          accessibilityLabel={`Editar ${m.nombre}`}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: C.blanco, borderRadius: 20 }}>
          <View style={{ width: 42, height: 42, borderRadius: 15, backgroundColor: '#D3EEF3', alignItems: 'center', justifyContent: 'center' }}>
            <Icono d={ICONOS.pastilla} color={C.marca} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontFamily: F.negrita, fontSize: 18, color: C.texto }}>{m.nombre}</Text>
            <Text style={{ fontFamily: F.normal, fontSize: 14, color: C.suave }}>{[m.dosis, dias(m.dias)].filter(Boolean).join(' · ')}</Text>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              {m.franjas.map((id) => {
                const f = franja(id);
                return (
                  <Text key={id} style={{ fontFamily: F.negrita, fontSize: 13, color: f.tinta, backgroundColor: f.fondo, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' }}>
                    {f.nombre}
                  </Text>
                );
              })}
            </View>
          </View>
          <Icono d={ICONOS.derecha} color={C.suave} />
        </Pressable>
      ))}
    </Pantalla>
  );
}
