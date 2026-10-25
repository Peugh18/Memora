import {
  Onest_400Regular, Onest_500Medium, Onest_600SemiBold, Onest_700Bold, Onest_800ExtraBold, useFonts,
} from '@expo-google-fonts/onest';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { SesionProvider, useSesion } from '@/lib/sesion';

SplashScreen.preventAutoHideAsync();

function Rutas() {
  const { cargando } = useSesion();
  const [fuentes] = useFonts({ Onest_400Regular, Onest_500Medium, Onest_600SemiBold, Onest_700Bold, Onest_800ExtraBold });
  const listo = fuentes && !cargando;

  useEffect(() => {
    if (listo) SplashScreen.hideAsync();
  }, [listo]);

  if (!listo) return null;
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <SesionProvider>
      <Rutas />
    </SesionProvider>
  );
}
