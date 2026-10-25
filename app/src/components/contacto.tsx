import { Linking, Pressable } from 'react-native';

import { C } from '@/lib/tema';
import { ICONOS, Icono } from './ui';

/** Botones de llamar y WhatsApp: abren el teléfono o WhatsApp del celular, sin costo para Memora. */
export function Contacto({ nombre, celular, whatsapp, mensaje }: { nombre: string; celular: string | null; whatsapp: boolean; mensaje?: string }) {
  if (!celular) return null;
  const caja = { width: 46, height: 46, borderRadius: 15, alignItems: 'center' as const, justifyContent: 'center' as const };
  return (
    <>
      <Pressable onPress={() => Linking.openURL(`tel:+51${celular}`)} accessibilityRole="button" accessibilityLabel={`Llamar a ${nombre}`}
        style={[caja, { backgroundColor: C.celeste }]}>
        <Icono d={ICONOS.telefono} tam={20} color={C.marca} />
      </Pressable>
      {whatsapp && (
        <Pressable onPress={() => Linking.openURL(`https://wa.me/51${celular}${mensaje ? `?text=${encodeURIComponent(mensaje)}` : ''}`)}
          accessibilityRole="button" accessibilityLabel={`Escribir a ${nombre} por WhatsApp`} style={[caja, { backgroundColor: C.whatsapp }]}>
          <Icono d={ICONOS.whatsapp} tam={20} color={C.whatsappTexto} />
        </Pressable>
      )}
    </>
  );
}
