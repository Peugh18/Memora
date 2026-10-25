import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { Boton, Campo, e, Aviso, ICONOS, Icono, Parrafo, Pasos, Pantalla, Titulo } from '@/components/ui';
import { api, Usuario } from '@/lib/api';
import { useSesion } from '@/lib/sesion';
import { C, F } from '@/lib/tema';

export default function Cuenta() {
  const { borrador, entrar } = useSesion();
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [ver, setVer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const crear = async () => {
    setEnviando(true);
    setError(null);
    try {
      const r = await api<{ token: string; usuario: Usuario }>('/registro', {
        method: 'POST',
        body: {
          nombre: borrador.nombre, apellido: borrador.apellido, alias: borrador.alias, email: email.trim(), password: clave, celular: borrador.celular || null,
          tiene_whatsapp: borrador.tiene_whatsapp, rol: borrador.rol, horario: borrador.horario,
          medicamento: borrador.rol !== 'cuida' ? borrador.medicamento : null,
        },
      });
      await entrar(r.token, r.usuario);
      router.replace(borrador.rol === 'cuida' ? '/codigo' : '/vincular');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Pantalla abajo={<View style={{ padding: 20 }}><Boton texto="Crear cuenta" onPress={crear} cargando={enviando} /></View>}>
      <Pasos paso={6} />
      <View style={{ gap: 10, marginTop: 12 }}>
        <Titulo>Guarda tu rutina</Titulo>
        <Parrafo>Con tu cuenta no la pierdes si cambias de celular, y tu familia puede acompañarte.</Parrafo>
      </View>
      <Campo etiqueta="Correo" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="tu@correo.com" />
      <View style={{ gap: 8 }}>
        <Text style={e.etiqueta}>Contraseña</Text>
        <View>
          <TextInput value={clave} onChangeText={setClave} secureTextEntry={!ver} autoComplete="new-password" accessibilityLabel="Contraseña"
            style={[e.campo, { paddingRight: 60 }]} />
          <Pressable onPress={() => setVer(!ver)} accessibilityRole="button" accessibilityLabel={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            style={{ position: 'absolute', right: 6, top: 6, width: 46, height: 46, alignItems: 'center', justifyContent: 'center' }}>
            <Icono d={ICONOS.ojo} color={C.suave} />
          </Pressable>
        </View>
        <Text style={e.ayuda}>Mínimo 8 caracteres.</Text>
      </View>
      <Aviso texto={error} />
      {borrador.rol !== 'cuida' && (
        <Text style={{ fontFamily: F.normal, fontSize: 15, color: C.suave, textAlign: 'center' }}>
          ¿Solo cuidas a alguien? Elige “Cuido a alguien” en el paso anterior.
        </Text>
      )}
    </Pantalla>
  );
}
