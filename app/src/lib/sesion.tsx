import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { api, cargarToken, guardarToken, Usuario } from './api';
import { registrarPush } from './push';

// Lo que se va llenando en "Crea tu rutina" antes de crear la cuenta
export type Borrador = {
  nombre: string;
  apellido: string;
  alias: string;
  celular: string;
  tiene_whatsapp: boolean;
  rol: 'toma' | 'cuida' | 'ambos';
  horario: Record<string, string>;
  medicamento: { nombre: string; dosis: string; franjas: string[] } | null;
};

const BORRADOR_INICIAL: Borrador = {
  nombre: '',
  apellido: '',
  alias: '',
  celular: '',
  tiene_whatsapp: true,
  rol: 'toma',
  horario: { manana: '08:00', mediodia: '13:00', tarde: '18:00', noche: '21:00' },
  medicamento: null,
};

type Sesion = {
  cargando: boolean;
  usuario: Usuario | null;
  borrador: Borrador;
  cambiarBorrador: (cambios: Partial<Borrador>) => void;
  entrar: (token: string, usuario: Usuario) => Promise<void>;
  salir: () => Promise<void>;
  refrescar: () => Promise<void>;
};

const Contexto = createContext<Sesion | null>(null);

export function SesionProvider({ children }: { children: ReactNode }) {
  const [cargando, setCargando] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [borrador, setBorrador] = useState(BORRADOR_INICIAL);

  const refrescar = async () => setUsuario(await api<Usuario>('/yo'));

  useEffect(() => {
    cargarToken()
      .then((t) => (t ? refrescar() : undefined))
      .catch(() => guardarToken(null))
      .finally(() => setCargando(false));
  }, []);

  const entrar = async (token: string, u: Usuario) => {
    await guardarToken(token);
    setUsuario(u);
    setBorrador(BORRADOR_INICIAL);
    registrarPush().catch(() => {}); // sin permiso o en Expo Go: la app funciona igual
  };

  const salir = async () => {
    await api('/logout', { method: 'POST' }).catch(() => {});
    await guardarToken(null);
    setUsuario(null);
  };

  return (
    <Contexto.Provider
      value={{ cargando, usuario, borrador, cambiarBorrador: (c) => setBorrador((b) => ({ ...b, ...c })), entrar, salir, refrescar }}>
      {children}
    </Contexto.Provider>
  );
}

export function useSesion() {
  const s = useContext(Contexto);
  if (!s) throw new Error('useSesion fuera de SesionProvider');
  return s;
}
