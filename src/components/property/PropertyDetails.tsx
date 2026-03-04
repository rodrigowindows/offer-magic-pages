import { Bed, Bath, Ruler, Calendar, Home, Maximize, Droplets } from "lucide-react";

interface PropertyDetailsProps {
  bedrooms?: number | null;
  bathrooms?: number | null;
  sqft?: number | null;
  square_feet?: number | null;
  year_built?: number | null;
  lot_size?: number | null;
  property_type?: string | null;
  pool?: boolean | null;
  address: string;
  city: string;
  state: string;
  neighborhood?: string | null;
  estimated_value: number;
}

const propertyTypeLabels: Record<string, string> = {
  "single-family": "Single Family Home",
  "single_family": "Single Family Home",
  "SFR": "Single Family Home",
  "condo": "Condominium",
  "townhouse": "Townhouse",
  "multi-family": "Multi-Family",
  "multi_family": "Multi-Family",
  "mobile": "Mobile Home",
  "land": "Vacant Land",
  "duplex": "Duplex",
  "triplex": "Triplex",
};

export const PropertyDetails = ({
  bedrooms,
  bathrooms,
  sqft,
  square_feet,
  year_built,
  lot_size,
  property_type,
  pool,
  address,
  city,
  state,
  neighborhood,
  estimated_value,
}: PropertyDetailsProps) => {
  const actualSqft = sqft || square_feet;
  const hasSpecs = bedrooms || bathrooms || actualSqft || year_built;

  if (!hasSpecs && !property_type) return null;

  const typeLabel = property_type
    ? propertyTypeLabels[property_type] || property_type
    : "Residential Property";

  const pricePerSqft = actualSqft && estimated_value
    ? Math.round(estimated_value / actualSqft)
    : null;

  return (
    <section className="py-10 bg-white">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Property Title */}
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Property Details
          </h2>
          <p className="text-gray-500 mt-1">
            {typeLabel} {neighborhood ? `in ${neighborhood}` : `in ${city}, ${state}`}
          </p>
        </div>

        {/* Specs Grid - Amazon-style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {bedrooms != null && bedrooms > 0 && (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bed className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{bedrooms}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Bedrooms</p>
              </div>
            </div>
          )}
          {bathrooms != null && bathrooms > 0 && (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <Bath className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{bathrooms}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Bathrooms</p>
              </div>
            </div>
          )}
          {actualSqft != null && actualSqft > 0 && (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="p-2 bg-green-100 rounded-lg">
                <Ruler className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{actualSqft.toLocaleString()}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Sq Ft</p>
              </div>
            </div>
          )}
          {year_built != null && year_built > 0 && (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{year_built}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Year Built</p>
              </div>
            </div>
          )}
        </div>

        {/* Additional Details Table - Amazon-style specs table */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="px-4 py-3 bg-gray-50 font-medium text-gray-700 w-1/3">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-gray-400" />
                    Property Type
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-900">{typeLabel}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="px-4 py-3 bg-gray-50 font-medium text-gray-700">
                  <div className="flex items-center gap-2">
                    <Maximize className="h-4 w-4 text-gray-400" />
                    Address
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-900">{address}</td>
              </tr>
              {lot_size != null && lot_size > 0 && (
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-3 bg-gray-50 font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      <Maximize className="h-4 w-4 text-gray-400" />
                      Lot Size
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-900">{lot_size.toLocaleString()} sq ft</td>
                </tr>
              )}
              {pricePerSqft && (
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-3 bg-gray-50 font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-gray-400" />
                      Price / Sq Ft
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-900">${pricePerSqft}/sqft</td>
                </tr>
              )}
              {pool != null && (
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-3 bg-gray-50 font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-gray-400" />
                      Pool
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-900">{pool ? "Yes" : "No"}</td>
                </tr>
              )}
              {neighborhood && (
                <tr>
                  <td className="px-4 py-3 bg-gray-50 font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-gray-400" />
                      Neighborhood
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-900">{neighborhood}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
