import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, X, MapPin, User, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface SearchSuggestion {
  type: 'address' | 'city' | 'owner' | 'zip';
  value: string;
  icon: typeof MapPin;
}

interface SmartPropertySearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  suggestions?: SearchSuggestion[];
  placeholder?: string;
}

export const SmartPropertySearch = ({
  value,
  onChange,
  onSearch,
  suggestions = [],
  placeholder = "Search by address, city, owner, or ZIP code...",
}: SmartPropertySearchProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<SearchSuggestion[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value.trim().length > 1) {
      const filtered = suggestions.filter(s =>
        s.value.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered.slice(0, 8)); // Limit to 8 suggestions
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [value, suggestions]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    onChange(suggestion.value);
    setShowSuggestions(false);
    onSearch();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'address': return MapPin;
      case 'city': return MapPin;
      case 'owner': return User;
      case 'zip': return Hash;
      default: return Search;
    }
  };

  const clearSearch = () => {
    onChange('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (value.trim().length > 1 && filteredSuggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className="pl-10 pr-10 h-11 text-base border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4 text-gray-400" />
          </Button>
        )}
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
          <Command className="rounded-lg border-0">
            <CommandList>
              <CommandEmpty className="py-6 text-center text-sm text-gray-500">
                No suggestions found
              </CommandEmpty>
              <CommandGroup heading="Suggestions" className="p-2">
                {filteredSuggestions.map((suggestion, index) => {
                  const Icon = getIcon(suggestion.type);
                  return (
                    <CommandItem
                      key={`${suggestion.type}-${index}`}
                      value={suggestion.value}
                      onSelect={() => handleSelectSuggestion(suggestion)}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                        <Icon className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {suggestion.value}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {suggestion.type}
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
};
