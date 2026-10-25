import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Atras, Aviso, Boton, Campo, e, Parrafo, Pantalla, Titulo } from '@/components/ui';
import { api } from '@/lib/api';
import { useSesion } from '@/lib/sesion';
import { C, F } from '@/lib/tema';

const PARENTESCOS = ['Mamá', 'Papá', 'Abuela o abuelo', 'Hija o hijo', 'Pareja', 'Paciente', 'Otro'];

export default function Codigo() {
  const { refrescar } = useSesion();
  const [codigo, setCodigo] = useState('');
  const [parentesco, setParentesco] = useState('Mamá');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const unirme = async () => {
    setEnviando(true);
    setError(null);
    try {
      await api('/invitaciones', { method: 'POST', body: { codigo: codigo.trim().toUpperCase(), parentesco } });
      await refrescar();
      router.replace('/personas');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Pantalla abajo={<View style={{ padding: 20 }}><Boton texto="Unirme" onPress={unirme} cargando={enviando} desactivado={codigo.trim().length < 7} /></View>}>
      <Atras />
      <View style={{ gap: 10 }}>
        <Titulo>Ingresa el código de invitación</Titulo>
        <Parrafo>Pídeselo a la persona que vas a cuidar. Lo encuentra en Mi familia.</Parrafo>
      </View>
      <Campo etiqueta="Código" value={codigo} onChangeText={setCodigo} autoCapitalize="characters" maxLength={7} placeholder="K7P-42Q"
        style={[e.campo, { fontFamily: F.extra, fontSize: 26, letterSpacing: 4, textAlign: 'center' }]} />
      <View style={{ gap: 10 }}>
        <Text style={e.etiqueta}>¿Qué es de ti?</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} accessibilityRole="radiogroup">
          {PARENTESCOS.map((p) => (
            <Pressable key={p} onPress={() => setParentesco(p)} accessibilityRole="radio" accessibilityState={{ selected: parentesco === p }}
              style={[e.chip, parentesco === p && { backgroundColor: C.marca, borderColor: C.marca }]}>
              <Text style={{ fontFamily: F.semi, fontSize: 16, color: parentesco === p ? C.blanco : C.texto }}>{p}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <Aviso texto={error} />
    </Pantalla>
  );
}
