import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

import { Contacto } from '@/components/contacto';
import { Avatar, Aviso, Boton, ICONOS, Icono, Interruptor, Pantalla, Parrafo, Tarjeta, Titulo } from '@/components/ui';
import { api } from '@/lib/api';
import { useDatos } from '@/lib/useDatos';
import { C, F } from '@/lib/tema';

type Familia = {
  codigo: string;
  cuidadores: { vinculo: number; nombre: string; alias: string; parentesco: string; celular: string | null; tiene_whatsapp: boolean; puede_editar: boolean }[];
};

export default function FamiliaPantalla() {
  const { datos, error, setDatos } = useDatos<Familia>('/familia');
  const [copiado, setCopiado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  if (!datos) return <Pantalla><Titulo chico>Mi familia</Titulo><Aviso texto={error} /></Pantalla>;

  const permiso = async (vinculo: number, puede_editar: boolean) => {
    setDatos({ ...datos, cuidadores: datos.cuidadores.map((c) => (c.vinculo === vinculo ? { ...c, puede_editar } : c)) });
    try {
      await api(`/familia/${vinculo}`, { method: 'PATCH', body: { puede_editar } });
    } catch (err) {
      setAviso((err as Error).message);
    }
  };

  const mensaje = `Te invito a acompañarme en Memora. Mi código: ${datos.codigo}`;

  return (
    <Pantalla>
      <View style={{ gap: 6 }}>
        <Titulo chico>Mi familia</Titulo>
        <Parrafo>Les avisamos si una toma no se confirma a tiempo.</Parrafo>
      </View>

      {datos.cuidadores.length === 0 && (
        <Tarjeta><Text style={{ fontFamily: F.semi, fontSize: 16, color: C.suave }}>Todavía no invitas a nadie. Comparte tu código.</Text></Tarjeta>
      )}
      {datos.cuidadores.map((c) => (
        <Tarjeta key={c.vinculo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar nombre={c.alias} />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ fontFamily: F.negrita, fontSize: 18, color: C.texto }}>{c.alias}</Text>
              <Text style={{ fontFamily: F.normal, fontSize: 14, color: C.suave }}>{[c.parentesco, c.celular].filter(Boolean).join(' · ')}</Text>
            </View>
            <Contacto nombre={c.alias} celular={c.celular} whatsapp={c.tiene_whatsapp} />
          </View>
          <Interruptor texto="Puede editar mis horarios" valor={c.puede_editar} cambiar={(v) => permiso(c.vinculo, v)} />
        </Tarjeta>
      ))}
      <Aviso texto={aviso} />

      <View style={{ borderRadius: 24, padding: 18, backgroundColor: C.marca, gap: 12 }}>
        <Text style={{ fontFamily: F.extra, fontSize: 19, color: C.blanco }}>Invita a un familiar</Text>
        <Text style={{ fontFamily: F.normal, fontSize: 15, color: '#EAF8FB' }}>Comparte este código. Vence en 24 horas.</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 16,
          backgroundColor: 'rgba(255,255,255,.12)', borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,.45)' }}>
          <Text style={{ fontFamily: F.extra, fontSize: 28, letterSpacing: 4, color: C.blanco }} selectable>{datos.codigo}</Text>
          <Pressable onPress={async () => { await Clipboard.setStringAsync(datos.codigo); setCopiado(true); }}
            accessibilityRole="button" accessibilityLabel={copiado ? 'Código copiado' : 'Copiar código'}
            style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: 'rgba(255,255,255,.18)', alignItems: 'center', justifyContent: 'center' }}>
            <Icono d={copiado ? ICONOS.check : ICONOS.copiar} tam={20} color={C.blanco} />
          </Pressable>
        </View>
        {copiado && <Text accessibilityLiveRegion="polite" style={{ fontFamily: F.normal, fontSize: 14, color: '#EAF8FB' }}>Código copiado. Pégalo en un mensaje.</Text>}
        <Boton tipo="blanco" texto="Compartir por WhatsApp" onPress={() => Linking.openURL(`https://wa.me/?text=${encodeURIComponent(mensaje)}`)} />
      </View>
    </Pantalla>
  );
}
