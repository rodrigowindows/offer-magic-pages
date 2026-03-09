import { describe, it, expect } from 'vitest';
import { parseOrlandoLeadsCSV } from '@/utils/bulkImport';

describe('parseOrlandoLeadsCSV', () => {
  it('parses valid CSV with required fields', () => {
    const csv = `address,city,state,zip,estimated_value,cash_offer_amount
123 Main St,Orlando,FL,32801,250000,175000`;
    const leads = parseOrlandoLeadsCSV(csv);
    expect(leads).toHaveLength(1);
    expect(leads[0].address).toBe('123 Main St');
    expect(leads[0].city).toBe('Orlando');
    expect(leads[0].estimated_value).toBe(250000);
    expect(leads[0].cash_offer_amount).toBe(175000);
  });

  it('skips rows missing required fields', () => {
    const csv = `address,city,state,zip,estimated_value
,Orlando,FL,32801,0`;
    const leads = parseOrlandoLeadsCSV(csv);
    expect(leads).toHaveLength(0);
  });

  it('throws on empty CSV', () => {
    expect(() => parseOrlandoLeadsCSV('')).toThrow();
  });

  it('auto-calculates cash offer when not provided', () => {
    const csv = `address,city,state,zip,estimated_value
456 Oak Ave,Orlando,FL,32801,200000`;
    const leads = parseOrlandoLeadsCSV(csv);
    expect(leads).toHaveLength(1);
    expect(leads[0].cash_offer_amount).toBeGreaterThan(0);
    expect(leads[0].cash_offer_amount).toBeLessThan(200000);
  });

  it('maps PID field correctly', () => {
    const csv = `pid,address,city,state,zip,estimated_value,cash_offer_amount
ABC123,789 Elm St,Tampa,FL,33601,300000,210000`;
    const leads = parseOrlandoLeadsCSV(csv);
    expect(leads[0].PID).toBe('ABC123');
  });

  it('handles quoted values with commas', () => {
    const csv = `address,city,state,zip,estimated_value,cash_offer_amount
"123 Main St, Apt 4",Orlando,FL,32801,250000,175000`;
    const leads = parseOrlandoLeadsCSV(csv);
    expect(leads).toHaveLength(1);
    expect(leads[0].address).toBe('123 Main St, Apt 4');
  });

  it('cleans UNINCORPORATED from addresses', () => {
    const csv = `address,city,state,zip,estimated_value,cash_offer_amount
123 Main St UNINCORPORATED,Orlando,FL,32801,250000,175000`;
    const leads = parseOrlandoLeadsCSV(csv);
    expect(leads[0].address).not.toContain('UNINCORPORATED');
  });

  it('parses bedrooms and bathrooms', () => {
    const csv = `address,city,state,zip,estimated_value,cash_offer_amount,bedrooms,bathrooms
123 Main St,Orlando,FL,32801,250000,175000,3,2.5`;
    const leads = parseOrlandoLeadsCSV(csv);
    expect(leads[0].bedrooms).toBe(3);
    expect(leads[0].bathrooms).toBe(2.5);
  });

  it('parses boolean fields like vacant and deed_certified', () => {
    const csv = `address,city,state,zip,estimated_value,cash_offer_amount,vacant,deed_certified
123 Main St,Orlando,FL,32801,250000,175000,true,1`;
    const leads = parseOrlandoLeadsCSV(csv);
    expect(leads[0].vacant).toBe(true);
    expect(leads[0].deed_certified).toBe(true);
  });

  it('handles multiple rows', () => {
    const csv = `address,city,state,zip,estimated_value,cash_offer_amount
123 Main St,Orlando,FL,32801,250000,175000
456 Oak Ave,Tampa,FL,33601,300000,210000
789 Elm St,Miami,FL,33101,400000,280000`;
    const leads = parseOrlandoLeadsCSV(csv);
    expect(leads).toHaveLength(3);
  });
});
