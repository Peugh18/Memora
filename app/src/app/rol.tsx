import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Boton, ICONOS, Icono, Parrafo, Pasos, Pantalla, Titulo } from '@/components/ui';
import { Borrador, useSesion } from '@/lib/sesion';
import { C, F } from '@/lib/tema';

const OPCIONES: { id: Borrador['rol']; titulo: string; detalle: string; icono: string }[] = [
  { id: 'toma', titulo: 'Tomo medicamentos', detalle: 'Recibo avisos y confirmo mis tomas.', icono: ICONOS.pastilla },
  { id: 'cuida', titulo: 'Cuido a alguien', detalle: 'Veo si mi familiar tomó su medicación.', icono: ICONOS.familia },
  { id: 'ambos', titulo: 'Las dos cosas', detalle: 'Tengo mi rutina y también cuido a alguien.', icono: ICONOS.personas },
];

export default function Rol() {
  const { borrador, cambiarBorrador } = useSesion();

  // Quien solo cuida no arma rutina: crea su cuenta y luego pone el código de invitación
  const seguir = () => router.push(borrador.rol === 'cuida' ? '/cuenta' : '/horarios');

  return (
    <Pantalla abajo={<View style={{ padding: 20 }}><Boton texto="Continuar" onPress={seguir} /></View>}>
      <Pasos paso={3} />
      <View style={{ gap: 10, marginTop: 12 }}>
        <Titulo>Hola, {borrador.alias}. ¿Cómo usarás Memora?</Titulo>
        <Parrafo>Puedes cambiarlo cuando quieras.</Parrafo>
      </View>
      <View style={{ gap: 12 }} accessibilityRole="radiogroup">
        {OPCIONES.map((o) => {
          const sel = borrador.rol === o.id;
          return (
            <Pressable key={o.id} onPress={() => cambiarBorrador({ rol: o.id })} accessibilityRole="radio" accessibilityState={{ selected: sel }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20, backgroundColor: sel ? C.celeste : C.blanco,
                borderWidth: 2, borderColor: sel ? C.marca : 'transparent', elevation: sel ? 0 : 2 }}>
              <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: sel ? C.marca : C.celeste, alignItems: 'center', justifyContent: 'center' }}>
                <Icono d={o.icono} color={sel ? C.blanco : C.marca} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: F.negrita, fontSize: 18, color: C.texto }}>{o.titulo}</Text>
                <Text style={{ fontFamily: F.normal, fontSize: 15, color: C.suave }}>{o.detalle}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Pantalla>
  );
}
