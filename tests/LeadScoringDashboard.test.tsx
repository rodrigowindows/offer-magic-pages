import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LeadScoringDashboard } from '../src/components/LeadScoringDashboard';

describe('LeadScoringDashboard', () => {
  it('renders dashboard title', () => {
    render(<LeadScoringDashboard />);
    expect(screen.getByText(/Lead Scoring Dashboard/i)).toBeInTheDocument();
  });
});
