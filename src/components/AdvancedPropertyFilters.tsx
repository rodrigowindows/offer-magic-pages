import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Filter, X, CalendarIcon, MapPin, Home, Bed, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export interface PropertyFilters {
  city?: string[];
  county?: string[];
  propertyType?: string[];
  importBatch?: string[];
  importDateFrom?: Date;
  importDateTo?: Date;
  priceMin?: number;
  priceMax?: number;
  airbnbEligible?: boolean;
  bedrooms?: number;
  bathrooms?: number;
  hasImage?: boolean;
}

interface AdvancedPropertyFiltersProps {
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
}

export const AdvancedPropertyFilters = ({
  filters,
  onFiltersChange,
}: AdvancedPropertyFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableCounties, setAvailableCounties] = useState<string[]>([]);
  const [availableBatches, setAvailableBatches] = useState<string[]>([]);
  const [localFilters, setLocalFilters] = useState<PropertyFilters>(filters);

  // Load available filter options from database
  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    // Get unique cities
    const { data: cities } = await supabase
      .from("properties")
      .select("city")
      .not("city", "is", null);
    if (cities) {
      const uniqueCities = [...new Set(cities.map((p: any) => p.city))].sort();
      setAvailableCities(uniqueCities);
    }

    // Get unique counties
    const { data: counties } = await supabase
      .from("properties")
      .select("county")
      .not("county", "is", null);
    if (counties) {
      const uniqueCounties = [...new Set(counties.map((p: any) => p.county))].sort();
      setAvailableCounties(uniqueCounties);
    }

    // Get unique import batches
    const { data: batches } = await supabase
      .from("properties")
      .select("import_batch")
      .not("import_batch", "is", null);
    if (batches) {
      const uniqueBatches = [...new Set(batches.map((p: any) => p.import_batch))].sort();
      setAvailableBatches(uniqueBatches);
    }
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const clearAllFilters = () => {
    setLocalFilters({});
    onFiltersChange({});
  };

  const toggleArrayFilter = (key: keyof PropertyFilters, value: string) => {
    const currentArray = (localFilters[key] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((v) => v !== value)
      : [...currentArray, value];

    setLocalFilters({
      ...localFilters,
      [key]: newArray.length > 0 ? newArray : undefined,
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.city?.length) count++;
    if (filters.county?.length) count++;
    if (filters.propertyType?.length) count++;
    if (filters.importBatch?.length) count++;
    if (filters.importDateFrom || filters.importDateTo) count++;
    if (filters.priceMin || filters.priceMax) count++;
    if (filters.airbnbEligible !== undefined) count++;
    if (filters.bedrooms) count++;
    if (filters.bathrooms) count++;
    if (filters.hasImage !== undefined) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="flex items-center gap-2">
      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.city?.map((city) => (
            <Badge key={city} variant="secondary">
              <MapPin className="h-3 w-3 mr-1" />
              {city}
              <button
                onClick={() => toggleArrayFilter("city", city)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {filters.county?.map((county) => (
            <Badge key={county} variant="secondary">
              📍 {county}
              <button
                onClick={() => toggleArrayFilter("county", county)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {filters.propertyType?.map((type) => (
            <Badge key={type} variant="secondary">
              <Home className="h-3 w-3 mr-1" />
              {type}
              <button
                onClick={() => toggleArrayFilter("propertyType", type)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {filters.importBatch?.map((batch) => (
            <Badge key={batch} variant="secondary">
              📦 {batch}
              <button
                onClick={() => toggleArrayFilter("importBatch", batch)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {(filters.importDateFrom || filters.importDateTo) && (
            <Badge variant="secondary">
              📅 {filters.importDateFrom && format(filters.importDateFrom, "MM/dd/yy")}
              {filters.importDateFrom && filters.importDateTo && " - "}
              {filters.importDateTo && format(filters.importDateTo, "MM/dd/yy")}
            </Badge>
          )}

          {(filters.priceMin || filters.priceMax) && (
            <Badge variant="secondary">
              <DollarSign className="h-3 w-3 mr-1" />
              {filters.priceMin ? `$${filters.priceMin.toLocaleString()}` : "0"} -
              {filters.priceMax ? `$${filters.priceMax.toLocaleString()}` : "∞"}
            </Badge>
          )}

          {filters.airbnbEligible && (
            <Badge variant="secondary">
              🏠 Airbnb Eligible
            </Badge>
          )}

          {filters.bedrooms && (
            <Badge variant="secondary">
              <Bed className="h-3 w-3 mr-1" />
              {filters.bedrooms}+ beds
            </Badge>
          )}

          {filters.hasImage && (
            <Badge variant="secondary">
              📸 Com Foto
            </Badge>
          )}

          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-6">
            Limpar Tudo
          </Button>
        </div>
      )}

      {/* Filter Button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros Avançados
            {activeFiltersCount > 0 && (
              <Badge variant="default" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96" align="end">
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            <div>
              <h4 className="font-medium text-sm mb-2">Filtros Avançados</h4>
            </div>

            {/* City Filter */}
            <div>
              <Label className="text-sm font-medium">Cidade:</Label>
              <div className="mt-2 max-h-32 overflow-y-auto space-y-2">
                {availableCities.map((city) => (
                  <div key={city} className="flex items-center space-x-2">
                    <Checkbox
                      id={`city-${city}`}
                      checked={localFilters.city?.includes(city)}
                      onCheckedChange={() => toggleArrayFilter("city", city)}
                    />
                    <Label htmlFor={`city-${city}`} className="text-sm cursor-pointer">
                      {city}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* County Filter */}
            {availableCounties.length > 0 && (
              <div>
                <Label className="text-sm font-medium">County:</Label>
                <div className="mt-2 max-h-32 overflow-y-auto space-y-2">
                  {availableCounties.map((county) => (
                    <div key={county} className="flex items-center space-x-2">
                      <Checkbox
                        id={`county-${county}`}
                        checked={localFilters.county?.includes(county)}
                        onCheckedChange={() => toggleArrayFilter("county", county)}
                      />
                      <Label htmlFor={`county-${county}`} className="text-sm cursor-pointer">
                        {county}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Property Type */}
            <div>
              <Label className="text-sm font-medium">Tipo de Propriedade:</Label>
              <div className="mt-2 space-y-2">
                {["Single Family", "Condo", "Townhouse", "Multi-Family", "Land"].map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={localFilters.propertyType?.includes(type)}
                      onCheckedChange={() => toggleArrayFilter("propertyType", type)}
                    />
                    <Label htmlFor={`type-${type}`} className="text-sm cursor-pointer">
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Import Batch */}
            {availableBatches.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Lote de Importação:</Label>
                <div className="mt-2 max-h-32 overflow-y-auto space-y-2">
                  {availableBatches.map((batch) => (
                    <div key={batch} className="flex items-center space-x-2">
                      <Checkbox
                        id={`batch-${batch}`}
                        checked={localFilters.importBatch?.includes(batch)}
                        onCheckedChange={() => toggleArrayFilter("importBatch", batch)}
                      />
                      <Label htmlFor={`batch-${batch}`} className="text-sm cursor-pointer">
                        {batch}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Date Range */}
            <div>
              <Label className="text-sm font-medium">Data de Importação:</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <Label className="text-xs">De:</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.importDateFrom ? format(localFilters.importDateFrom, "MM/dd/yy") : "Início"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={localFilters.importDateFrom}
                        onSelect={(date) => setLocalFilters({ ...localFilters, importDateFrom: date })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-xs">Até:</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.importDateTo ? format(localFilters.importDateTo, "MM/dd/yy") : "Fim"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={localFilters.importDateTo}
                        onSelect={(date) => setLocalFilters({ ...localFilters, importDateTo: date })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Price Range */}
            <div>
              <Label className="text-sm font-medium">Faixa de Preço ($):</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <Label className="text-xs">Mín:</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={localFilters.priceMin || ""}
                    onChange={(e) => setLocalFilters({
                      ...localFilters,
                      priceMin: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Máx:</Label>
                  <Input
                    type="number"
                    placeholder="∞"
                    value={localFilters.priceMax || ""}
                    onChange={(e) => setLocalFilters({
                      ...localFilters,
                      priceMax: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Bedrooms */}
            <div>
              <Label className="text-sm font-medium">Quartos (mínimo):</Label>
              <Select
                value={localFilters.bedrooms?.toString() || ""}
                onValueChange={(value) => setLocalFilters({
                  ...localFilters,
                  bedrooms: value ? parseInt(value) : undefined
                })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Qualquer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Qualquer</SelectItem>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="2">2+</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                  <SelectItem value="4">4+</SelectItem>
                  <SelectItem value="5">5+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Checkboxes */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="airbnb-eligible"
                  checked={localFilters.airbnbEligible || false}
                  onCheckedChange={(checked) =>
                    setLocalFilters({ ...localFilters, airbnbEligible: checked ? true : undefined })
                  }
                />
                <Label htmlFor="airbnb-eligible" className="text-sm cursor-pointer">
                  🏠 Apenas elegíveis para Airbnb
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has-image"
                  checked={localFilters.hasImage || false}
                  onCheckedChange={(checked) =>
                    setLocalFilters({ ...localFilters, hasImage: checked ? true : undefined })
                  }
                />
                <Label htmlFor="has-image" className="text-sm cursor-pointer">
                  📸 Apenas com foto
                </Label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setLocalFilters({})} className="flex-1">
                Limpar
              </Button>
              <Button onClick={applyFilters} className="flex-1">
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
