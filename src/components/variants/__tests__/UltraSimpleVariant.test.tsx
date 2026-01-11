import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { UltraSimpleVariant } from '@/components/variants/UltraSimpleVariant'

// Mock the tracking function
vi.mock('@/utils/abTesting', () => ({
  trackABEvent: vi.fn()
}))

// Mock the offer formatting
vi.mock('@/utils/offerUtils', () => ({
  formatOffer: vi.fn(() => '$110,000'),
  getOfferType: vi.fn(() => 'fixed')
}))

describe('UltraSimpleVariant', () => {
  const mockProperty = {
    id: '123',
    address: '1025 S Washington Ave',
    city: 'Orlando',
    state: 'FL',
    estimated_value: 120000,
    cash_offer_amount: 110000
  }

  it('should render the offer amount prominently', () => {
    render(<UltraSimpleVariant property={mockProperty} />)

    expect(screen.getByText('$110,000')).toBeInTheDocument()
    expect(screen.getByText('For 1025 S Washington Ave, Orlando, FL')).toBeInTheDocument()
  })

  it('should display benefits grid', () => {
    render(<UltraSimpleVariant property={mockProperty} />)

    expect(screen.getByText('Close in 7-14 Days')).toBeInTheDocument()
    expect(screen.getByText('No Repairs Needed')).toBeInTheDocument()
    expect(screen.getByText('No Realtor Fees')).toBeInTheDocument()
  })

  it('should show action buttons initially', () => {
    render(<UltraSimpleVariant property={mockProperty} />)

    expect(screen.getByText('Accept This Offer')).toBeInTheDocument()
    expect(screen.getByText('I Have Questions')).toBeInTheDocument()
    expect(screen.getByText('Download PDF')).toBeInTheDocument()
  })

  it('should show contact form when Accept button is clicked', async () => {
    const user = userEvent.setup()
    render(<UltraSimpleVariant property={mockProperty} />)

    const acceptButton = screen.getByText('Accept This Offer')
    await user.click(acceptButton)

    // Should show contact form
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Phone')).toBeInTheDocument()
  })

  it('should show contact form when Questions button is clicked', async () => {
    const user = userEvent.setup()
    render(<UltraSimpleVariant property={mockProperty} />)

    const questionsButton = screen.getByText('I Have Questions')
    await user.click(questionsButton)

    // Should show contact form
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
  })

  it('should handle form submission', async () => {
    const user = userEvent.setup()
    render(<UltraSimpleVariant property={mockProperty} />)

    // Click accept to show form
    const acceptButton = screen.getByText('Accept This Offer')
    await user.click(acceptButton)

    // Fill out form
    const nameInput = screen.getByLabelText('Name')
    const emailInput = screen.getByLabelText('Email')
    const phoneInput = screen.getByLabelText('Phone')

    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'john@example.com')
    await user.type(phoneInput, '555-123-4567')

    // Mock alert
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})

    // Submit form
    const submitButton = screen.getByRole('button', { type: 'submit' })
    await user.click(submitButton)

    expect(alertMock).toHaveBeenCalledWith('Thanks! We\'ll contact you shortly.')

    alertMock.mockRestore()
  })

  it('should format currency correctly', () => {
    render(<UltraSimpleVariant property={mockProperty} />)

    // The component uses formatCurrency internally
    // We can test that the formatted amount appears
    expect(screen.getByText('$110,000')).toBeInTheDocument()
  })
})