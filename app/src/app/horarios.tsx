import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { SelectorHora } from '@/components/hora';
import { Boton, Ficha, ICONOS, Icono, Parrafo, Pasos, Pantalla, Tarjeta, Titulo } from '@/components/ui';
import { useSesion } from '@/lib/sesion';
import { C, F, FRANJAS } from '@/lib/tema';

export default function Horarios() {
  const { borrador, cambiarBorrador } = useSesion();

  return (
    <Pantalla abajo={<View style={{ padding: 20 }}><Boton texto="Continuar" onPress={() => router.push('/medicamento-inicial')} /></View>}>
      <Pasos paso={4} />
      <View style={{ gap: 10, marginTop: 12 }}>
        <Titulo>¿A qué hora tomas tus medicamentos?</Titulo>
        <Parrafo>Son las 4 filas de colores de tu pastillero. El sonido te avisará a estas horas.</Parrafo>
      </View>
      <View style={{ gap: 10 }}>
        {FRANJAS.map((f) => (
          <Tarjeta key={f.id} estilo={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
            <Ficha id={f.id} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.negrita, fontSize: 17, color: C.texto }}>{f.nombre}</Text>
              <Text style={{ fontFamily: F.normal, fontSize: 14, color: C.suave }}>Fila {f.fila}</Text>
            </View>
            <SelectorHora etiqueta={f.nombre} valor={borrador.horario[f.id]}
              cambiar={(h) => cambiarBorrador({ horario: { ...borrador.horario, [f.id]: h } })} />
          </Tarjeta>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: C.celeste, padding: 14, borderRadius: 16 }}>
        <Icono d={ICONOS.wifi} color={C.marca} />
        <Text style={{ flex: 1, fontFamily: F.medio, fontSize: 15, color: C.marcaOscuro }}>El pastillero sonará aunque no tengas internet en ese momento.</Text>
      </View>
    </Pantalla>
  );
}
