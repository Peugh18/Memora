import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

import { api } from '@/lib/api';
import { useSesion } from '@/lib/sesion';
import { C, F } from '@/lib/tema';
import { Atras, Avatar, Aviso, ICONOS, Icono } from './ui';

const TOLERANCIAS = [15, 30, 45, 60];

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontFamily: F.extra, fontSize: 14, color: C.suave, textTransform: 'uppercase', letterSpacing: 0.6 }}>{titulo}</Text>
      <View style={{ backgroundColor: C.blanco, borderRadius: 20, overflow: 'hidden' }}>{children}</View>
    </View>
  );
}

function Item({ texto, icono, detalle, onPress, derecha }: { texto: string; icono: string; detalle?: string; onPress?: () => void; derecha?: React.ReactNode }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: '#EAF2F5' }}>
      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.celeste, alignItems: 'center', justifyContent: 'center' }}>
        <Icono d={icono} tam={20} color={C.marca} />
      </View>
      <Text style={{ flex: 1, fontFamily: F.negrita, fontSize: 16, color: C.texto }}>{texto}</Text>
      {detalle && <Text style={{ fontFamily: F.normal, fontSize: 14, color: C.suave }}>{detalle}</Text>}
      {derecha ?? (onPress && <Icono d={ICONOS.derecha} tam={18} color={C.suave} />)}
    </Pressable>
  );
}

/** Perfil y ajustes: lo usan el paciente (con flecha atrás) y el cuidador (como pestaña). */
export function PerfilVista({ conAtras }: { conAtras?: boolean }) {
  const { usuario, refrescar, salir } = useSesion();
  const [error, setError] = useState<string | null>(null);
  if (!usuario) return null;

  const cambiar = async (datos: Record<string, unknown>) => {
    try {
      await api('/yo', { method: 'PATCH', body: datos });
      await refrescar();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const roles = [usuario.es_paciente && 'Tomo medicamentos', usuario.es_cuidador && 'Cuido a alguien'].filter(Boolean) as string[];
  const h = usuario.horario;
  const tol = usuario.minutos_tolerancia;

  return (
    <View style={{ gap: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        {conAtras && <Atras />}
        <Avatar nombre={usuario.alias} tam={60} fondo={C.alerta} color="#6B3A06" />
        <View style={{ flex: 1, gap: 2 }}>
          <Text numberOfLines={2} style={{ fontFamily: F.extra, fontSize: 22, color: C.texto }}>{usuario.nombre}</Text>
          <Text style={{ fontFamily: F.normal, fontSize: 14, color: C.suave }}>{usuario.email}</Text>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {roles.map((r) => (
              <Text key={r} style={{ fontFamily: F.negrita, fontSize: 12, color: C.marcaOscuro, backgroundColor: C.celeste, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' }}>{r}</Text>
            ))}
          </View>
        </View>
      </View>

      <Grupo titulo="Cuenta">
        <Item texto="Datos personales" icono={ICONOS.perfil} onPress={() => router.push('/datos')} />
        <Item texto="Cambiar contraseña" icono={ICONOS.candado} onPress={() => router.push('/datos')} />
      </Grupo>

      {usuario.es_paciente && (
        <Grupo titulo="Mi rutina">
          <Item texto="Horarios" icono={ICONOS.reloj} detalle={`${h.manana.slice(0, 2)} · ${h.mediodia.slice(0, 2)} · ${h.tarde.slice(0, 2)} · ${h.noche.slice(0, 2)} h`}
            onPress={() => router.push('/pastillero')} />
          <Item texto="Pastillero" icono={ICONOS.pastillero}
            detalle={usuario.pastillero ? `${usuario.pastillero.id} · ${usuario.pastillero.en_linea ? 'en línea' : 'sin conexión'}` : 'Sin vincular'}
            onPress={() => router.push(usuario.pastillero ? '/pastillero' : '/vincular')} />
          <Item texto="Avisar a mi familia tras" icono={ICONOS.campana}
            derecha={
              <Pressable onPress={() => cambiar({ minutos_tolerancia: TOLERANCIAS[(TOLERANCIAS.indexOf(tol) + 1) % TOLERANCIAS.length] })}
                accessibilityRole="button" accessibilityLabel={`Avisar tras ${tol} minutos. Toca para cambiar`}
                style={{ paddingHorizontal: 12, height: 38, borderRadius: 12, backgroundColor: C.celeste, justifyContent: 'center' }}>
                <Text style={{ fontFamily: F.extra, fontSize: 15, color: C.marcaOscuro }}>{tol} min</Text>
              </Pressable>
            } />
        </Grupo>
      )}

      <Grupo titulo="Preferencias">
        <Item texto="Avisos en el celular" icono={ICONOS.campana}
          derecha={<Switch value={usuario.avisos_push} onValueChange={(v) => cambiar({ avisos_push: v })} trackColor={{ true: C.marca, false: C.borde }} thumbColor={C.blanco} />} />
        <Item texto="Avisos por WhatsApp" icono={ICONOS.whatsapp}
          derecha={<Switch value={usuario.avisos_whatsapp} onValueChange={(v) => cambiar({ avisos_whatsapp: v })} trackColor={{ true: C.marca, false: C.borde }} thumbColor={C.blanco} />} />
        {usuario.es_paciente && <Item texto="Cambiar el Wi-Fi del pastillero" icono={ICONOS.wifi} onPress={() => router.push('/vincular')} />}
        {usuario.es_cuidador && <Item texto="Tengo un código de invitación" icono={ICONOS.familia} onPress={() => router.push('/codigo')} />}
      </Grupo>
      <Aviso texto={error} />

      <Pressable onPress={async () => { await salir(); router.replace('/'); }} accessibilityRole="button"
        style={{ flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', minHeight: 54 }}>
        <Icono d={ICONOS.salir} color={C.error} />
        <Text style={{ fontFamily: F.negrita, fontSize: 17, color: C.error }}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}
