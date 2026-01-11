import '@testing-library/jest-dom'

// Mock Supabase client
import { vi } from 'vitest'

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(),
        })),
        order: vi.fn(),
        limit: vi.fn(),
      })),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
    },
  },
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Mock window.location
delete (global as any).window.location
global.window.location = {
  ...global.window.location,
  origin: 'http://localhost:5173',
  href: 'http://localhost:5173',
  pathname: '/',
  search: '',
  hash: '',
}