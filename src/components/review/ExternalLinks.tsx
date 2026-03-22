import { MapPin } from 'lucide-react';

interface ExternalLinksProps {
  address: string;
  zillowUrl?: string | null;
  /** Compact mode: show only small icon-like pills inline (for use next to address) */
  compact?: boolean;
}

const LINK_CONFIG = [
  {
    key: 'maps',
    label: 'Mapa',
    shortLabel: 'M',
    icon: <MapPin className="w-2.5 h-2.5" />,
    className: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
    getUrl: (addr: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`,
  },
  {
    key: 'zillow',
    label: 'Zillow',
    shortLabel: 'Z',
    className: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    getUrl: (addr: string, zUrl?: string | null) =>
      zUrl || `https://www.zillow.com/homes/${encodeURIComponent(addr)}_rb/`,
  },
  {
    key: 'redfin',
    label: 'Redfin',
    shortLabel: 'R',
    className: 'bg-red-50 text-red-600 hover:bg-red-100',
    getUrl: (addr: string) => `https://www.redfin.com/search#query=${encodeURIComponent(addr)}`,
  },
  {
    key: 'trulia',
    label: 'Trulia',
    shortLabel: 'T',
    className: 'bg-green-50 text-green-700 hover:bg-green-100',
    getUrl: (addr: string) => `https://www.trulia.com/homes/${encodeURIComponent(addr)}`,
  },
  {
    key: 'realtor',
    label: 'Realtor',
    shortLabel: 'Rl',
    className: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
    getUrl: (addr: string) =>
      `https://www.realtor.com/realestateandhomes-search/${encodeURIComponent(addr.replace(/\s+/g, '-'))}`,
  },
] as const;

export const ExternalLinks = ({ address, zillowUrl, compact }: ExternalLinksProps) => (
  <div className={`flex flex-wrap gap-1 ${compact ? 'items-center' : ''}`} data-section="external-links">
    {LINK_CONFIG.map(link => (
      <a
        key={link.key}
        href={link.getUrl(address, link.key === 'zillow' ? zillowUrl : undefined)}
        target="_blank"
        rel="noopener noreferrer"
        title={link.label}
        className={`inline-flex items-center gap-0.5 rounded-full font-semibold ${link.className} ${
          compact
            ? 'px-1.5 py-0 text-[9px] leading-4'
            : 'px-1.5 py-0.5 text-[10px]'
        }`}
      >
        {!compact && 'icon' in link ? link.icon : null}
        {compact ? link.shortLabel : link.label}
      </a>
    ))}
  </div>
);
