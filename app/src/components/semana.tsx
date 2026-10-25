import { Text, View } from 'react-native';

import { C, DIAS, DIAS_LARGOS, F } from '@/lib/tema';

export type Dia = { fecha: string; tomadas: number; omitidas: number; pendientes: number };

/** Barras apiladas por día: confirmadas abajo, sin confirmar arriba. Igual en Historial y en el detalle del cuidador. */
export function Semana({ dias }: { dias: Dia[] }) {
  const hoy = (new Date().getDay() + 6) % 7;
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 92, borderBottomWidth: 1, borderColor: C.linea }}>
        {dias.map((d, i) => (
          <View key={d.fecha} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}
            accessibilityLabel={`${DIAS_LARGOS[i]}: ${d.tomadas} confirmadas, ${d.omitidas} sin confirmar`}>
            {Array.from({ length: d.omitidas }, (_, k) => <View key={`o${k}`} style={{ width: 24, height: 19, borderRadius: 4, backgroundColor: C.sinConfirmar }} />)}
            {Array.from({ length: d.pendientes }, (_, k) => <View key={`p${k}`} style={{ width: 24, height: 19, borderRadius: 4, backgroundColor: '#EAF2F5', borderWidth: 1, borderColor: C.linea }} />)}
            {Array.from({ length: d.tomadas }, (_, k) => <View key={`t${k}`} style={{ width: 24, height: 19, borderRadius: 4, backgroundColor: C.confirmada }} />)}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row' }}>
        {DIAS.map((d, i) => (
          <Text key={d} style={{ flex: 1, textAlign: 'center', fontFamily: i === hoy ? F.extra : F.medio, fontSize: 13, color: i === hoy ? C.marcaOscuro : C.suave }}>{d}</Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        {[[C.confirmada, 'Confirmada'], [C.sinConfirmar, 'Sin confirmar']].map(([color, texto]) => (
          <View key={texto} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
            <Text style={{ fontFamily: F.normal, fontSize: 13, color: '#2C4853' }}>{texto}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
