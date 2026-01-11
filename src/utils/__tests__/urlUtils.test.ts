import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  generatePropertySlug,
  generatePropertyUrl,
  generateTrackableUrl
} from '@/utils/urlUtils'

describe('urlUtils', () => {
  const mockProperty = {
    id: '123',
    address: '1025 S WASHINGTON AVE',
    city: 'Orlando',
    state: 'FL',
    zip_code: '32801'
  }

  describe('generatePropertySlug', () => {
    it('should generate clean slug from property address', () => {
      const slug = generatePropertySlug(mockProperty)
      expect(slug).toBe('1025-s-washington-ave-orlando-fl-32801')
    })

    it('should handle special characters in address', () => {
      const propertyWithSpecialChars = {
        ...mockProperty,
        address: '123 Main St. #4B'
      }
      const slug = generatePropertySlug(propertyWithSpecialChars)
      expect(slug).toBe('123-main-st-4b-orlando-fl-32801')
    })

    it('should handle multiple spaces and hyphens', () => {
      const propertyWithMultipleSpaces = {
        ...mockProperty,
        address: '123   Main   --   St'
      }
      const slug = generatePropertySlug(propertyWithMultipleSpaces)
      expect(slug).toBe('123-main-st-orlando-fl-32801')
    })

    it('should handle city names with spaces', () => {
      const propertyWithSpacedCity = {
        ...mockProperty,
        city: 'Los Angeles'
      }
      const slug = generatePropertySlug(propertyWithSpacedCity)
      expect(slug).toBe('1025-s-washington-ave-los-angeles-fl-32801')
    })
  })

  describe('generatePropertyUrl', () => {
    it('should generate property URL with default SMS source', () => {
      const url = generatePropertyUrl(mockProperty)
      expect(url).toBe('https://offer.mylocalinvest.com/property/1025-s-washington-ave-orlando-fl-32801?src=sms')
    })

    it('should generate property URL with email source', () => {
      const url = generatePropertyUrl(mockProperty, 'email')
      expect(url).toBe('https://offer.mylocalinvest.com/property/1025-s-washington-ave-orlando-fl-32801?src=email')
    })

    it('should generate property URL with call source', () => {
      const url = generatePropertyUrl(mockProperty, 'call')
      expect(url).toBe('https://offer.mylocalinvest.com/property/1025-s-washington-ave-orlando-fl-32801?src=call')
    })
  })

  describe('generateTrackableUrl', () => {
    beforeEach(() => {
      // Mock window.location.origin
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:5173' },
        writable: true
      })
    })

    it('should return regular property URL when no tracking ID', () => {
      const url = generateTrackableUrl(mockProperty, 'email')
      expect(url).toBe('https://offer.mylocalinvest.com/property/1025-s-washington-ave-orlando-fl-32801?src=email')
    })

    it('should generate trackable URL with tracking ID', () => {
      const trackingId = 'test-tracking-123'
      const url = generateTrackableUrl(mockProperty, 'email', trackingId)

      const expectedPropertyUrl = 'https://offer.mylocalinvest.com/property/1025-s-washington-ave-orlando-fl-32801?src=email'
      const expectedTrackingUrl = `http://localhost:5173/functions/v1/track-link-click?id=${trackingId}&redirect=${encodeURIComponent(expectedPropertyUrl)}`

      expect(url).toBe(expectedTrackingUrl)
    })

    it('should properly encode the redirect URL', () => {
      const trackingId = 'test-tracking-123'
      const url = generateTrackableUrl(mockProperty, 'email', trackingId)

      expect(url).toContain(encodeURIComponent('https://offer.mylocalinvest.com/property/1025-s-washington-ave-orlando-fl-32801?src=email'))
    })
  })
})