import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Boton, Ficha, Parrafo, Pantalla, Tarjeta, Titulo } from '@/components/ui';
import { useSesion } from '@/lib/sesion';
import { C, F, FRANJAS } from '@/lib/tema';

export default function Listo() {
  const { usuario, borrador } = useSesion();
  const med = borrador.medicamento;

  return (
    <Pantalla abajo={
      <View style={{ padding: 20, gap: 4 }}>
        <Boton texto="Ir a mi día" onPress={() => router.replace('/hoy')} />
        <Boton tipo="enlace" texto="Invitar a un familiar" onPress={() => router.replace('/familia')} />
      </View>
    }>
      <Image source={require('@/assets/images/listo.png')} style={{ width: '100%', height: 200 }} contentFit="contain" />
      <View style={{ gap: 10 }}>
        <Titulo>¡Listo, {usuario?.alias}!</Titulo>
        <Parrafo>Tu rutina está lista. Tu pastillero sonará a estas horas.</Parrafo>
      </View>
      <Tarjeta>
        {FRANJAS.map((f) => (
          <View key={f.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Ficha id={f.id} tam={38} />
            <Text style={{ fontFamily: F.extra, fontSize: 18, color: C.texto, width: 60 }}>{usuario?.horario[f.id]}</Text>
            <Text style={{ fontFamily: F.normal, fontSize: 16, color: C.suave }}>
              {med?.franjas.includes(f.id) ? med.nombre : 'Sin medicamentos'}
            </Text>
          </View>
        ))}
      </Tarjeta>
    </Pantalla>
  );
}
