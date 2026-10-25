import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Atras, Aviso, Boton, Campo, Parrafo, Pantalla, Tarjeta, Titulo } from '@/components/ui';
import { api } from '@/lib/api';
import { useSesion } from '@/lib/sesion';
import { C, F } from '@/lib/tema';

/** "memora://vincular?d=MEM-0001&c=K7Q9PX" (QR) o "MEM-0001-K7Q9PX" (escrito bajo el QR). */
function codigoDe(texto: string) {
  const d = texto.match(/[?&]d=([^&]+)/)?.[1];
  const c = texto.match(/[?&]c=([^&]+)/)?.[1];
  return d && c ? `${d}-${c}` : texto.trim();
}

const PASOS_WIFI = [
  'Conéctate a la red Memora-MEM-0001',
  'Elige tu Wi-Fi de 2,4 GHz y escribe la clave',
  'Listo cuando la luz verde quede fija. ¿Ya tenía otro Wi-Fi? Mantén su botón 10 segundos.',
];

export default function Vincular() {
  const { refrescar, usuario } = useSesion();
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [manual, setManual] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const leido = useRef(false);
  const vinculado = !!usuario?.pastillero;

  const vincular = async (texto: string) => {
    setEnviando(true);
    setError(null);
    try {
      await api('/pastillero/vincular', { method: 'POST', body: { codigo: codigoDe(texto) } });
      await refrescar();
    } catch (err) {
      setError((err as Error).message);
      leido.current = false;
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Pantalla abajo={
      <View style={{ padding: 20, gap: 4 }}>
        <Boton texto={vinculado ? 'Ya lo conecté' : 'Vincular'} cargando={enviando}
          onPress={() => (vinculado ? router.replace('/listo') : vincular(codigo))} desactivado={!vinculado && !codigo} />
        <Boton tipo="enlace" texto="Lo haré después" onPress={() => router.replace('/listo')} />
      </View>
    }>
      <Atras />
      <View style={{ gap: 10 }}>
        <Titulo>Conecta tu pastillero</Titulo>
        <Parrafo>{vinculado ? `Pastillero ${usuario!.pastillero!.id} vinculado. Ahora dale tu Wi-Fi.` : 'Escanea el QR pegado dentro de la tapa de tu pastillero.'}</Parrafo>
      </View>

      {!vinculado && !manual && (
        <View style={{ height: 240, borderRadius: 22, overflow: 'hidden', backgroundColor: C.marcaOscuro, alignItems: 'center', justifyContent: 'center' }}>
          {permiso?.granted ? (
            <CameraView style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={({ data }) => {
                if (leido.current || !data.startsWith('memora://')) return;
                leido.current = true;
                vincular(data);
              }} />
          ) : (
            <View style={{ padding: 20, gap: 12 }}>
              <Text style={{ fontFamily: F.semi, fontSize: 16, color: C.blanco, textAlign: 'center' }}>Memora necesita la cámara para leer el QR.</Text>
              <Boton tipo="blanco" texto="Permitir la cámara" onPress={pedirPermiso} />
            </View>
          )}
          {enviando && <ActivityIndicator size="large" color={C.blanco} />}
        </View>
      )}
      {!vinculado && manual && (
        <Campo etiqueta="Código del pastillero" value={codigo} onChangeText={setCodigo} autoCapitalize="characters"
          placeholder="MEM-0001-K7Q9PX" ayuda="Está escrito debajo del QR." />
      )}
      {!vinculado && <Boton tipo="claro" texto={manual ? 'Usar la cámara' : 'Escribir el código a mano'} onPress={() => setManual(!manual)} />}
      <Aviso texto={error} />

      <Tarjeta>
        <Text style={{ fontFamily: F.negrita, fontSize: 17, color: C.texto }}>Después, dale tu Wi-Fi</Text>
        {PASOS_WIFI.map((p, i) => (
          <View key={p} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: C.celeste, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: F.extra, color: C.marca }}>{i + 1}</Text>
            </View>
            <Text style={{ flex: 1, fontFamily: F.normal, fontSize: 16, lineHeight: 22, color: C.texto }}>{p}</Text>
          </View>
        ))}
      </Tarjeta>
    </Pantalla>
  );
}
