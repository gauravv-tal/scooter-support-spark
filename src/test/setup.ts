import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

// Mock Supabase client
const mockSupabase = {
  auth: {
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
    signInWithOtp: vi.fn(),
    verifyOtp: vi.fn(),
    signOut: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
  })),
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}))

// Mock useAuth hook and AuthProvider
vi.mock('@/hooks/useAuth', () => {
  function AuthProvider({ children }) { return children; }
  return {
    useAuth: vi.fn(() => ({
      user: { id: 'test', phone: '9999999999' },
      signOut: vi.fn(),
      loading: false,
      session: null,
      signInWithPhone: vi.fn(),
      verifyOtp: vi.fn(),
    })),
    AuthProvider,
  };
});

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/' }),
  }
})

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
  },
  writable: true,
})