import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CampaignManager } from '../src/components/marketing/CampaignManager';

describe('CampaignManager', () => {
  it('renders campaign manager title', () => {
    render(<CampaignManager />);
    expect(screen.getByText(/Campaign Manager/i)).toBeInTheDocument();
  });
});
