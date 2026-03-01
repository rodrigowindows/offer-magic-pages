/**
 * Orlando-area ZIP code classification for smart pre-denial suggestions.
 *
 * BAD_NEIGHBORHOOD_ZIPS — high-crime areas where wholesale investment is risky.
 * RURAL_ZIPS — isolated/rural areas without urban infrastructure.
 */

// ZIPs com alta criminalidade — Orlando metro
export const BAD_NEIGHBORHOOD_ZIPS = new Set([
  '32805', // Parramore / Holden Heights
  '32808', // Pine Hills
  '32811', // Orlo Vista
  '32818', // Pine Hills West
  '32839', // Oak Ridge / Holden Heights
]);

// ZIPs rurais — sem infraestrutura urbana
export const RURAL_ZIPS = new Set([
  '32820', // Christmas / East Orlando rural
  '32833', // Bithlo
]);

/**
 * Returns true if the ZIP code is in a good neighborhood
 * (not in BAD_NEIGHBORHOOD_ZIPS and not in RURAL_ZIPS).
 * Returns false if ZIP is unknown (null/empty) — conservative approach.
 */
export const isGoodNeighborhood = (zipCode: string | null): boolean => {
  if (!zipCode) return false;
  const zip = zipCode.trim();
  return zip.length > 0 && !BAD_NEIGHBORHOOD_ZIPS.has(zip) && !RURAL_ZIPS.has(zip);
};
