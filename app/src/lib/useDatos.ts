import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { api } from './api';

/** Carga una ruta de la API cada vez que la pantalla aparece. `cada` (ms) la vuelve a pedir sola. */
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
      if (!cada) return;
      const t = setInterval(cargar, cada);
      return () => clearInterval(t);
    }, [cargar, cada]),
  );

  return { datos, error, cargar, setDatos };
}
