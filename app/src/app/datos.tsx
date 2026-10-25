import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Atras, Aviso, Boton, Campo, Interruptor, Pantalla, Titulo } from '@/components/ui';
import { api } from '@/lib/api';
import { useSesion } from '@/lib/sesion';
import { C, F } from '@/lib/tema';

export default function Datos() {
  const { usuario, refrescar } = useSesion();
  const [nombre, setNombre] = useState(usuario?.nombre ?? '');
  const [alias, setAlias] = useState(usuario?.alias ?? '');
  const [celular, setCelular] = useState(usuario?.celular ?? '');
  const [whatsapp, setWhatsapp] = useState(usuario?.tiene_whatsapp ?? true);
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const guardar = async () => {
    setEnviando(true);
    setError(null);
    try {
      await api('/yo', { method: 'PATCH', body: { nombre, alias, celular: celular.replace(/\D/g, '') || null, tiene_whatsapp: whatsapp, email } });
      if (nueva) await api('/yo/clave', { method: 'PUT', body: { actual, nueva } });
      await refrescar();
      router.back();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Pantalla abajo={<View style={{ padding: 20 }}><Boton texto="Guardar cambios" onPress={guardar} cargando={enviando} /></View>}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Atras />
        <Titulo chico>Datos personales</Titulo>
      </View>
      <Campo etiqueta="Nombres y apellidos" value={nombre} onChangeText={setNombre} autoComplete="name" />
      <Campo etiqueta="¿Cómo te llamamos?" value={alias} onChangeText={setAlias} maxLength={30} ayuda="Así te saluda Memora y te ve tu familia." />
      <Campo etiqueta="Celular" prefijo="+51" value={celular} onChangeText={setCelular} keyboardType="phone-pad" maxLength={11}
        ayuda="Tu familia lo ve para llamarte o escribirte." />
      <Interruptor texto="Este número tiene WhatsApp" valor={whatsapp} cambiar={setWhatsapp} />
      <Campo etiqueta="Correo" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <Text style={{ fontFamily: F.extra, fontSize: 19, color: C.texto, marginTop: 8 }}>Cambiar contraseña</Text>
      <Campo etiqueta="Contraseña actual" value={actual} onChangeText={setActual} secureTextEntry autoComplete="current-password" />
      <Campo etiqueta="Nueva contraseña" value={nueva} onChangeText={setNueva} secureTextEntry autoComplete="new-password" ayuda="Mínimo 8 caracteres. Déjala vacía si no la cambias." />
      <Aviso texto={error} />
    </Pantalla>
  );
}
