import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { Text, View } from 'react-native';

import { Boton, Pantalla } from '@/components/ui';
import { useSesion } from '@/lib/sesion';
import { C, F } from '@/lib/tema';

// Bienvenida. Con sesión abierta salta a la pantalla de su rol.
export default function Bienvenida() {
  const { usuario } = useSesion();
  if (usuario) return <Redirect href={usuario.es_paciente ? '/hoy' : '/personas'} />;

  return (
    <Pantalla estilo={{ justifyContent: 'space-between' }}>
      <View style={{ alignItems: 'center', gap: 10, marginTop: 12 }}>
        <Image source={require('@/assets/images/memora-logo.png')} style={{ width: 190, height: 51 }} contentFit="contain" accessibilityLabel="Memora" />
        <Text style={{ fontFamily: F.semi, fontSize: 16, color: C.suave }}>Tus medicamentos, en su momento</Text>
      </View>
      <Image source={require('@/assets/images/bienvenida.png')} style={{ width: '100%', aspectRatio: 1 }} contentFit="contain" />
      <View style={{ gap: 14 }}>
        <Text style={{ fontFamily: F.extra, fontSize: 30, lineHeight: 35, color: C.texto, textAlign: 'center' }}>
          Tu pastillero te avisa.{'\n'}Tu familia está tranquila.
        </Text>
        <Boton texto="Crear mi rutina" onPress={() => router.push('/nombre')} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontFamily: F.normal, fontSize: 16, color: C.suave }}>¿Ya tienes cuenta?</Text>
          <Boton tipo="enlace" texto="Iniciar sesión" onPress={() => router.push('/login')} />
        </View>
      </View>
    </Pantalla>
  );
}
