import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { PastilleroVista } from '@/components/pastillero-vista';
import { Atras, Pantalla, Titulo } from '@/components/ui';

// Solo se llega aquí si el paciente dio el permiso de editar (el servidor igual lo vuelve a revisar)
export default function PersonaHorario() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Pantalla>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Atras />
        <Titulo chico>Sus horarios</Titulo>
      </View>
      <PastilleroVista paciente={id} />
    </Pantalla>
  );
}
