import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PropertyHero } from '../src/components/PropertyHero';

describe('PropertyHero', () => {
  it('renders offer value and address', () => {
    render(<PropertyHero address="144 WASHINGTON AVE EATONVILLE, Orlando, FL" offerValue={70000} />);
    expect(screen.getByText('Your Fair Cash Offer')).toBeInTheDocument();
    expect(screen.getByText('$70,000')).toBeInTheDocument();
    expect(screen.getByText('For 144 WASHINGTON AVE EATONVILLE, Orlando, FL')).toBeInTheDocument();
  });

  it('renders all benefits', () => {
    const benefits = [
      'Close in 7-14 Days',
      'Fast closing guaranteed',
      'No Repairs Needed',
      'We buy as-is',
      'No Realtor Fees',
      'Save thousands',
    ];
    render(<PropertyHero address="144 WASHINGTON AVE EATONVILLE, Orlando, FL" offerValue={70000} />);
    benefits.forEach((benefit) => {
      expect(screen.getByText(benefit)).toBeInTheDocument();
    });
  });

  it('renders action buttons', () => {
    render(<PropertyHero address="144 WASHINGTON AVE EATONVILLE, Orlando, FL" offerValue={70000} />);
    expect(screen.getByText('Accept This Offer')).toBeInTheDocument();
    expect(screen.getByText('I Have Questions')).toBeInTheDocument();
    expect(screen.getByText('Download PDF')).toBeInTheDocument();
  });

  it('renders property link', () => {
    render(<PropertyHero address="144 WASHINGTON AVE EATONVILLE, Orlando, FL" offerValue={70000} />);
    expect(screen.getByText('View Full Offer Details')).toBeInTheDocument();
  });
});
