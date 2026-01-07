// Default test contacts for MCP and communication testing
// These are used when testing campaigns, SMS, emails, and integrations

export const TEST_CONTACTS = {
  primary: {
    phone: '+12405814595',
    email: 'rodrigowindows@gmail.com',
    name: 'Rodrigo (Test)',
  },
} as const;

// Helper to get formatted phone for different services
export const getTestPhone = (format: 'e164' | 'national' | 'digits' = 'e164') => {
  const phone = TEST_CONTACTS.primary.phone;
  switch (format) {
    case 'national':
      return phone.replace('+1', '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    case 'digits':
      return phone.replace(/\D/g, '');
    default:
      return phone;
  }
};

export const getTestEmail = () => TEST_CONTACTS.primary.email;
export const getTestName = () => TEST_CONTACTS.primary.name;
