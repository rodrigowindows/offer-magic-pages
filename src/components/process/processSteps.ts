import {
  Database,
  BarChart3,
  GitCompareArrows,
  DollarSign,
} from 'lucide-react';

export interface ProcessStep {
  number: 1 | 2 | 3 | 4;
  title: string;
  path: string;
  fullPath: string;
  icon: React.ElementType;
  description: string;
}

export const PROCESS_STEPS: ProcessStep[] = [
  {
    number: 1,
    title: 'Base de Imóveis',
    path: '',
    fullPath: '/process',
    icon: Database,
    description: 'Importar e gerenciar propriedades por base',
  },
  {
    number: 2,
    title: 'Análise',
    path: 'step-2',
    fullPath: '/process/step-2',
    icon: BarChart3,
    description: 'Revisar, aprovar ou negar propriedades',
  },
  {
    number: 3,
    title: 'Comparativos',
    path: 'step-3',
    fullPath: '/process/step-3',
    icon: GitCompareArrows,
    description: 'Inserir comps e calcular preço médio/sqft',
  },
  {
    number: 4,
    title: 'Oferta MAO',
    path: 'step-4',
    fullPath: '/process/step-4',
    icon: DollarSign,
    description: 'Calcular oferta máxima (ARV - Reforma - Comissão)',
  },
];
