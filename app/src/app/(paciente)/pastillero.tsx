import { PastilleroVista } from '@/components/pastillero-vista';
import { Pantalla, Titulo } from '@/components/ui';

export default function Pastillero() {
  return (
    <Pantalla>
      <Titulo chico>Pastillero</Titulo>
      <PastilleroVista paciente="yo" />
    </Pantalla>
  );
}
