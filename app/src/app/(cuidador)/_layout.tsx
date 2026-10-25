import { Redirect, Tabs } from 'expo-router';

import { useSesion } from '@/lib/sesion';
import { Barra } from '../(paciente)/_layout';

// Quien solo cuida: Personas · Perfil (sin el botón +)
export default function LayoutCuidador() {
  const { usuario } = useSesion();
  if (!usuario) return <Redirect href="/" />;
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(p) => <Barra {...p} conMas={false} />}>
      <Tabs.Screen name="personas" />
      <Tabs.Screen name="ajustes" />
    </Tabs>
  );
}
