const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkProperties() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

  const { data: properties, error } = await supabase
    .from('properties')
    .select('id, address, property_image_url, estimated_value')
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Sample properties data:');
  properties.forEach((prop, i) => {
    console.log(`Property ${i+1}:`, {
      id: prop.id,
      address: prop.address,
      property_image_url: prop.property_image_url,
      estimated_value: prop.estimated_value
    });
  });
}

checkProperties().catch(console.error);