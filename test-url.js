// Test script for URL generation
const generatePropertySlug = (property) => {
  // Remove caracteres especiais e converte para lowercase
  const cleanAddress = property.address
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais exceto espaços e hífens
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens múltiplos
    .trim();

  const cleanCity = property.city
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  const cleanState = property.state.toLowerCase().trim();

  // Formato: endereço-cidade-estado-zip
  return `${cleanAddress}-${cleanCity}-${cleanState}-${property.zip_code}`;
};

const generatePropertyUrl = (property, sourceChannel = 'sms') => {
  const slug = generatePropertySlug(property);
  const baseUrl = 'https://offer.mylocalinvest.com';
  return `${baseUrl}/property/${slug}?src=${sourceChannel}`;
};

// Test with the example property from the user
const testProperty = {
  id: '47c4a989-f115-4763-9953-68834a0719e1',
  address: '1025 S WASHINGTON AVE',
  city: 'Orlando',
  state: 'FL',
  zip_code: '32801'
};

console.log('Original property:', testProperty);
console.log('Generated slug:', generatePropertySlug(testProperty));
console.log('Generated URL:', generatePropertyUrl(testProperty, 'sms'));