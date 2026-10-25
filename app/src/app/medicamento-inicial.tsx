import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Boton, Campo, Chip, Aviso, Parrafo, Pasos, Pantalla, Titulo } from '@/components/ui';
import { useSesion } from '@/lib/sesion';
import { C, F, FRANJAS } from '@/lib/tema';

export default function MedicamentoInicial() {
  const { borrador, cambiarBorrador } = useSesion();
  const [nombre, setNombre] = useState(borrador.medicamento?.nombre ?? '');
  const [dosis, setDosis] = useState(borrador.medicamento?.dosis ?? '');
  const [franjas, setFranjas] = useState<string[]>(borrador.medicamento?.franjas ?? ['manana']);
  const [error, setError] = useState<string | null>(null);

  const agregar = () => {
    if (!nombre.trim()) return setError('Escribe el nombre del medicamento.');
    if (!franjas.length) return setError('Elige al menos un momento del día.');
    cambiarBorrador({ medicamento: { nombre: nombre.trim(), dosis: dosis.trim(), franjas } });
    router.push('/cuenta');
  };

  return (
    <Pantalla abajo={
      <View style={{ padding: 20, gap: 4 }}>
        <Boton texto="Agregar y continuar" onPress={agregar} />
        <Boton tipo="enlace" texto="Lo agrego después" onPress={() => { cambiarBorrador({ medicamento: null }); router.push('/cuenta'); }} />
      </View>
    }>
      <Pasos paso={5} />
      <View style={{ gap: 10, marginTop: 12 }}>
        <Titulo>Agrega tu primer medicamento</Titulo>
        <Parrafo>Después podrás agregar los demás.</Parrafo>
      </View>
      <Campo etiqueta="Nombre" value={nombre} onChangeText={(t) => { setNombre(t); setError(null); }} placeholder="Ej. Metformina" />
      <Campo etiqueta="Dosis" value={dosis} onChangeText={setDosis} placeholder="Ej. 850 mg, 1 pastilla" />
      <View style={{ gap: 10 }}>
        <Text style={{ fontFamily: F.semi, fontSize: 16, color: C.suave }}>¿Cuándo lo tomas?</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {FRANJAS.map((f) => (
            <Chip key={f.id} texto={f.nombre} icono={f.icono} activo={franjas.includes(f.id)}
              cambiar={() => setFranjas((a) => (a.includes(f.id) ? a.filter((x) => x !== f.id) : [...a, f.id]))} />
          ))}
        </View>
      </View>
      <Aviso texto={error} />
    </Pantalla>
  );
}
