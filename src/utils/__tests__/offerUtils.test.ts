import { describe, it, expect } from 'vitest'
import {
  getOfferType,
  formatOffer,
  formatOfferForTemplate,
  getOfferAverage,
  isValidOffer,
  getOfferDescription,
  type OfferData
} from '@/utils/offerUtils'

describe('offerUtils', () => {
  describe('getOfferType', () => {
    it('should return "range" when min and max are provided', () => {
      const offer: OfferData = {
        cash_offer_min: 100000,
        cash_offer_max: 120000
      }
      expect(getOfferType(offer)).toBe('range')
    })

    it('should return "range" when legacy min/max are provided', () => {
      const offer: OfferData = {
        min_offer_amount: 100000,
        max_offer_amount: 120000
      }
      expect(getOfferType(offer)).toBe('range')
    })

    it('should return "fixed" when cash_offer_amount is provided', () => {
      const offer: OfferData = {
        cash_offer_amount: 110000
      }
      expect(getOfferType(offer)).toBe('fixed')
    })

    it('should return "fixed" as fallback when no valid data', () => {
      const offer: OfferData = {}
      expect(getOfferType(offer)).toBe('fixed')
    })
  })

  describe('formatOffer', () => {
    it('should format fixed offer correctly', () => {
      const offer: OfferData = { cash_offer_amount: 110000 }
      expect(formatOffer(offer)).toBe('$110,000')
    })

    it('should format range offer correctly', () => {
      const offer: OfferData = {
        min_offer_amount: 100000,
        max_offer_amount: 120000
      }
      expect(formatOffer(offer)).toBe('$100,000 - $120,000')
    })

    it('should format with shortForm option', () => {
      const offer: OfferData = { cash_offer_amount: 110000 }
      expect(formatOffer(offer, { shortForm: true })).toBe('$110,000')
    })

    it('should handle different currency and locale', () => {
      const offer: OfferData = { cash_offer_amount: 110000 }
      expect(formatOffer(offer, { currency: 'EUR', locale: 'de-DE' })).toBe('110.000 €')
    })
  })

  describe('formatOfferForTemplate', () => {
    it('should format fixed offer for template', () => {
      const offer: OfferData = { cash_offer_amount: 110000 }
      expect(formatOfferForTemplate(offer)).toBe('$110,000')
    })

    it('should format range offer for template', () => {
      const offer: OfferData = {
        cash_offer_min: 100000,
        cash_offer_max: 120000
      }
      expect(formatOfferForTemplate(offer)).toBe('$100,000 - $120,000')
    })
  })

  describe('getOfferAverage', () => {
    it('should calculate average for range offers', () => {
      const offer: OfferData = {
        min_offer_amount: 100000,
        max_offer_amount: 120000
      }
      expect(getOfferAverage(offer)).toBe(110000)
    })

    it('should return fixed amount for fixed offers', () => {
      const offer: OfferData = { cash_offer_amount: 110000 }
      expect(getOfferAverage(offer)).toBe(110000)
    })

    it('should return 0 for invalid offers', () => {
      const offer: OfferData = {}
      expect(getOfferAverage(offer)).toBe(0)
    })
  })

  describe('isValidOffer', () => {
    it('should validate fixed offers correctly', () => {
      expect(isValidOffer({ cash_offer_amount: 110000 })).toBe(true)
      expect(isValidOffer({ cash_offer_amount: 0 })).toBe(false)
      expect(isValidOffer({})).toBe(false)
    })

    it('should validate range offers correctly', () => {
      expect(isValidOffer({
        min_offer_amount: 100000,
        max_offer_amount: 120000
      })).toBe(true)

      expect(isValidOffer({
        min_offer_amount: 120000,
        max_offer_amount: 100000
      })).toBe(false) // min > max

      expect(isValidOffer({
        min_offer_amount: 0,
        max_offer_amount: 120000
      })).toBe(false) // min = 0
    })
  })

  describe('getOfferDescription', () => {
    it('should create description for fixed offers', () => {
      const offer: OfferData = { cash_offer_amount: 110000 }
      expect(getOfferDescription(offer)).toBe('Fixed: $110000')
    })

    it('should create description for range offers', () => {
      const offer: OfferData = {
        min_offer_amount: 100000,
        max_offer_amount: 120000
      }
      expect(getOfferDescription(offer)).toBe('Range: $100000 - $120000')
    })
  })
})