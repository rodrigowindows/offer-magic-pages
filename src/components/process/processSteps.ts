import {
  BarChart3,
  GitCompareArrows,
  DollarSign,
} from 'lucide-react';

export interface ProcessStep {
  number: 1 | 2 | 3;
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
    description: 'Revisar, aprovar ou negar propriedades',
  },
  {
    number: 2,
    title: 'Comparativos',
    path: 'step-2',
    fullPath: '/process/step-2',
    icon: GitCompareArrows,
    description: 'Inserir comps e calcular preço médio/sqft',
  },
  {
    number: 3,
    title: 'Oferta MAO',
    path: 'step-3',
    fullPath: '/process/step-3',
    icon: DollarSign,
    description: 'Calcular oferta máxima (ARV - Reforma - Comissão)',
  },
];
