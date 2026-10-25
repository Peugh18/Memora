import { Text, View } from 'react-native';

import { Dia, Semana } from '@/components/semana';
import { Aviso, ICONOS, Icono, Pantalla, Tarjeta, Titulo } from '@/components/ui';
import { useDatos } from '@/lib/useDatos';
import { C, DIAS_LARGOS, F, franja } from '@/lib/tema';

type Historial = {
  semana: Dia[];
  semanas: { desde: string; porcentaje: number | null }[];
  omitidas: { fecha: string; franja: string; hora: string; medicamentos: string[] }[];
};

export default function HistorialPantalla() {
  const { datos, error } = useDatos<Historial>('/pacientes/yo/historial');
  if (!datos) return <Pantalla><Titulo chico>Historial</Titulo><Aviso texto={error} /></Pantalla>;

  const tomadas = datos.semana.reduce((s, d) => s + d.tomadas, 0);
  const cerradas = tomadas + datos.semana.reduce((s, d) => s + d.omitidas, 0);

  return (
    <Pantalla>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Titulo chico>Historial</Titulo>
        <Text style={{ fontFamily: F.negrita, fontSize: 15, color: C.suave }}>Esta semana</Text>
      </View>

      <Tarjeta>
        <Text style={{ fontFamily: F.extra, fontSize: 17, color: C.texto }}>Tomas por día</Text>
        <Text style={{ fontFamily: F.normal, fontSize: 14, color: C.suave }}>
          {cerradas ? `${tomadas} de ${cerradas} confirmadas · ${Math.round((100 * tomadas) / cerradas)} %` : 'Todavía no hay tomas esta semana'}
        </Text>
        <Semana dias={datos.semana} />
      </Tarjeta>

      <Tarjeta>
        <Text style={{ fontFamily: F.extra, fontSize: 17, color: C.texto }}>Últimas 4 semanas</Text>
        <Text style={{ fontFamily: F.normal, fontSize: 14, color: C.suave }}>Porcentaje de tomas confirmadas</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, height: 120 }}>
          {datos.semanas.map((s, i) => (
            <View key={s.desde} style={{ flex: 1, alignItems: 'center', gap: 6 }}
              accessibilityLabel={`${i === 3 ? 'Esta semana' : `Semana ${i + 1}`}: ${s.porcentaje ?? 'sin datos'} %`}>
              <Text style={{ fontFamily: F.extra, fontSize: 13, color: C.texto }}>{s.porcentaje === null ? '–' : `${s.porcentaje} %`}</Text>
              <View style={{ width: '100%', height: Math.max(4, ((s.porcentaje ?? 0) / 100) * 70), borderRadius: 6,
                backgroundColor: i === 3 ? C.confirmada : '#9FD8E0' }} />
              <Text style={{ fontFamily: F.normal, fontSize: 12, color: C.suave }}>{i === 3 ? 'Esta' : `Sem ${i + 1}`}</Text>
            </View>
          ))}
        </View>
      </Tarjeta>

      <Tarjeta estilo={{ gap: 0, paddingVertical: 6 }}>
        {datos.omitidas.length === 0 ? (
          <Text style={{ fontFamily: F.semi, fontSize: 16, color: C.marcaOscuro, paddingVertical: 12 }}>Ninguna toma sin confirmar esta semana.</Text>
        ) : datos.omitidas.map((o, i) => (
          <View key={o.fecha + o.franja} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10,
            borderTopWidth: i ? 1 : 0, borderColor: '#EAF2F5' }}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: C.alertaSuave, alignItems: 'center', justifyContent: 'center' }}>
              <Icono d={ICONOS.reloj} tam={20} color="#B45309" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.negrita, fontSize: 16, color: C.texto }}>
                {DIAS_LARGOS[(new Date(o.fecha + 'T12:00').getDay() + 6) % 7].replace(/^./, (l) => l.toUpperCase())} · {franja(o.franja).nombre}
              </Text>
              <Text style={{ fontFamily: F.normal, fontSize: 13, color: C.suave }}>{[o.medicamentos.join(', '), o.hora].filter(Boolean).join(' · ')}</Text>
            </View>
          </View>
        ))}
      </Tarjeta>
    </Pantalla>
  );
}
