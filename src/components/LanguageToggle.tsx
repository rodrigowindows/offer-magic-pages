import { Globe } from "lucide-react";

interface LanguageToggleProps {
  language: 'en' | 'es';
  onChange: (lang: 'en' | 'es') => void;
}

const LanguageToggle = ({ language, onChange }: LanguageToggleProps) => {
  return (
    <div className="fixed top-4 right-4 z-40">
      <div className="flex items-center gap-2 bg-card/95 backdrop-blur-sm rounded-full px-3 py-2 shadow-md border border-border">
        <Globe className="w-4 h-4 text-muted-foreground" />
        <button
          onClick={() => onChange('en')}
          className={`
            px-2 py-1 rounded-full text-sm font-medium transition-colors
            ${language === 'en' 
              ? 'bg-secondary text-secondary-foreground' 
              : 'text-muted-foreground hover:text-foreground'}
          `}
        >
          EN
        </button>
        <button
          onClick={() => onChange('es')}
          className={`
            px-2 py-1 rounded-full text-sm font-medium transition-colors
            ${language === 'es' 
              ? 'bg-secondary text-secondary-foreground' 
              : 'text-muted-foreground hover:text-foreground'}
          `}
        >
          ES
        </button>
      </div>
    </div>
  );
};

export default LanguageToggle;
