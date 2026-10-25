import { Pressable, Text, View } from 'react-native';

import { C, F } from '@/lib/tema';
import { ICONOS, Icono } from './ui';

// Sin librería de reloj: botones grandes de - y + (de 15 en 15 minutos), fáciles para personas mayores
export function SelectorHora({ valor, cambiar, etiqueta }: { valor: string; cambiar: (h: string) => void; etiqueta: string }) {
  const mover = (delta: number) => {
    const [h, m] = valor.split(':').map(Number);
    const total = (h * 60 + m + delta + 24 * 60) % (24 * 60);
    cambiar(`${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`);
  };
  const boton = (delta: number, texto: string) => (
    <Pressable onPress={() => mover(delta)} accessibilityRole="button" accessibilityLabel={`${texto} 15 minutos a ${etiqueta}`}
      style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: C.celeste, alignItems: 'center', justifyContent: 'center' }}>
      <Icono d={delta > 0 ? ICONOS.mas : 'M5 12h14'} color={C.marcaOscuro} grosor={2.6} />
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {boton(-15, 'Quitar')}
      <Text style={{ fontFamily: F.extra, fontSize: 20, color: C.marcaOscuro, minWidth: 62, textAlign: 'center' }} accessibilityLabel={`${etiqueta}: ${valor}`}>
        {valor}
      </Text>
      {boton(15, 'Sumar')}
    </View>
  );
}
