import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Atras, Aviso, Boton, Campo, Parrafo, Pantalla, Titulo } from '@/components/ui';
import { api } from '@/lib/api';

export default function Olvide() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    setEnviando(true);
    setError(null);
    try {
      await api('/clave/olvido', { method: 'POST', body: { email: email.trim() } });
      setEnviado(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Pantalla>
      <Atras />
      {enviado ? (
        <View style={{ gap: 18 }} accessibilityLiveRegion="polite">
          <Titulo>Revisa tu correo</Titulo>
          <Parrafo>Si tu correo está registrado, te llegará el enlace en unos minutos. Mira también en spam.</Parrafo>
          <Boton texto="Volver a iniciar sesión" onPress={() => router.replace('/login')} />
          <Boton tipo="enlace" texto="Enviar de nuevo" onPress={() => setEnviado(false)} />
        </View>
      ) : (
        <View style={{ gap: 18 }}>
          <Titulo>¿Olvidaste tu contraseña?</Titulo>
          <Parrafo>Escribe tu correo y te enviaremos un enlace para crear una nueva.</Parrafo>
          <Campo etiqueta="Correo" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="tu@correo.com" />
          <Aviso texto={error} />
          <Boton texto="Enviar enlace" onPress={enviar} cargando={enviando} />
        </View>
      )}
    </Pantalla>
  );
}
