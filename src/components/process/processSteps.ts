import {
  Upload,
  BarChart3,
  Phone,
  Home,
  DollarSign,
  MessageSquare,
  ShieldCheck,
  Mail,
} from 'lucide-react';

export interface ProcessStep {
  number: number;
  title: string;
  path: string;
  fullPath: string;
  icon: React.ElementType;
  description: string;
}

export const PROCESS_STEPS: ProcessStep[] = [
  {
    number: 1,
    title: 'Base',
    path: 'import',
    fullPath: '/process/import',
    icon: Upload,
    description: 'Importar base de imóveis via CSV',
  },
  {
    number: 2,
    title: 'Análise',
    path: '',
    fullPath: '/process',
    icon: BarChart3,
    description: 'Revisar, aprovar ou negar propriedades',
  },
  {
    number: 3,
    title: 'Endereços',
    path: 'mailing',
    fullPath: '/process/mailing',
    icon: Mail,
    description: 'Upload em massa de mailing addresses (CSV)',
  },
  {
    number: 4,
    title: 'Contatos',
    path: 'contacts',
    fullPath: '/process/contacts',
    icon: Phone,
    description: 'Skip trace e dados de contato',
  },
  {
    number: 5,
    title: 'Comps',
    path: 'comps',
    fullPath: '/process/comps',
    icon: Home,
    description: 'Comparativos de mercado',
  },
  {
    number: 6,
    title: 'Oferta',
    path: 'mao',
    fullPath: '/process/mao',
    icon: DollarSign,
    description: 'Calcular oferta máxima (MAO)',
  },
  {
    number: 7,
    title: 'Respostas',
    path: 'responses',
    fullPath: '/process/responses',
    icon: MessageSquare,
    description: 'Dashboard de respostas e engajamento',
  },
  {
    number: 8,
    title: 'Qualidade',
    path: 'quality',
    fullPath: '/process/quality',
    icon: ShieldCheck,
    description: 'Monitorar qualidade dos dados e decisões',
  },
];
