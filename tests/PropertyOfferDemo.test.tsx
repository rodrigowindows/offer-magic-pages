import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PropertyOfferDemo } from '../src/components/PropertyOfferDemo';

describe('PropertyOfferDemo', () => {
  it('renders demo property offer', () => {
    render(<PropertyOfferDemo />);
    expect(screen.getByText('144 WASHINGTON AVE')).toBeInTheDocument();
    expect(screen.getByText('$70,000')).toBeInTheDocument();
  });
});
