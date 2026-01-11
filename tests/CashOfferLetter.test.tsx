import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CashOfferLetter } from '../src/components/CashOfferLetter';

describe('CashOfferLetter', () => {
  it('renders address and offer', () => {
    render(
      <CashOfferLetter
        address="144 WASHINGTON AVE EATONVILLE"
        city="Orlando"
        state="FL"
        zipCode="32810"
        cashOffer={70000}
        estimatedValue={90000}
        propertySlug="144-washington-ave-eatonville-orlando-fl"
      />
    );
    expect(screen.getByText('144 WASHINGTON AVE EATONVILLE, Orlando, FL 32810')).toBeInTheDocument();
    expect(screen.getByText('$70,000')).toBeInTheDocument();
    expect(screen.getByText('Market Value: $90,000')).toBeInTheDocument();
  });

  it('renders QR code and link', () => {
    render(
      <CashOfferLetter
        address="144 WASHINGTON AVE EATONVILLE"
        city="Orlando"
        state="FL"
        zipCode="32810"
        cashOffer={70000}
        estimatedValue={90000}
        propertySlug="144-washington-ave-eatonville-orlando-fl"
      />
    );
    expect(screen.getByText('View Full Offer Details')).toBeInTheDocument();
  });
});
