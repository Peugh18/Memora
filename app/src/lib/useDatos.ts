import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { AppState } from 'react-native';

import { api } from './api';

/**
 * Carga una ruta de la API cuando la pantalla aparece y cuando la app vuelve del fondo.
 * `cada` (ms) la vuelve a pedir sola mientras la pantalla está a la vista.
 * ponytail: consulta periódica en vez de websockets; 5 s alcanza para ver el botón del pastillero casi al instante.
 */
export function useDatos<T>(ruta: string, cada?: number) {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setDatos(await api<T>(ruta));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [ruta]);

  useFocusEffect(
    useCallback(() => {
      cargar();
      const alVolver = AppState.addEventListener('change', (estado) => estado === 'active' && cargar());
      const t = cada ? setInterval(cargar, cada) : undefined;
      return () => {
        alVolver.remove();
        if (t) clearInterval(t);
      };
    }, [cargar, cada]),
  );

  return { datos, error, cargar, setDatos };
}
