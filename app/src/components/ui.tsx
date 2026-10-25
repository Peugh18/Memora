import { router } from 'expo-router';
import { ReactNode } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleProp, StyleSheet,
  Switch, Text, TextInput, TextInputProps, View, ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { C, F, franja } from '@/lib/tema';

export const ICONOS = {
  atras: 'M15 6l-6 6 6 6',
  derecha: 'M9 6l6 6-6 6',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  campana: 'M6 16h12l-1.5-2V10a4.5 4.5 0 0 0-9 0v4z',
  silencio: 'M6 16h12l-1.5-2V10a4.5 4.5 0 0 0-9 0v4zM10 19a2 2 0 0 0 4 0M3 3l18 18',
  mas: 'M12 5v14M5 12h14',
  hoy: 'M3 9a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4zM3 10h18M8 3v4M16 3v4',
  historial: 'M5 20V11M12 20V5M19 20v-6',
  pastillero: 'M6 6h12a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3zM9 6v12M15 6v12M3 12h18',
  familia: 'M9 4.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zM2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M17 6.5a2.5 2.5 0 1 1 0 5M17 14c2.6 0 4.5 1.8 4.5 4.5',
  personas: 'M9 4.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zM2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6',
  perfil: 'M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4 21c0-4 3.6-7 8-7s8 3 8 7',
  telefono: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  whatsapp: 'M3.5 20.5l1.3-4A8.5 8.5 0 1 1 8 19.6zM9 9.5c.3 2 2 3.8 4 4.5l1.2-1.2 2 .9-.4 1.6c-3.2.3-6.9-3-6.9-6.6l1.5-.4.9 2z',
  wifi: 'M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0M12 19h.01',
  copiar: 'M10 8h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zM16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2',
  reloj: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 7v5l3 2',
  ojo: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z',
  salir: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3',
  pastilla: 'M7.6 16.4a3.5 3.5 0 0 1 0-4.9l3.9-3.9a3.5 3.5 0 0 1 4.9 4.9l-3.9 3.9a3.5 3.5 0 0 1-4.9 0zM9.6 9.6l4.8 4.8',
  candado: 'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5z',
};

export function Icono({ d, tam = 22, color = C.texto, grosor = 2 }: { d: string; tam?: number; color?: string; grosor?: number }) {
  return (
    <Svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round">
      <Path d={d} />
    </Svg>
  );
}

/** Fondo de todas las pantallas. Con `fijo`, el contenido no se desplaza (para pantallas con barra inferior). */
export function Pantalla({ children, abajo, estilo }: { children: ReactNode; abajo?: ReactNode; estilo?: StyleProp<ViewStyle> }) {
  return (
    <SafeAreaView style={e.fondo} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[e.contenido, estilo]} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
        {abajo}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function Titulo({ children, chico }: { children: ReactNode; chico?: boolean }) {
  return <Text style={[e.titulo, chico && { fontSize: 28 }]} accessibilityRole="header">{children}</Text>;
}

export function Parrafo({ children, estilo }: { children: ReactNode; estilo?: object }) {
  return <Text style={[e.parrafo, estilo]}>{children}</Text>;
}

export function Atras({ a }: { a?: string }) {
  return (
    <Pressable style={e.atras} accessibilityRole="button" accessibilityLabel="Atrás"
      onPress={() => (a ? router.replace(a as never) : router.canGoBack() ? router.back() : router.replace('/'))}>
      <Icono d={ICONOS.atras} grosor={2.4} />
    </Pressable>
  );
}

/** Flecha atrás + barra de pasos de "Crea tu rutina". */
export function Pasos({ paso, total = 7 }: { paso: number; total?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <Atras />
      <View style={{ flex: 1, flexDirection: 'row', gap: 6 }} accessibilityLabel={`Paso ${paso} de ${total}`}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[e.seg, i < paso && { backgroundColor: C.marca }]} />
        ))}
      </View>
    </View>
  );
}

type BotonProps = { texto: string; onPress: () => void; tipo?: 'principal' | 'claro' | 'enlace' | 'blanco' | 'borde'; cargando?: boolean; icono?: string; desactivado?: boolean };

