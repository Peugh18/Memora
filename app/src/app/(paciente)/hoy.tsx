import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Aviso, Boton, Ficha, ICONOS, Icono, Pantalla, Pildora } from '@/components/ui';
import { api, Hoy as DatosHoy, Toma } from '@/lib/api';
import { useSesion } from '@/lib/sesion';
import { useDatos } from '@/lib/useDatos';
import { C, DIAS_LARGOS, F, franja } from '@/lib/tema';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];

function saludo() {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
}

function pildora(t: Toma) {
  if (t.estado === 'tomada') return <Pildora texto={t.confirmada_en ?? 'Tomada'} fondo={C.celeste} color={C.marcaOscuro} icono={ICONOS.check} />;
  if (t.estado === 'pendiente') return <Pildora texto="Ahora" fondo={C.alertaSuave} color={C.alertaSuaveTexto} />;
  if (t.estado === 'omitida') return <Pildora texto="Sin confirmar" fondo={C.alertaSuave} color={C.alertaSuaveTexto} />;
  if (t.estado === 'sin_medicamentos') return <Pildora texto="Libre" fondo="#EDF3F5" color={C.suave} />;
  return <Pildora texto="Pendiente" fondo="#EDF3F5" color={C.suave} />;
}

export default function Hoy() {
  const { usuario } = useSesion();
  const { datos, error, cargar, setDatos } = useDatos<DatosHoy>('/pacientes/yo/hoy', 5000);
  const [silenciada, setSilenciada] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  if (!datos) return <Pantalla><Aviso texto={error} /></Pantalla>;

  const hoy = new Date();
  // La toma de ahora: la pendiente más reciente; si no hay, la próxima; si no, la última tomada
  const pendientes = datos.tomas.filter((t) => t.estado === 'pendiente');
  const actual = pendientes.at(-1) ?? datos.tomas.find((t) => t.estado === 'por_venir') ?? datos.tomas.filter((t) => t.estado === 'tomada').at(-1);
  const f = actual ? franja(actual.franja) : null;
  const filaIdx = actual ? ['manana', 'mediodia', 'tarde', 'noche'].indexOf(actual.franja) : -1;
  const celda = filaIdx * 7 + datos.dia_semana - 1;

  const accion = async (fn: () => Promise<unknown>) => {
    setTrabajando(true);
    setAviso(null);
    try {
      await fn();
      await cargar();
    } catch (err) {
      setAviso((err as Error).message);
    } finally {
      setTrabajando(false);
    }
  };

  const tomar = () => accion(async () => {
    const r = await api<{ estado: string; confirmada_en: string }>(`/tomas/${actual!.franja}`, { method: 'POST' });
    setDatos({ ...datos, tomas: datos.tomas.map((t) => (t.franja === actual!.franja ? { ...t, estado: 'tomada', confirmada_en: r.confirmada_en } : t)) });
  });
  const apagar = () => accion(async () => {
    await api('/pastillero/comando', { method: 'POST', body: { comando: 'silenciar' } });
    setSilenciada(actual!.franja);
  });
  const deshacer = () => accion(() => api(`/tomas/${actual!.franja}`, { method: 'DELETE' }));

  const estado = actual?.estado === 'tomada' ? 'tomada' : actual?.estado === 'pendiente' ? (silenciada === actual.franja ? 'silenciado' : 'sonando') : 'proxima';
  const chip = { tomada: 'Tomada', silenciado: 'Silenciado', sonando: 'Ahora', proxima: 'Próxima' }[estado];

  return (
    <Pantalla>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => router.push('/perfil')} accessibilityRole="button" accessibilityLabel="Mi perfil y ajustes"
          style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: C.alerta, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: F.extra, fontSize: 19, color: '#6B3A06' }}>{usuario?.alias.charAt(0)}</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ fontFamily: F.normal, fontSize: 15, color: C.suave }}>
            {DIAS_LARGOS[datos.dia_semana - 1].replace(/^./, (l) => l.toUpperCase())} {hoy.getDate()} de {MESES[hoy.getMonth()]}
          </Text>
          <Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8} style={{ fontFamily: F.extra, fontSize: 24, lineHeight: 28, color: C.texto }}>
            {saludo()}, {usuario?.alias}
          </Text>
        </View>
        <Pressable onPress={() => router.push('/pastillero')} accessibilityRole="button"
          accessibilityLabel={datos.pastillero?.en_linea ? 'Pastillero en línea' : 'Pastillero sin conexión'}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 12, borderRadius: 999, backgroundColor: C.blanco }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: datos.pastillero?.en_linea ? C.marcaClaro : C.sinConfirmar }} />
          <Text style={{ fontFamily: F.negrita, fontSize: 13, color: C.marcaOscuro }}>
            {!datos.pastillero ? 'Sin pastillero' : datos.pastillero.en_linea ? 'En línea' : 'Sin conexión'}
          </Text>
        </Pressable>
      </View>

      {actual && f ? (
        <View style={{ borderRadius: 26, padding: 20, backgroundColor: C.marca, gap: 16 }} accessibilityLabel="Toma de ahora">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.extra, fontSize: 30, color: C.blanco }}>{f.nombre} · {actual.hora}</Text>
              <Text style={{ fontFamily: F.normal, fontSize: 16, color: '#EAF8FB' }}>
                {actual.medicamentos.map((m) => [m.nombre, m.dosis].filter(Boolean).join(' ')).join(' · ')}
              </Text>
            </View>
            <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999,
              backgroundColor: estado === 'tomada' ? C.verde : C.alerta }}>
              <Icono d={estado === 'tomada' ? ICONOS.check : ICONOS.campana} tam={14} grosor={3} color={estado === 'tomada' ? C.verdeTexto : C.alertaTexto} />
              <Text style={{ fontFamily: F.extra, fontSize: 14, color: estado === 'tomada' ? C.verdeTexto : C.alertaTexto }}>{chip}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(255,255,255,.1)', borderRadius: 16, padding: 12 }}>
            <View style={{ width: 7 * 12 + 6 * 3, flexDirection: 'row', flexWrap: 'wrap', gap: 3 }} accessibilityElementsHidden>
              {Array.from({ length: 28 }, (_, i) => (
                <View key={i} style={{ width: 12, height: 9, borderRadius: 3, backgroundColor: i === celda ? C.alerta : 'rgba(255,255,255,.28)' }} />
              ))}
            </View>
            <Text style={{ flex: 1, fontFamily: F.normal, fontSize: 15, color: '#EAF8FB' }}>
              Abre el compartimento <Text style={{ fontFamily: F.negrita, color: C.blanco }}>{DIAS_LARGOS[datos.dia_semana - 1]}, fila {f.fila}</Text>
            </Text>
          </View>
          {estado === 'sonando' && (
            <>
              <Text style={{ fontFamily: F.normal, fontSize: 15, color: '#EAF8FB' }}>Si ya la tomaste, confírmalo aquí o con el botón del pastillero.</Text>
              <Boton tipo="blanco" icono={ICONOS.check} texto="Ya la tomé" onPress={tomar} cargando={trabajando} />
              {datos.pastillero && <Boton tipo="borde" icono={ICONOS.silencio} texto="Solo apagar el sonido" onPress={apagar} desactivado={trabajando} />}
            </>
          )}
          {estado === 'silenciado' && (
            <>
              <Text style={{ fontFamily: F.normal, fontSize: 15, color: '#EAF8FB' }}>Sonido apagado. Confirma cuando la tomes; si pasan {usuario?.minutos_tolerancia} minutos, le avisamos a tu familia.</Text>
              <Boton tipo="blanco" icono={ICONOS.check} texto="Ya la tomé" onPress={tomar} cargando={trabajando} />
            </>
          )}
          {estado === 'tomada' && (
            <>
              <Text style={{ fontFamily: F.normal, fontSize: 15, color: '#EAF8FB' }}>
                <Text style={{ fontFamily: F.negrita, color: C.blanco }}>Tomada a las {actual.confirmada_en}.</Text> Tu familia ya lo ve.
              </Text>
              <Boton tipo="borde" texto="Deshacer" onPress={deshacer} desactivado={trabajando} />
            </>
          )}
        </View>
      ) : (
        <View style={{ borderRadius: 26, padding: 20, backgroundColor: C.marca }}>
          <Text style={{ fontFamily: F.extra, fontSize: 24, color: C.blanco }}>Hoy no tienes tomas</Text>
          <Text style={{ fontFamily: F.normal, fontSize: 16, color: '#EAF8FB' }}>Agrega un medicamento con el botón +.</Text>
        </View>
      )}
      <Aviso texto={aviso ?? error} />

      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={{ fontFamily: F.extra, fontSize: 19, color: C.texto }}>Tu día</Text>
          <Text style={{ fontFamily: F.normal, fontSize: 15, color: C.suave }}>{datos.confirmadas} de {datos.total} tomas</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }} accessibilityLabel={`${datos.confirmadas} de ${datos.total} tomas confirmadas hoy`}>
          {datos.tomas.filter((t) => t.estado !== 'sin_medicamentos').map((t) => (
            <View key={t.franja} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: t.estado === 'tomada' ? C.marca : t.estado === 'pendiente' || t.estado === 'omitida' ? C.alerta : C.linea }} />
          ))}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        {datos.tomas.map((t) => (
          <View key={t.franja} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 10, paddingHorizontal: 16, backgroundColor: C.blanco, borderRadius: 20,
            borderWidth: t.franja === actual?.franja && t.estado === 'pendiente' ? 2 : 0, borderColor: C.alerta }}>
            <Ficha id={t.franja} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.negrita, fontSize: 17, color: C.texto }}>{franja(t.franja).nombre} · {t.hora}</Text>
              <Text style={{ fontFamily: F.normal, fontSize: 14, color: C.suave }}>{t.medicamentos.map((m) => m.nombre).join(', ') || 'Sin medicamentos'}</Text>
            </View>
            {pildora(t)}
          </View>
        ))}
      </View>
    </Pantalla>
  );
}
