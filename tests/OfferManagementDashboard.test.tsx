import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OfferManagementDashboard } from '../src/components/OfferManagementDashboard';

describe('OfferManagementDashboard', () => {
  it('renders dashboard title', () => {
    render(<OfferManagementDashboard />);
    expect(screen.getByText(/Offer Management Dashboard/i)).toBeInTheDocument();
  });
});
