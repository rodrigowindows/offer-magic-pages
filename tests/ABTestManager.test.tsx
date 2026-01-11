import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ABTestManager } from '../src/components/marketing/ABTestManager';

describe('ABTestManager', () => {
  it('renders AB test manager title', () => {
    render(<ABTestManager />);
    expect(screen.getByText(/A\/B Test Manager/i)).toBeInTheDocument();
  });
});