export function Boton({ texto, onPress, tipo = 'principal', cargando, icono, desactivado }: BotonProps) {
  const color = tipo === 'principal' || tipo === 'borde' ? C.blanco : tipo === 'enlace' ? C.marca : C.marcaOscuro;
  return (
    <Pressable onPress={onPress} disabled={cargando || desactivado} accessibilityRole="button" accessibilityLabel={texto}
      style={({ pressed }) => [e.boton, e[tipo], (pressed || desactivado) && { opacity: 0.75 }]}>
      {cargando ? <ActivityIndicator color={color} /> : (
        <>
          {icono && <Icono d={icono} color={color} grosor={2.6} />}
          <Text style={[e.botonTexto, { color }, tipo === 'enlace' && { fontFamily: F.semi, fontSize: 17 }]}>{texto}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Campo({ etiqueta, ayuda, prefijo, ...props }: TextInputProps & { etiqueta: string; ayuda?: string; prefijo?: string }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={e.etiqueta}>{etiqueta}</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {prefijo && <View style={e.prefijo}><Text style={e.prefijoTexto}>{prefijo}</Text></View>}
        <TextInput placeholderTextColor="#7C9099" accessibilityLabel={etiqueta} style={[e.campo, { flex: 1 }]} {...props} />
      </View>
      {ayuda && <Text style={e.ayuda}>{ayuda}</Text>}
    </View>
  );
}

export function Aviso({ texto }: { texto: string | null }) {
  return texto ? <Text style={e.error} accessibilityRole="alert">{texto}</Text> : null;
}

export function Tarjeta({ children, estilo }: { children: ReactNode; estilo?: StyleProp<ViewStyle> }) {
  return <View style={[e.tarjeta, estilo]}>{children}</View>;
}

export function Interruptor({ texto, valor, cambiar, detalle }: { texto: string; valor: boolean; cambiar: (v: boolean) => void; detalle?: string }) {
  return (
    <Pressable onPress={() => cambiar(!valor)} accessibilityRole="switch" accessibilityState={{ checked: valor }} style={e.interruptor}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.semi, fontSize: 16, color: C.texto }}>{texto}</Text>
        {detalle && <Text style={e.ayuda}>{detalle}</Text>}
      </View>
      <Switch value={valor} onValueChange={cambiar} trackColor={{ true: C.marca, false: C.borde }} thumbColor={C.blanco} />
    </Pressable>
  );
}

export function Chip({ texto, activo, cambiar, icono }: { texto: string; activo: boolean; cambiar: () => void; icono?: string }) {
  return (
    <Pressable onPress={cambiar} accessibilityRole="checkbox" accessibilityState={{ checked: activo }}
      style={[e.chip, activo && { backgroundColor: C.marca, borderColor: C.marca }]}>
      {activo && <Icono d={ICONOS.check} tam={16} color={C.blanco} grosor={3} />}
      {!activo && icono && <Icono d={icono} tam={16} color={C.suave} />}
      <Text style={{ fontFamily: F.semi, fontSize: 16, color: activo ? C.blanco : C.texto }}>{texto}</Text>
    </Pressable>
  );
}

export function Ficha({ id, tam = 42 }: { id: string; tam?: number }) {
  const f = franja(id);
  return (
    <View style={{ width: tam, height: tam, borderRadius: tam * 0.36, backgroundColor: f.fondo, alignItems: 'center', justifyContent: 'center' }}>
      <Icono d={f.icono} color={f.tinta} tam={tam * 0.52} />
    </View>
  );
}

export function Pildora({ texto, fondo, color, icono }: { texto: string; fondo: string; color: string; icono?: string }) {
  return (
    <View style={[e.pildora, { backgroundColor: fondo }]}>
      {icono && <Icono d={icono} tam={14} color={color} grosor={3} />}
      <Text style={{ fontFamily: F.negrita, fontSize: 14, color }}>{texto}</Text>
    </View>
  );
}

export function Avatar({ nombre, tam = 48, fondo = '#DCE4F5', color = '#2D3F80' }: { nombre: string; tam?: number; fondo?: string; color?: string }) {
  return (
    <View style={{ width: tam, height: tam, borderRadius: tam / 3, backgroundColor: fondo, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: F.extra, fontSize: tam * 0.4, color }}>{nombre.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

export function Cargando() {
  return <View style={[e.fondo, { alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator size="large" color={C.marca} /></View>;
}

export const e = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: C.fondo },
  contenido: { padding: 20, paddingBottom: 28, gap: 18, flexGrow: 1 },
  titulo: { fontFamily: F.extra, fontSize: 32, lineHeight: 36, letterSpacing: -0.8, color: C.texto },
  parrafo: { fontFamily: F.normal, fontSize: 17, lineHeight: 25, color: C.suave },
  atras: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.blanco, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  seg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: C.linea },
  boton: { minHeight: 58, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 16 },
  principal: { backgroundColor: C.marca, elevation: 4 },
  claro: { backgroundColor: C.celeste },
  blanco: { backgroundColor: C.blanco, elevation: 4 },
  borde: { borderWidth: 2, borderColor: 'rgba(255,255,255,.55)', minHeight: 50 },
  enlace: { minHeight: 48 },
  botonTexto: { fontFamily: F.negrita, fontSize: 18 },
  etiqueta: { fontFamily: F.semi, fontSize: 16, color: C.suave },
  campo: { fontFamily: F.medio, fontSize: 19, height: 58, paddingHorizontal: 18, borderWidth: 1.5, borderColor: C.borde, borderRadius: 16, backgroundColor: C.blanco, color: C.texto },
  prefijo: { height: 58, paddingHorizontal: 14, borderRadius: 16, backgroundColor: C.celeste, justifyContent: 'center' },
  prefijoTexto: { fontFamily: F.negrita, fontSize: 18, color: C.marcaOscuro },
  ayuda: { fontFamily: F.normal, fontSize: 14, color: C.suave },
  error: { fontFamily: F.semi, fontSize: 15, color: C.error, backgroundColor: '#FCEBEB', padding: 12, borderRadius: 12 },
  tarjeta: { backgroundColor: C.blanco, borderRadius: 22, padding: 16, gap: 12, elevation: 2 },
  interruptor: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 14, backgroundColor: C.fondo, borderRadius: 14 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 48, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1.5, borderColor: C.borde, backgroundColor: C.blanco },
  pildora: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, paddingHorizontal: 11, borderRadius: 999 },
});
