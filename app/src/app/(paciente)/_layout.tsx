import type { BottomTabBarProps } from 'expo-router/build/layouts/Tabs';
import { Redirect, router, Tabs } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ICONOS, Icono } from '@/components/ui';
import { useSesion } from '@/lib/sesion';
import { C, F } from '@/lib/tema';

const PESTANAS: Record<string, { texto: string; icono: string }> = {
  hoy: { texto: 'Hoy', icono: ICONOS.hoy },
  historial: { texto: 'Historial', icono: ICONOS.historial },
  pastillero: { texto: 'Pastillero', icono: ICONOS.pastillero },
  familia: { texto: 'Familia', icono: ICONOS.familia },
  personas: { texto: 'Personas', icono: ICONOS.personas },
  ajustes: { texto: 'Perfil', icono: ICONOS.perfil },
};

// Barra del diseño: Hoy · Historial · (+) · Pastillero · Familia
export function Barra({ state, navigateToTab, conMas = true }: BottomTabBarProps & { conMas?: boolean }) {
  const abajo = useSafeAreaInsets().bottom;
  const items = state.routes.map((r, i) => {
    const p = PESTANAS[r.name] ?? { texto: r.name, icono: ICONOS.perfil };
    const activo = state.index === i;
    return (
      <Pressable key={r.key} onPress={() => navigateToTab(r.key)} accessibilityRole="tab" accessibilityState={{ selected: activo }}
        style={{ flex: 1, minHeight: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 3, backgroundColor: activo ? '#E6F6FA' : 'transparent' }}>
        <Icono d={p.icono} color={activo ? C.marca : '#56707A'} />
        <Text style={{ fontFamily: F.semi, fontSize: 13, color: activo ? C.marca : '#56707A' }}>{p.texto}</Text>
      </Pressable>
    );
  });
  if (conMas) {
    items.splice(2, 0, (
      <Pressable key="mas" onPress={() => router.push('/medicamento')} accessibilityRole="button" accessibilityLabel="Agregar medicamento"
        style={{ width: 58, height: 58, borderRadius: 20, backgroundColor: C.marcaOscuro, alignItems: 'center', justifyContent: 'center', marginTop: -34, marginHorizontal: 4, elevation: 6 }}>
        <Icono d={ICONOS.mas} color={C.blanco} tam={26} grosor={2.6} />
      </Pressable>
    ));
  }
  return (
    <View style={{ backgroundColor: C.fondo, paddingBottom: Math.max(abajo, 12), paddingHorizontal: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.blanco, borderRadius: 24, padding: 6, elevation: 8 }}>{items}</View>
    </View>
  );
}

export default function LayoutPaciente() {
  const { usuario } = useSesion();
  if (!usuario) return <Redirect href="/" />;
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(p) => <Barra {...p} />}>
      <Tabs.Screen name="hoy" />
      <Tabs.Screen name="historial" />
      <Tabs.Screen name="pastillero" />
      <Tabs.Screen name="familia" />
    </Tabs>
  );
}
