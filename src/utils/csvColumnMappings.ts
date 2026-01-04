// Extended CSV Column Mappings for Auto-Detection
// This file contains all possible CSV column name variations

export const EXTENDED_COLUMN_MAPPINGS = {
  // ============ ADDRESS VARIATIONS ============
  address: [
    'address',
    'propertyaddress',
    'situsaddress',
    'streetaddress',
    'inputpropertyaddress',
    'inputaddress',
    'property_address',
    'situs_address',
    'street_address',
    'input_property_address',
    'input_address',
  ],

  // ============ CITY VARIATIONS ============
  city: [
    'city',
    'propertycity',
    'situscity',
    'inputpropertycity',
    'inputcity',
    'property_city',
    'situs_city',
    'input_property_city',
    'input_city',
  ],

  // ============ STATE VARIATIONS ============
  state: [
    'state',
    'propertystate',
    'situsstate',
    'inputpropertystate',
    'inputstate',
    'property_state',
    'situs_state',
    'input_property_state',
    'input_state',
  ],

  // ============ ZIP CODE VARIATIONS ============
  zip_code: [
    'zip',
    'zipcode',
    'postalcode',
    'situszip',
    'inputpropertyzip',
    'inputzip',
    'zip_code',
    'postal_code',
    'situs_zip',
    'input_property_zip',
    'input_zip',
  ],

  // ============ OWNER NAME VARIATIONS ============
  owner_name: [
    'ownername',
    'owner',
    'name',
    'inputlastname',
    'inputfirstname',
    'ownerfirstname',
    'ownerlastname',
    'owner_name',
    'owner_first_name',
    'owner_last_name',
    'input_last_name',
    'input_first_name',
    'firstname',
    'first_name',
    'lastname',
    'last_name',
  ],

  // ============ OWNER PHONE VARIATIONS ============
  owner_phone: [
    'ownerphone',
    'phone',
    'phonenumber',
    'owner_phone',
    'phone_number',
    'owner_phone_number',
    'contact',
    'contactnumber',
    'contact_number',
  ],

  // ============ OWNER ADDRESS VARIATIONS ============
  owner_address: [
    'owneraddress',
    'mailingaddress',
    'inputmailingaddress1',
    'inputmailingaddress',
    'owner_address',
    'mailing_address',
    'input_mailing_address_1',
    'input_mailing_address',
    'mail_address',
    'mailaddress',
  ],

  // ============ OWNER CITY VARIATIONS ============
  owner_city: [
    'ownercity',
    'mailingcity',
    'inputmailingcity',
    'owner_city',
    'mailing_city',
    'input_mailing_city',
    'mailcity',
    'mail_city',
  ],

  // ============ OWNER STATE VARIATIONS ============
  owner_state: [
    'ownerstate',
    'mailingstate',
    'inputmailingstate',
    'owner_state',
    'mailing_state',
    'input_mailing_state',
    'mailstate',
    'mail_state',
  ],

  // ============ OWNER ZIP VARIATIONS ============
  owner_zip: [
    'ownerzip',
    'mailingzip',
    'inputmailingzip',
    'owner_zip',
    'mailing_zip',
    'input_mailing_zip',
    'mailzip',
    'mail_zip',
  ],

  // ============ PROPERTY DETAILS ============
  bedrooms: [
    'beds',
    'bedrooms',
    'bedroom',
    'bed',
    'numberofbedrooms',
    'number_of_bedrooms',
  ],

  bathrooms: [
    'baths',
    'bathrooms',
    'bathroom',
    'bath',
    'numberofbathrooms',
    'number_of_bathrooms',
  ],

  square_feet: [
    'sqft',
    'squarefeet',
    'livingarea',
    'area',
    'square_feet',
    'living_area',
    'buildingsqft',
    'building_sqft',
    'totalsqft',
    'total_sqft',
  ],

  lot_size: [
    'lotsize',
    'lot',
    'landarea',
    'lot_size',
    'land_area',
    'lotsizesqft',
    'lot_size_sqft',
    'acreage',
    'acres',
  ],

  year_built: [
    'yearbuilt',
    'year',
    'built',
    'year_built',
    'constructionyear',
    'construction_year',
    'buildyear',
    'build_year',
  ],

  property_type: [
    'propertytype',
    'type',
    'usecode',
    'property_type',
    'use_code',
    'buildingtype',
    'building_type',
    'classification',
  ],

  // ============ FINANCIAL ============
  estimated_value: [
    'justvalue',
    'estimatedvalue',
    'marketvalue',
    'value',
    'price',
    'assessedvalue',
    'estimated_value',
    'market_value',
    'assessed_value',
    'just_value',
    'totalvalue',
    'total_value',
    'appraisedvalue',
    'appraised_value',
    // Orlando CSV specific
    'marketvalue2025',
    'market_value_2025',
    'taxablevalue',
    'taxable_value',
  ],

  cash_offer_amount: [
    'cashoffer',
    'cashofferamount',
    'offer',
    'cash_offer',
    'cash_offer_amount',
    'offeramount',
    'offer_amount',
  ],

  // ============ SYSTEM FIELDS ============
  origem: [
    'accountnumber',
    'account',
    'pid',
    'parcelid',
    'folio',
    'origem',
    'account_number',
    'parcel_id',
    'parcel',
    'parc',
    'apn',
    'assessorparcelnumber',
    'assessor_parcel_number',
  ],

  county: [
    'county',
    'countie',
  ],

  neighborhood: [
    'neighborhood',
    'subdivision',
    'neighbourhood',
    'district',
  ],
} as const;

// Normalize column name for matching
export function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric
    .trim();
}

// Auto-detect database field from CSV column name
export function autoDetectDatabaseField(csvColumnName: string): string {
  const normalized = normalizeColumnName(csvColumnName);

  for (const [dbField, variations] of Object.entries(EXTENDED_COLUMN_MAPPINGS)) {
    const normalizedVariations = variations.map(v => normalizeColumnName(v));
    if (normalizedVariations.includes(normalized)) {
      return dbField;
    }
  }

  return ''; // No match found
}

// Get all CSV variations for a database field
export function getCSVVariations(dbField: string): string[] {
  const variations = EXTENDED_COLUMN_MAPPINGS[dbField as keyof typeof EXTENDED_COLUMN_MAPPINGS];
  return variations ? [...variations] : [];
}

// Test function to see what a CSV column would map to
export function testMapping(csvColumnName: string): void {
  const normalized = normalizeColumnName(csvColumnName);
  const detected = autoDetectDatabaseField(csvColumnName);

  console.log('📊 CSV Column Mapping Test');
  console.log('Input:', csvColumnName);
  console.log('Normalized:', normalized);
  console.log('Detected DB Field:', detected || '(no match)');

  if (detected) {
    console.log('All variations for', detected + ':', getCSVVariations(detected));
  }
}
