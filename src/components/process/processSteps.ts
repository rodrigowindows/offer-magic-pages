import {
  BarChart3,
} from 'lucide-react';

export interface ProcessStep {
  number: 1;
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
];
