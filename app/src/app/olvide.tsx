import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Atras, Aviso, Boton, Campo, Parrafo, Pantalla, Titulo } from '@/components/ui';
import { api, Usuario } from '@/lib/api';
import { useSesion } from '@/lib/sesion';

export default function Olvide() {
  const { entrar } = useSesion();
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const intentar = async (accion: () => Promise<void>) => {
    setEnviando(true);
    setError(null);
    try {
      await accion();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  const enviar = () => intentar(async () => {
    await api('/clave/olvido', { method: 'POST', body: { email: email.trim() } });
    setEnviado(true);
  });

  const cambiar = () => intentar(async () => {
    const r = await api<{ token: string; usuario: Usuario }>('/clave/restablecer', {
      method: 'POST', body: { email: email.trim(), codigo: codigo.trim(), password: clave },
    });
    await entrar(r.token, r.usuario);
    router.replace(r.usuario.es_paciente ? '/hoy' : '/personas');
  });

  return (
    <Pantalla>
      <Atras />
      {enviado ? (
        <View style={{ gap: 18 }} accessibilityLiveRegion="polite">
          <Titulo>Revisa tu correo</Titulo>
          <Parrafo>Si {email.trim()} está registrado, te llegará un código de 6 números. Vence en 15 minutos. Mira también en spam.</Parrafo>
          <Campo etiqueta="Código" value={codigo} onChangeText={setCodigo} keyboardType="number-pad" maxLength={6} autoComplete="one-time-code" placeholder="123456" />
          <Campo etiqueta="Contraseña nueva" value={clave} onChangeText={setClave} secureTextEntry autoComplete="new-password" placeholder="Mínimo 8 caracteres" />
          <Aviso texto={error} />
          <Boton texto="Guardar y entrar" onPress={cambiar} cargando={enviando} desactivado={codigo.trim().length !== 6 || clave.length < 8} />
          <Boton tipo="enlace" texto="No me llegó, enviar de nuevo" onPress={() => { setEnviado(false); setError(null); }} />
        </View>
      ) : (
        <View style={{ gap: 18 }}>
          <Titulo>¿Olvidaste tu contraseña?</Titulo>
          <Parrafo>Escribe tu correo y te enviaremos un código para crear una nueva.</Parrafo>
          <Campo etiqueta="Correo" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="tu@correo.com" />
          <Aviso texto={error} />
          <Boton texto="Enviar código" onPress={enviar} cargando={enviando} desactivado={!email.includes('@')} />
        </View>
      )}
    </Pantalla>
  );
}
