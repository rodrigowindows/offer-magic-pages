// Check FEMA flood zone for a property using the National Flood Hazard Layer (NFHL).
// Free, no API key. Public ArcGIS REST endpoint maintained by FEMA.
//
// Strategy:
//  1) If property has lat/lng → query NFHL by point.
//  2) If not → geocode the address via Census Geocoder (also free, no key) then query NFHL.
//  3) Persist flood_zone + flood_zone_checked_at on properties row.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const NFHL_FLOOD_HAZARD_LAYER =
  "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query";

const CENSUS_GEOCODER =
  "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress";

interface CheckRequest {
  property_id?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  persist?: boolean;
}

async function geocodeAddress(oneLine: string): Promise<{ x: number; y: number } | null> {
  const url = `${CENSUS_GEOCODER}?address=${encodeURIComponent(oneLine)}&benchmark=Public_AR_Current&format=json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const match = data?.result?.addressMatches?.[0];
  if (!match?.coordinates) return null;
  return { x: match.coordinates.x, y: match.coordinates.y }; // lon, lat
}

async function queryFloodZone(lon: number, lat: number): Promise<{
  zone: string | null;
  sfha: string | null;
  raw: unknown;
}> {
  // ArcGIS expects geometry as JSON for point queries.
  const geometry = JSON.stringify({
    x: lon,
    y: lat,
    spatialReference: { wkid: 4326 },
  });
  const params = new URLSearchParams({
    geometry,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "FLD_ZONE,SFHA_TF,ZONE_SUBTY",
    returnGeometry: "false",
    f: "json",
  });
  const res = await fetch(`${NFHL_FLOOD_HAZARD_LAYER}?${params.toString()}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; OfferMagicPages/1.0; +https://offer.mylocalinvest.com)",
      "Accept": "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`FEMA NFHL query failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  const feat = data?.features?.[0]?.attributes;
  return {
    zone: feat?.FLD_ZONE ?? null,
    sfha: feat?.SFHA_TF ?? null,
    raw: data,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: CheckRequest = await req.json();

    let lat = body.latitude;
    let lon = body.longitude;
    let resolvedFromGeocoder = false;

    // If lat/lng missing, try to geocode from address parts
    if ((!lat || !lon) && (body.address || body.property_id)) {
      let oneLine = "";
      if (body.address) {
        oneLine = [body.address, body.city, body.state, body.zip]
          .filter(Boolean)
          .join(", ");
      }

      // If we got property_id but no address fields, fetch from DB
      if (!oneLine && body.property_id) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
        const { data: prop } = await supabase
          .from("properties")
          .select("address, city, state, zip_code, latitude, longitude")
          .eq("id", body.property_id)
          .maybeSingle();
        if (prop) {
          if (prop.latitude && prop.longitude) {
            lat = Number(prop.latitude);
            lon = Number(prop.longitude);
          } else {
            oneLine = [prop.address, prop.city, prop.state, prop.zip_code]
              .filter(Boolean)
              .join(", ");
          }
        }
      }

      if ((!lat || !lon) && oneLine) {
        const geo = await geocodeAddress(oneLine);
        if (geo) {
          lon = geo.x;
          lat = geo.y;
          resolvedFromGeocoder = true;
        }
      }
    }

    if (!lat || !lon) {
      return new Response(
        JSON.stringify({
          error: "Could not resolve coordinates. Provide latitude+longitude, address, or property_id with stored address.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const result = await queryFloodZone(lon, lat);

    // Persist to DB if requested
    if (body.persist && body.property_id) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await supabase
        .from("properties")
        .update({
          flood_zone: result.zone,
          flood_zone_checked_at: new Date().toISOString(),
          ...(resolvedFromGeocoder ? { latitude: lat, longitude: lon } : {}),
        })
        .eq("id", body.property_id);
    }

    const HIGH_RISK = ["A", "AE", "AH", "AO", "V", "VE", "AR", "A99"];
    const isHighRisk = result.zone
      ? HIGH_RISK.includes(result.zone.toUpperCase())
      : false;

    return new Response(
      JSON.stringify({
        flood_zone: result.zone,
        sfha: result.sfha,
        is_high_risk: isHighRisk,
        latitude: lat,
        longitude: lon,
        resolved_from_geocoder: resolvedFromGeocoder,
        checked_at: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("check-flood-zone error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
