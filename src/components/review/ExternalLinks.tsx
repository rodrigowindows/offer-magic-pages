import { MapPin } from 'lucide-react';

interface ExternalLinksProps {
  address: string;
  zillowUrl?: string | null;
}

const LINK_CONFIG = [
  {
    key: 'maps',
    label: 'Mapa',
    icon: <MapPin className="w-2.5 h-2.5" />,
    className: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
    getUrl: (addr: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`,
  },
  {
    key: 'zillow',
    label: 'Zillow',
    className: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    getUrl: (addr: string, zUrl?: string | null) =>
      zUrl || `https://www.zillow.com/homes/${encodeURIComponent(addr)}_rb/`,
  },
  {
    key: 'redfin',
    label: 'Redfin',
    className: 'bg-red-50 text-red-600 hover:bg-red-100',
    getUrl: (addr: string) => `https://www.redfin.com/search#query=${encodeURIComponent(addr)}`,
  },
  {
    key: 'trulia',
    label: 'Trulia',
    className: 'bg-green-50 text-green-700 hover:bg-green-100',
    getUrl: (addr: string) => `https://www.trulia.com/homes/${encodeURIComponent(addr)}`,
  },
  {
    key: 'realtor',
    label: 'Realtor',
    className: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
    getUrl: (addr: string) =>
      `https://www.realtor.com/realestateandhomes-search/${encodeURIComponent(addr.replace(/\s+/g, '-'))}`,
  },
] as const;

export const ExternalLinks = ({ address, zillowUrl }: ExternalLinksProps) => (
  <div className="flex flex-wrap gap-1" data-section="external-links">
    {LINK_CONFIG.map(link => (
      <a
        key={link.key}
        href={link.getUrl(address, link.key === 'zillow' ? zillowUrl : undefined)}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${link.className}`}
      >
        {'icon' in link ? link.icon : null}
        {link.label}
      </a>
    ))}
  </div>
);
