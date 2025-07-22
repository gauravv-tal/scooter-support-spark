import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth, AuthProvider } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  )
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with null user and session', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
    expect(result.current.loading).toBe(true)
  })

  it('provides authentication functions', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    expect(typeof result.current.signInWithPhone).toBe('function')
    expect(typeof result.current.verifyOtp).toBe('function')
    expect(typeof result.current.signOut).toBe('function')
  })

  it('calls supabase signInWithOtp when signInWithPhone is called', async () => {
    const mockSignInWithOtp = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.auth.signInWithOtp).mockImplementation(mockSignInWithOtp)

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    await result.current.signInWithPhone('+919876543210')

    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      phone: '+919876543210',
      options: {
        channel: 'sms'
      }
    })
  })

  it('calls supabase verifyOtp when verifyOtp is called', async () => {
    const mockVerifyOtp = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.auth.verifyOtp).mockImplementation(mockVerifyOtp)

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    await result.current.verifyOtp('+919876543210', '123456')

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      phone: '+919876543210',
      token: '123456',
      type: 'sms'
    })
  })

  it('calls supabase signOut when signOut is called', async () => {
    const mockSignOut = vi.fn().mockResolvedValue({})
    vi.mocked(supabase.auth.signOut).mockImplementation(mockSignOut)

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    await result.current.signOut()

    expect(mockSignOut).toHaveBeenCalled()
  })
})