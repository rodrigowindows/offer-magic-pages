import { describe, it, expect } from 'vitest';
import { checkAirbnbEligibility } from '@/utils/airbnbChecker';

describe('checkAirbnbEligibility', () => {
  it('returns eligible for Orlando', async () => {
    const result = await checkAirbnbEligibility('123 Main St', 'Orlando', 'FL');
    expect(result.eligible).toBe(true);
    expect(result.regulations.allowsShortTermRentals).toBe(true);
    expect(result.regulations.requiresLicense).toBe(true);
    expect(result.regulations.city).toBe('Orlando');
  });

  it('returns not eligible for Miami', async () => {
    const result = await checkAirbnbEligibility('456 Ocean Dr', 'Miami', 'FL');
    expect(result.eligible).toBe(false);
    expect(result.regulations.minNights).toBe(180);
  });

  it('returns not eligible for Fort Lauderdale', async () => {
    const result = await checkAirbnbEligibility('789 Beach Blvd', 'Fort Lauderdale', 'FL');
    expect(result.eligible).toBe(false);
  });

  it('returns eligible for Kissimmee', async () => {
    const result = await checkAirbnbEligibility('100 Disney Way', 'Kissimmee', 'FL');
    expect(result.eligible).toBe(true);
  });

  it('returns eligible for Tampa', async () => {
    const result = await checkAirbnbEligibility('200 Bay St', 'Tampa', 'FL');
    expect(result.eligible).toBe(true);
  });

  it('returns eligible for Davenport (near Disney)', async () => {
    const result = await checkAirbnbEligibility('300 Resort Dr', 'Davenport', 'FL');
    expect(result.eligible).toBe(true);
  });

  it('defaults to eligible for unknown cities', async () => {
    const result = await checkAirbnbEligibility('500 Random St', 'Smalltown', 'FL');
    expect(result.eligible).toBe(true);
    expect(result.regulations.notes).toContain('Manual verification recommended');
  });

  it('includes lastChecked timestamp', async () => {
    const result = await checkAirbnbEligibility('123 Main St', 'Orlando', 'FL');
    expect(result.lastChecked).toBeTruthy();
    expect(new Date(result.lastChecked).getTime()).not.toBeNaN();
  });
});
