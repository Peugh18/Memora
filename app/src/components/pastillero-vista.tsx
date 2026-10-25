import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { api } from '@/lib/api';
import { useSesion } from '@/lib/sesion';
import { useDatos } from '@/lib/useDatos';
import { C, DIAS, DIAS_LARGOS, F, FRANJAS } from '@/lib/tema';
import { SelectorHora } from './hora';
import { Aviso, Boton, ICONOS, Icono, Tarjeta } from './ui';

type Datos = {
  pastillero: { id: string; en_linea: boolean } | null;
  horario: Record<string, string>;
  celdas: Record<string, number[]>;
  medicamentos: number;
};

/** Cuadrícula 7 × 4 igual al pastillero físico, horas y prueba de sonido. `paciente` = "yo" o el id de quien cuido. */
export function PastilleroVista({ paciente, puedeEditar = true }: { paciente: string; puedeEditar?: boolean }) {
  const { datos, error, cargar } = useDatos<Datos>(`/pacientes/${paciente}/pastillero`, 5000);
  const { refrescar } = useSesion();
  const [editado, setHorario] = useState<Record<string, string> | null>(null); // null = sin cambios: se muestra lo del servidor
  const [sonando, setSonando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const hoy = (new Date().getDay() + 6) % 7;

  if (!datos) return <Aviso texto={error} />;
  const horario = editado ?? datos.horario;

  const correr = async (fn: () => Promise<void>) => {
    setTrabajando(true);
    setAviso(null);
    try {
      await fn();
    } catch (err) {
      setAviso((err as Error).message);
    } finally {
      setTrabajando(false);
    }
  };

  const probar = () => correr(async () => {
    await api('/pastillero/comando', { method: 'POST', body: { comando: sonando ? 'silenciar' : 'probar_alarma' } });
    setSonando(!sonando);
  });

  const guardar = () => correr(async () => {
    await api(`/pacientes/${paciente}/horario`, { method: 'PUT', body: horario });
    setGuardado(true);
    setHorario(null); // ya no hay cambios sin guardar: se muestra lo que tiene el servidor
    await Promise.all([cargar(), refrescar()]);
  });

  const p = datos.pastillero;
  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 22, backgroundColor: C.marca }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.14)', alignItems: 'center', justifyContent: 'center' }}>
          <Icono d={ICONOS.wifi} color={C.blanco} />
        </View>
        <View style={{ flex: 1 }} accessibilityLiveRegion="polite">
          <Text style={{ fontFamily: F.negrita, fontSize: 17, color: C.blanco }}>
            {p ? `${p.id} ${p.en_linea ? 'conectado' : 'sin conexión'}` : 'Sin pastillero'}
          </Text>
          <Text style={{ fontFamily: F.normal, fontSize: 14, color: '#EAF8FB' }}>
            {!p ? 'Vincúlalo con el QR' : sonando ? 'Sonando: apágalo aquí o con su botón' : p.en_linea ? 'En línea' : 'Revisa su Wi-Fi'}
          </Text>
        </View>
        {paciente === 'yo' && (p ? (
          <Pressable onPress={probar} disabled={trabajando} accessibilityRole="button"
            style={{ height: 44, paddingHorizontal: 14, borderRadius: 13, backgroundColor: C.blanco, justifyContent: 'center' }}>
            <Text style={{ fontFamily: F.negrita, fontSize: 15, color: C.marcaOscuro }}>{sonando ? 'Apagar' : 'Probar sonido'}</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => router.push('/vincular')} accessibilityRole="button"
            style={{ height: 44, paddingHorizontal: 14, borderRadius: 13, backgroundColor: C.blanco, justifyContent: 'center' }}>
            <Text style={{ fontFamily: F.negrita, fontSize: 15, color: C.marcaOscuro }}>Vincular</Text>
          </Pressable>
        ))}
      </View>

      <Tarjeta estilo={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', gap: 5 }}>
          <View style={{ width: 34 }} />
          {DIAS.map((d, i) => (
            <View key={d} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <View style={{ width: 18, height: 5, borderRadius: 3, backgroundColor: i === hoy ? C.marca : C.linea }} />
              <Text style={{ fontFamily: i === hoy ? F.extra : F.medio, fontSize: 14, color: i === hoy ? C.marca : C.suave }}>{d}</Text>
            </View>
          ))}
        </View>
        {FRANJAS.map((f) => (
          <View key={f.id} style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
            <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: f.fondo, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel={f.nombre}>
              <Icono d={f.icono} tam={20} color={f.tinta} />
            </View>
            {datos.celdas[f.id].map((n, i) => (
              <View key={i} accessibilityLabel={`${DIAS_LARGOS[i]}, ${f.nombre}: ${n ? `${n} ${n === 1 ? 'medicamento' : 'medicamentos'}` : 'vacío'}`}
                style={{ flex: 1, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: n ? f.fondo : C.blanco,
                  borderWidth: i === hoy ? 2 : n ? 0 : 1.5, borderColor: i === hoy ? C.marca : '#C3D6DC', borderStyle: i === hoy || n ? 'solid' : 'dashed' }}>
                <Text style={{ fontFamily: F.negrita, fontSize: 17, color: f.tinta }}>{n || ''}</Text>
              </View>
            ))}
          </View>
        ))}
        <Text style={{ fontFamily: F.normal, fontSize: 14, color: C.suave, marginTop: 6 }}>El número es cuántos medicamentos van en cada compartimento.</Text>
      </Tarjeta>

      <Tarjeta>
        {FRANJAS.map((f) => (
          <View key={f.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 6, height: 28, borderRadius: 3, backgroundColor: f.fondo }} />
            <Text style={{ flex: 1, fontFamily: F.negrita, fontSize: 16, color: f.tinta }}>{f.nombre}</Text>
            {puedeEditar ? (
              <SelectorHora etiqueta={f.nombre} valor={horario[f.id]} cambiar={(h) => { setHorario({ ...horario, [f.id]: h }); setGuardado(false); }} />
            ) : (
              <Text style={{ fontFamily: F.extra, fontSize: 18, color: C.marcaOscuro }}>{horario[f.id]}</Text>
            )}
          </View>
        ))}
        {puedeEditar && <Boton texto={guardado ? '✓ Horarios enviados al pastillero' : 'Guardar horarios'} onPress={guardar} cargando={trabajando} />}
      </Tarjeta>
      <Aviso texto={aviso ?? error} />

      {paciente === 'yo' && (
        <Pressable onPress={() => router.push('/medicamentos')} accessibilityRole="button"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: C.blanco, borderRadius: 22 }}>
          <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: '#D3EEF3', alignItems: 'center', justifyContent: 'center' }}>
            <Icono d={ICONOS.pastilla} color={C.marca} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: F.negrita, fontSize: 17, color: C.texto }}>Medicamentos</Text>
            <Text style={{ fontFamily: F.normal, fontSize: 14, color: C.suave }}>{datos.medicamentos} activos</Text>
          </View>
          <Icono d={ICONOS.derecha} color={C.suave} />
        </Pressable>
      )}
    </View>
  );
}
