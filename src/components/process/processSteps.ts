import {
  Database,
  BarChart3,
  Users,
  GitCompareArrows,
  DollarSign,
} from 'lucide-react';

export interface ProcessStep {
  number: 1 | 2 | 3 | 4 | 5;
  title: string;
  path: string;
  fullPath: string;
  icon: React.ElementType;
  description: string;
  futureComponent: string;
}

export const PROCESS_STEPS: ProcessStep[] = [
  {
    number: 1,
    title: 'Base de Imóveis',
    path: '',
    fullPath: '/process',
    icon: Database,
    description: 'Importar e gerenciar propriedades',
    futureComponent: 'ImportProperties / CSVImporter',
  },
  {
    number: 2,
    title: 'Análise',
    path: 'step-2',
    fullPath: '/process/step-2',
    icon: BarChart3,
    description: 'Revisar e aprovar propriedades',
    futureComponent: 'ReviewQueue / AdminPropertyTable',
  },
  {
    number: 3,
    title: 'Contatos',
    path: 'step-3',
    fullPath: '/process/step-3',
    icon: Users,
    description: 'Skip trace e dados de contato',
    futureComponent: 'SkipTracingImporter / ApprovedPropertiesExport',
  },
  {
    number: 4,
    title: 'Comparativos',
    path: 'step-4',
    fullPath: '/process/step-4',
    icon: GitCompareArrows,
    description: 'Buscar e analisar comps',
    futureComponent: 'CompsAnalysis / ManualCompsManager',
  },
  {
    number: 5,
    title: 'Oferta',
    path: 'step-5',
    fullPath: '/process/step-5',
    icon: DollarSign,
    description: 'Gerar e enviar ofertas',
    futureComponent: 'PropertyOfferDemo / OfferCalculator',
  },
];
