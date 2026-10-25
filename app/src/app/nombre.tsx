import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Aviso, Boton, Campo, Parrafo, Pasos, Pantalla, Titulo } from '@/components/ui';
import { useSesion } from '@/lib/sesion';

export default function Nombre() {
  const { borrador, cambiarBorrador } = useSesion();
  const [nombre, setNombre] = useState(borrador.nombre);
  const [apellido, setApellido] = useState(borrador.apellido);
  const [alias, setAlias] = useState(borrador.alias);
  const [error, setError] = useState<string | null>(null);
  const primerNombre = nombre.trim().split(/\s+/)[0] ?? '';

  const seguir = () => {
    if (!nombre.trim()) return setError('Escribe tus nombres para seguir.');
    if (!apellido.trim()) return setError('Escribe tus apellidos para seguir.');
    // Sin alias: se usa el primer nombre ("José Miguel" → "José")
    cambiarBorrador({ nombre: nombre.trim(), apellido: apellido.trim(), alias: alias.trim() || primerNombre });
    router.push('/celular');
  };

  return (
    <Pantalla abajo={<View style={{ padding: 20 }}><Boton texto="Continuar" onPress={seguir} /></View>}>
      <Pasos paso={1} />
      <View style={{ gap: 10, marginTop: 12 }}>
        <Titulo>¿Cómo te llamas?</Titulo>
        <Parrafo>Tu familia verá tu nombre completo. Memora te saludará como prefieras.</Parrafo>
      </View>
      <Campo etiqueta="Nombres" value={nombre} onChangeText={(t) => { setNombre(t); setError(null); }}
        autoComplete="given-name" autoCapitalize="words" placeholder="Ej. Rosa María" />
      <Campo etiqueta="Apellidos" value={apellido} onChangeText={(t) => { setApellido(t); setError(null); }}
        autoComplete="family-name" autoCapitalize="words" placeholder="Ej. Guevara Torres" />
      <Campo etiqueta="¿Cómo te llamamos?" value={alias} onChangeText={setAlias} autoCapitalize="words" maxLength={30}
        placeholder={primerNombre || 'Ej. Rosa'} ayuda="Un nombre corto para saludarte. Si lo dejas vacío, usamos tu primer nombre." />
      <Aviso texto={error} />
    </Pantalla>
  );
}
