import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Atras, Aviso, Boton, Campo, Parrafo, Pantalla, Titulo } from '@/components/ui';
import { api, Usuario } from '@/lib/api';
import { useSesion } from '@/lib/sesion';
import { C, F } from '@/lib/tema';

export default function Login() {
  const { entrar } = useSesion();
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const ingresar = async () => {
    setEnviando(true);
    setError(null);
    try {
      const r = await api<{ token: string; usuario: Usuario }>('/login', { method: 'POST', body: { email: email.trim(), password: clave } });
      await entrar(r.token, r.usuario);
      router.replace(r.usuario.es_paciente ? '/hoy' : '/personas');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Pantalla>
      <Atras />
      <View style={{ gap: 10 }}>
        <Titulo>Hola de nuevo</Titulo>
        <Parrafo>Entra para ver tu rutina.</Parrafo>
      </View>
      <Campo etiqueta="Correo" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="tu@correo.com" />
      <Campo etiqueta="Contraseña" value={clave} onChangeText={setClave} secureTextEntry autoComplete="current-password" onSubmitEditing={ingresar} />
      <Boton tipo="enlace" texto="Olvidé mi contraseña" onPress={() => router.push('/olvide')} />
      <Aviso texto={error} />
      <Boton texto="Ingresar" onPress={ingresar} cargando={enviando} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontFamily: F.normal, fontSize: 16, color: C.suave }}>¿Es tu primera vez?</Text>
        <Boton tipo="enlace" texto="Crear mi rutina" onPress={() => router.replace('/nombre')} />
      </View>
    </Pantalla>
  );
}
