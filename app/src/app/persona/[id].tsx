import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { Contacto } from '@/components/contacto';
import { Dia, Semana } from '@/components/semana';
import { Atras, Avatar, Aviso, Boton, Ficha, ICONOS, Pantalla, Pildora, Tarjeta } from '@/components/ui';
import { Hoy } from '@/lib/api';
import { useDatos } from '@/lib/useDatos';
import { C, F, franja } from '@/lib/tema';
import type { Persona } from '../(cuidador)/personas';

const ESTADO: Record<string, [string, string, string]> = {
  tomada: ['', C.celeste, C.marcaOscuro],
  pendiente: ['Ahora', C.alertaSuave, C.alertaSuaveTexto],
  omitida: ['Sin confirmar', C.alertaSuave, C.alertaSuaveTexto],
  por_venir: ['Pendiente', '#EDF3F5', C.suave],
  sin_medicamentos: ['Libre', '#EDF3F5', C.suave],
};

export default function PersonaDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const hoy = useDatos<Hoy>(`/pacientes/${id}/hoy`, 20000);
  const hist = useDatos<{ semana: Dia[] }>(`/pacientes/${id}/historial`);
  const personas = useDatos<Persona[]>('/personas');
  const p = personas.datos?.find((x) => String(x.id) === id);

  if (!hoy.datos || !p) return <Pantalla><Atras /><Aviso texto={hoy.error ?? personas.error} /></Pantalla>;

  const pendiente = hoy.datos.tomas.find((t) => t.estado === 'pendiente' || t.estado === 'omitida');
  const tomadas = hist.datos?.semana.reduce((s, d) => s + d.tomadas, 0) ?? 0;
  const cerradas = tomadas + (hist.datos?.semana.reduce((s, d) => s + d.omitidas, 0) ?? 0);
  const mensaje = pendiente ? `Hola, ¿ya tomaste tu pastilla de ${franja(pendiente.franja).nombre.toLowerCase()}?` : undefined;

  return (
    <Pantalla>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Atras />
        <Avatar nombre={p.alias} tam={52} />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ fontFamily: F.extra, fontSize: 24, color: C.texto }}>{p.alias}</Text>
          <Text style={{ fontFamily: F.normal, fontSize: 14, color: C.suave }}>{p.parentesco}{p.celular ? ` · +51 ${p.celular}` : ''}</Text>
        </View>
        <Contacto nombre={p.alias} celular={p.celular} whatsapp={p.tiene_whatsapp} mensaje={mensaje} />
      </View>

      {hist.datos && (
        <Tarjeta>
          <Text style={{ fontFamily: F.extra, fontSize: 17, color: C.texto }}>Esta semana</Text>
          <Text style={{ fontFamily: F.normal, fontSize: 14, color: C.suave }}>
            {cerradas ? `${tomadas} de ${cerradas} confirmadas · ${Math.round((100 * tomadas) / cerradas)} %` : 'Todavía sin tomas'}
          </Text>
          <Semana dias={hist.datos.semana} />
        </Tarjeta>
      )}

      <Tarjeta>
        {hoy.datos.tomas.map((t) => {
          const [texto, fondo, color] = ESTADO[t.estado];
          return (
            <View key={t.franja} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ficha id={t.franja} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: F.negrita, fontSize: 16, color: C.texto }}>{franja(t.franja).nombre} · {t.hora}</Text>
                <Text style={{ fontFamily: F.normal, fontSize: 14, color: C.suave }}>{t.medicamentos.map((m) => m.nombre).join(', ') || 'Sin medicamentos'}</Text>
              </View>
              <Pildora texto={t.estado === 'tomada' ? t.confirmada_en ?? 'Tomada' : texto} fondo={fondo} color={color}
                icono={t.estado === 'tomada' ? ICONOS.check : undefined} />
            </View>
          );
        })}
      </Tarjeta>

      <Text style={{ fontFamily: F.normal, fontSize: 15, lineHeight: 21, color: C.suave }}>
        Solo {p.alias} confirma sus tomas. Si ya la tomó, pídele que presione el botón del pastillero.
      </Text>
      {p.puede_editar && <Boton tipo="claro" texto="Editar sus horarios" onPress={() => router.push(`/persona-horario/${p.id}`)} />}
    </Pantalla>
  );
}
