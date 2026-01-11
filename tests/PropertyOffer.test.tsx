import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PropertyOffer } from '../src/components/PropertyOffer';

describe('PropertyOffer', () => {
  it('renders offer amount and address', () => {
    render(
      <PropertyOffer
        property={{
          address: '144 WASHINGTON AVE EATONVILLE, Orlando, FL',
          offerAmount: 70000,
        }}
      />
    );
    expect(screen.getByText('144 WASHINGTON AVE EATONVILLE, Orlando, FL')).toBeInTheDocument();
    expect(screen.getByText('$70,000')).toBeInTheDocument();
  });
});
