import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OfferConfiguration } from '../src/components/OfferConfiguration';

describe('OfferConfiguration', () => {
  it('renders configuration form', () => {
    render(<OfferConfiguration />);
    expect(screen.getByText(/Offer Configuration/i)).toBeInTheDocument();
  });
});
