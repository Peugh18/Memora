import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { Atras, Aviso, Boton, Campo, Chip, e, Pantalla, Titulo } from '@/components/ui';
import { api, Medicamento } from '@/lib/api';
import { C, DIAS, DIAS_LARGOS, F, FRANJAS } from '@/lib/tema';
import { useSesion } from '@/lib/sesion';

/** Nuevo o editar (?id=). Al guardar, el servidor recalcula los 28 compartimentos y avisa al pastillero. */
export default function MedicamentoForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { usuario } = useSesion();
  const [nombre, setNombre] = useState('');
  const [dosis, setDosis] = useState('');
  const [franjas, setFranjas] = useState<string[]>(['manana']);
  const [dias, setDias] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!id) return;
    api<Medicamento[]>('/pacientes/yo/medicamentos').then((lista) => {
      const m = lista.find((x) => String(x.id) === id);
      if (!m) return;
      setNombre(m.nombre);
      setDosis(m.dosis ?? '');
      setFranjas(m.franjas);
      setDias(m.dias);
    });
  }, [id]);

  const alternar = <T,>(lista: T[], v: T) => (lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]);

  const guardar = async () => {
    setEnviando(true);
    setError(null);
    try {
      await api(`/pacientes/yo/medicamentos${id ? `/${id}` : ''}`, { method: id ? 'PUT' : 'POST', body: { nombre, dosis: dosis || null, franjas, dias } });
      router.back();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  const borrar = () => Alert.alert(`¿Quitar ${nombre}?`, 'Ya no sonará para este medicamento.', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Quitar', style: 'destructive', onPress: async () => {
      await api(`/pacientes/yo/medicamentos/${id}`, { method: 'DELETE' }).catch((err) => setError(err.message));
      router.back();
    } },
  ]);

  return (
    <Pantalla abajo={
      <View style={{ padding: 20, gap: 4 }}>
        <Boton texto="Guardar medicamento" onPress={guardar} cargando={enviando} />
        {id && <Boton tipo="enlace" texto="Quitar medicamento" onPress={borrar} />}
      </View>
    }>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Atras />
        <Titulo chico>{id ? 'Editar medicamento' : 'Nuevo medicamento'}</Titulo>
      </View>
      <Campo etiqueta="Nombre" value={nombre} onChangeText={setNombre} placeholder="Ej. Metformina" />
      <Campo etiqueta="Dosis" value={dosis} onChangeText={setDosis} placeholder="Ej. 850 mg, 1 pastilla" />
      <View style={{ gap: 10 }}>
        <Text style={e.etiqueta}>¿Cuándo lo tomas?</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {FRANJAS.map((f) => (
            <Chip key={f.id} texto={`${f.nombre} · ${usuario?.horario[f.id] ?? ''}`} icono={f.icono} activo={franjas.includes(f.id)}
              cambiar={() => setFranjas(alternar(franjas, f.id))} />
          ))}
        </View>
      </View>
      <View style={{ gap: 10 }}>
        <Text style={e.etiqueta}>Días</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {DIAS.map((d, i) => {
            const activo = dias.includes(i + 1);
            return (
              <Pressable key={d} onPress={() => setDias(alternar(dias, i + 1))} accessibilityRole="checkbox" accessibilityState={{ checked: activo }}
                accessibilityLabel={DIAS_LARGOS[i]}
                style={{ flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: activo ? C.marca : C.blanco,
                  borderWidth: 1.5, borderColor: activo ? C.marca : C.borde }}>
                <Text style={{ fontFamily: F.negrita, fontSize: 15, color: activo ? C.blanco : C.texto }}>{d}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <Aviso texto={error} />
    </Pantalla>
  );
}
