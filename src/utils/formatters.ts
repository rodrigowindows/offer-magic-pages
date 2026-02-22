/**
 * Formata número de telefone
 * Handles: 10-digit, 11-digit with country code, scientific notation (4.08E+09)
 * Ex: 7868828251 -> (786) 882-8251
 * Ex: 17868828251 -> +1 (786) 882-8251
 */
export const formatPhone = (phone?: string | null): string => {
  if (!phone) return '';
  // Handle scientific notation (4.08E+09)
  let phoneStr = String(phone);
  if (phoneStr.includes('E') || phoneStr.includes('e')) {
    const num = parseFloat(phoneStr);
    if (!isNaN(num)) {
      phoneStr = Math.round(num).toString();
    }
  }
  const cleaned = phoneStr.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phoneStr;
};
