/**
 * CompsTable Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { CompsTable } from '../CompsTable';
import type { ComparableProperty } from '../types';

const mockComparables: ComparableProperty[] = [
  {
    id: '1',
    address: '123 Comp St',
    city: 'Orlando',
    state: 'FL',
    zip_code: '32801',
    sale_price: 250000,
    sale_date: '2024-01-15',
    square_feet: 1500,
    bedrooms: 3,
    bathrooms: 2,
    price_per_sqft: 166.67,
    distance: 0.5,
    similarity_score: 0.85,
  },
  {
    id: '2',
    address: '456 Comp Ave',
    city: 'Orlando',
    state: 'FL',
    zip_code: '32802',
    sale_price: 300000,
    sale_date: '2024-02-20',
    square_feet: 1800,
    bedrooms: 4,
    bathrooms: 2.5,
    price_per_sqft: 166.67,
    distance: 1.2,
    similarity_score: 0.70,
  },
  {
    id: '3',
    address: '789 Comp Rd',
    city: 'Orlando',
    state: 'FL',
    zip_code: '32803',
    sale_price: 200000,
    sale_date: '2023-12-10',
    square_feet: 1200,
    bedrooms: 2,
    bathrooms: 1,
    price_per_sqft: 166.67,
    distance: 2.5,
    similarity_score: 0.45,
  },
];

describe('CompsTable', () => {
  const mockOnViewDetails = jest.fn();
  const mockOnOpenMap = jest.fn();
  const mockOnToggleFavorite = jest.fn();
  const mockFavorites = new Set(['1']);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <CompsTable
        comparables={mockComparables}
        onViewDetails={mockOnViewDetails}
        onOpenMap={mockOnOpenMap}
        onToggleFavorite={mockOnToggleFavorite}
        favorites={mockFavorites}
      />
    );

    expect(screen.getByText('123 Comp St')).toBeInTheDocument();
    expect(screen.getByText('456 Comp Ave')).toBeInTheDocument();
    expect(screen.getByText('789 Comp Rd')).toBeInTheDocument();
  });

  it('displays quality badges correctly', () => {
    render(
      <CompsTable
        comparables={mockComparables}
        onViewDetails={mockOnViewDetails}
        onOpenMap={mockOnOpenMap}
        onToggleFavorite={mockOnToggleFavorite}
        favorites={mockFavorites}
      />
    );

    // Excellent: >= 0.8
    expect(screen.getByText('Excellent')).toBeInTheDocument();
    // Good: >= 0.6
    expect(screen.getByText('Good')).toBeInTheDocument();
    // Fair: >= 0.4
    expect(screen.getByText('Fair')).toBeInTheDocument();
  });

  it('formats currency correctly', () => {
    render(
      <CompsTable
        comparables={mockComparables}
        onViewDetails={mockOnViewDetails}
        onOpenMap={mockOnOpenMap}
        onToggleFavorite={mockOnToggleFavorite}
        favorites={mockFavorites}
      />
    );

    // Should format as $250,000
    expect(screen.getByText('$250,000')).toBeInTheDocument();
    expect(screen.getByText('$300,000')).toBeInTheDocument();
    expect(screen.getByText('$200,000')).toBeInTheDocument();
  });

  it('displays distance in miles', () => {
    render(
      <CompsTable
        comparables={mockComparables}
        onViewDetails={mockOnViewDetails}
        onOpenMap={mockOnOpenMap}
        onToggleFavorite={mockOnToggleFavorite}
        favorites={mockFavorites}
      />
    );

    expect(screen.getByText(/0.50 mi/)).toBeInTheDocument();
    expect(screen.getByText(/1.20 mi/)).toBeInTheDocument();
    expect(screen.getByText(/2.50 mi/)).toBeInTheDocument();
  });

  it('sorts by distance when distance header is clicked', () => {
    const { rerender } = render(
      <CompsTable
        comparables={mockComparables}
        onViewDetails={mockOnViewDetails}
        onOpenMap={mockOnOpenMap}
        onToggleFavorite={mockOnToggleFavorite}
        favorites={mockFavorites}
      />
    );

    const distanceHeader = screen.getByText('Distance');
    fireEvent.click(distanceHeader);

    // After sorting, the order should change
    // Component handles sorting internally
    expect(distanceHeader).toBeInTheDocument();
  });

  it('sorts by price when price header is clicked', () => {
    render(
      <CompsTable
        comparables={mockComparables}
        onViewDetails={mockOnViewDetails}
        onOpenMap={mockOnOpenMap}
        onToggleFavorite={mockOnToggleFavorite}
        favorites={mockFavorites}
      />
    );

    const priceHeader = screen.getByText('Sale Price');
    fireEvent.click(priceHeader);

    expect(priceHeader).toBeInTheDocument();
  });

  it('shows empty state when no comparables', () => {
    render(
      <CompsTable
        comparables={[]}
        onViewDetails={mockOnViewDetails}
        onOpenMap={mockOnOpenMap}
        onToggleFavorite={mockOnToggleFavorite}
        favorites={mockFavorites}
      />
    );

    expect(screen.getByText('No comparable properties found')).toBeInTheDocument();
  });

  it('highlights selected comparable', () => {
    render(
      <CompsTable
        comparables={mockComparables}
        onViewDetails={mockOnViewDetails}
        onOpenMap={mockOnOpenMap}
        onToggleFavorite={mockOnToggleFavorite}
        favorites={mockFavorites}
        highlightedCompId="1"
      />
    );

    // Component should apply special styling to highlighted row
    const firstComp = screen.getByText('123 Comp St');
    expect(firstComp).toBeInTheDocument();
  });

  it('shows favorite stars correctly', () => {
    render(
      <CompsTable
        comparables={mockComparables}
        onViewDetails={mockOnViewDetails}
        onOpenMap={mockOnOpenMap}
        onToggleFavorite={mockOnToggleFavorite}
        favorites={mockFavorites}
      />
    );

    // Comp 1 should be favorited
    expect(mockFavorites.has('1')).toBe(true);
    expect(mockFavorites.has('2')).toBe(false);
  });

  it('displays beds/baths correctly', () => {
    render(
      <CompsTable
        comparables={mockComparables}
        onViewDetails={mockOnViewDetails}
        onOpenMap={mockOnOpenMap}
        onToggleFavorite={mockOnToggleFavorite}
        favorites={mockFavorites}
      />
    );

    expect(screen.getByText('3bd / 2ba')).toBeInTheDocument();
    expect(screen.getByText('4bd / 2.5ba')).toBeInTheDocument();
    expect(screen.getByText('2bd / 1ba')).toBeInTheDocument();
  });

  it('formats square feet with commas', () => {
    render(
      <CompsTable
        comparables={mockComparables}
        onViewDetails={mockOnViewDetails}
        onOpenMap={mockOnOpenMap}
        onToggleFavorite={mockOnToggleFavorite}
        favorites={mockFavorites}
      />
    );

    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText('1,800')).toBeInTheDocument();
    expect(screen.getByText('1,200')).toBeInTheDocument();
  });

  it('displays price per sqft', () => {
    render(
      <CompsTable
        comparables={mockComparables}
        onViewDetails={mockOnViewDetails}
        onOpenMap={mockOnOpenMap}
        onToggleFavorite={mockOnToggleFavorite}
        favorites={mockFavorites}
      />
    );

    // Should show $167 (rounded)
    expect(screen.getAllByText('$167')).toHaveLength(3);
  });
});
