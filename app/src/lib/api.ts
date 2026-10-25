import * as SecureStore from 'expo-secure-store';

// En el celular con Expo Go: la IP de la PC en la misma red (ej. http://192.168.1.20:8000). En la APK: el servidor de AWS.
const BASE = (process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.20:8000') + '/api';
const CLAVE_TOKEN = 'memora_token';

let token: string | null = null;

export async function cargarToken() {
  token = await SecureStore.getItemAsync(CLAVE_TOKEN);
  return token;
}

export async function guardarToken(nuevo: string | null) {
  token = nuevo;
  if (nuevo) await SecureStore.setItemAsync(CLAVE_TOKEN, nuevo);
  else await SecureStore.deleteItemAsync(CLAVE_TOKEN);
}

export class ErrorApi extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/** Llama a la API de Laravel. Los errores de validación llegan ya en español: se muestra el primero. */
export async function api<T = any>(ruta: string, opciones: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + ruta, {
      method: opciones.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opciones.body === undefined ? undefined : JSON.stringify(opciones.body),
    });
  } catch {
    throw new ErrorApi('No hay conexión con Memora. Revisa tu internet.', 0);
  }
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) {
    const primero = datos.errors ? (Object.values(datos.errors)[0] as string[])[0] : null;
    throw new ErrorApi(primero ?? datos.message ?? 'Algo salió mal. Inténtalo otra vez.', res.status);
  }
  return datos as T;
}

export type Usuario = {
  id: number;
  nombre: string;
  alias: string;
  email: string;
  celular: string | null;
  tiene_whatsapp: boolean;
  es_paciente: boolean;
  es_cuidador: boolean;
  horario: Record<string, string>;
  minutos_tolerancia: number;
  avisos_push: boolean;
  avisos_whatsapp: boolean;
  pastillero: { id: string; en_linea: boolean; ultima_conexion: string | null } | null;
};

export type Toma = {
  franja: string;
  hora: string;
  estado: 'pendiente' | 'tomada' | 'omitida' | 'sin_medicamentos' | 'por_venir';
  confirmada_en: string | null;
  medicamentos: { id: number; nombre: string; dosis: string | null }[];
};

export type Hoy = {
  fecha: string;
  dia_semana: number;
  nombre: string;
  alias: string;
  pastillero: Usuario['pastillero'];
  tomas: Toma[];
  confirmadas: number;
  total: number;
};

export type Medicamento = { id: number; nombre: string; dosis: string | null; franjas: string[]; dias: number[] };
