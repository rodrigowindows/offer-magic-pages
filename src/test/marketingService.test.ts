import { describe, it, expect } from 'vitest';
import { replaceVariables, generateMessagePreview } from '@/services/marketingService';

describe('replaceVariables', () => {
  it('replaces single variable', () => {
    expect(replaceVariables('Hello {name}!', { name: 'John' })).toBe('Hello John!');
  });

  it('replaces multiple variables', () => {
    const result = replaceVariables('Hi {name}, your property at {address}', { name: 'John', address: '123 Main St' });
    expect(result).toBe('Hi John, your property at 123 Main St');
  });

  it('replaces repeated variables', () => {
    expect(replaceVariables('{name} is {name}', { name: 'John' })).toBe('John is John');
  });

  it('replaces missing variable with empty string', () => {
    expect(replaceVariables('Hello {name}!', {})).toBe('Hello !');
  });

  it('leaves unmatched brackets intact', () => {
    expect(replaceVariables('Hello {unknown}!', { name: 'John' })).toBe('Hello {unknown}!');
  });
});

describe('generateMessagePreview', () => {
  it('generates preview with recipient and company info', () => {
    const result = generateMessagePreview(
      'Hi {name}, interested in {address}? Call {contact_phone}',
      { name: 'John', address: '123 Main St' },
      { company_name: 'Acme', contact_phone: '555-1234', contact_phone_alt: '555-5678', city: 'Orlando' }
    );
    expect(result).toBe('Hi John, interested in 123 Main St? Call 555-1234');
  });

  it('uses company_name as fallback for seller_name', () => {
    const result = generateMessagePreview(
      'From {seller_name}',
      { name: 'John', address: '123 Main St' },
      { company_name: 'Acme Corp', contact_phone: '', contact_phone_alt: '', city: '' }
    );
    expect(result).toBe('From Acme Corp');
  });

  it('uses explicit seller_name when provided', () => {
    const result = generateMessagePreview(
      'From {seller_name}',
      { name: 'John', address: '123 Main St', seller_name: 'Bob' },
      { company_name: 'Acme Corp', contact_phone: '', contact_phone_alt: '', city: '' }
    );
    expect(result).toBe('From Bob');
  });
});
