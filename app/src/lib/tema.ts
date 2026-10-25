// Tokens del diseño aprobado (diseno/vistas/*.dc.html). No poner colores sueltos en las pantallas.
export const C = {
  fondo: '#F3FAFC',
  fondoArriba: '#DDF1F7',
  texto: '#0E2733',
  suave: '#4A5F68',
  marca: '#0D7385',
  marcaOscuro: '#0A4A66',
  marcaClaro: '#0E7C8E',
  celeste: '#E0F4F7',
  celesteBorde: '#CDEDF3',
  borde: '#BCD3DA',
  linea: '#D6E5EA',
  blanco: '#FFFFFF',
  alerta: '#FFB547',
  alertaTexto: '#4A2703',
  alertaSuave: '#FDEBD3',
  alertaSuaveTexto: '#7A3E06',
  confirmada: '#0095A8',
  sinConfirmar: '#E08A1E',
  verde: '#D3F5E4',
  verdeTexto: '#0B5A36',
  whatsapp: '#DDF6E6',
  whatsappTexto: '#0E6B37',
  error: '#A32D2D',
};

export const F = {
  normal: 'Onest_400Regular',
  medio: 'Onest_500Medium',
  semi: 'Onest_600SemiBold',
  negrita: 'Onest_700Bold',
  extra: 'Onest_800ExtraBold',
};

export type Franja = 'manana' | 'mediodia' | 'tarde' | 'noche';

// Cada fila del pastillero real tiene su color
export const FRANJAS: { id: Franja; nombre: string; fila: string; fondo: string; tinta: string; icono: string }[] = [
  { id: 'manana', nombre: 'Mañana', fila: 'amarilla', fondo: '#FDF1C7', tinta: '#7A5A00',
    icono: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4' },
  { id: 'mediodia', nombre: 'Mediodía', fila: 'celeste', fondo: '#DCEEFB', tinta: '#1F5F94',
    icono: 'M12 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M5.6 4.6l1.4 1.4M18.4 4.6l-1.4 1.4M3 17h18M7 21h10' },
  { id: 'tarde', nombre: 'Tarde', fila: 'lila', fondo: '#EEE6FB', tinta: '#5B3E9E',
    icono: 'M3 18h18M6 18a6 6 0 0 1 12 0M12 6v3M5.6 10.6l1.8 1.4M18.4 10.6l-1.8 1.4' },
  { id: 'noche', nombre: 'Noche', fila: 'rosa', fondo: '#FCE4EE', tinta: '#9B2C57',
    icono: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z' },
];

export const franja = (id: string) => FRANJAS.find((f) => f.id === id) ?? FRANJAS[0];

export const DIAS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
export const DIAS_LARGOS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
