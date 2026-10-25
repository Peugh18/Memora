import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Boton, Campo, Aviso, ICONOS, Icono, Interruptor, Parrafo, Pasos, Pantalla, Titulo } from '@/components/ui';
import { useSesion } from '@/lib/sesion';
import { C, F } from '@/lib/tema';

export default function Celular() {
  const { borrador, cambiarBorrador } = useSesion();
  const [celular, setCelular] = useState(borrador.celular);
  const [whatsapp, setWhatsapp] = useState(borrador.tiene_whatsapp);
  const [error, setError] = useState<string | null>(null);

  const seguir = () => {
    const limpio = celular.replace(/\D/g, '');
    if (limpio.length !== 9) return setError('El celular debe tener 9 dígitos.');
    cambiarBorrador({ celular: limpio, tiene_whatsapp: whatsapp });
    router.push('/rol');
  };

  return (
    <Pantalla abajo={<View style={{ padding: 20 }}><Boton texto="Continuar" onPress={seguir} /></View>}>
      <Pasos paso={2} />
      <View style={{ gap: 10, marginTop: 12 }}>
        <Titulo>¿A qué número te pueden contactar?</Titulo>
        <Parrafo>Tu familia podrá llamarte o escribirte por WhatsApp desde Memora.</Parrafo>
      </View>
      <Campo etiqueta="Tu celular" prefijo="+51" value={celular} onChangeText={(t) => { setCelular(t); setError(null); }}
        keyboardType="phone-pad" autoComplete="tel" placeholder="987 654 321" maxLength={11} />
      <Interruptor texto="Este número tiene WhatsApp" detalle="Para que te escriban con un toque" valor={whatsapp} cambiar={setWhatsapp} />
      <Aviso texto={error} />
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Icono d={ICONOS.candado} tam={18} color={C.suave} />
        <Text style={{ fontFamily: F.normal, fontSize: 15, color: C.suave }}>Solo lo ven las personas que tú invites.</Text>
      </View>
    </Pantalla>
  );
}
