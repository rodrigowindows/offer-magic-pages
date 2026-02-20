import {
  BarChart3,
  DollarSign,
} from 'lucide-react';

export interface ProcessStep {
  number: 1 | 2;
  title: string;
  path: string;
  fullPath: string;
  icon: React.ElementType;
  description: string;
}

export const PROCESS_STEPS: ProcessStep[] = [
  {
    number: 1,
    title: 'Análise',
    path: '',
    fullPath: '/process',
    icon: BarChart3,
    description: 'Revisar, aprovar (com comps) ou negar propriedades',
  },
  {
    number: 2,
    title: 'Oferta MAO',
    path: 'step-2',
    fullPath: '/process/step-2',
    icon: DollarSign,
    description: 'Calcular oferta máxima (ARV - Reforma - Comissão)',
  },
];
