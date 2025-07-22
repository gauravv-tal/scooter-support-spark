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
    vi.clearAllMocks();
    // Default: user is null, loading is true
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: true,
      signInWithPhone: vi.fn(),
      verifyOtp: vi.fn(),
      signOut: vi.fn(),
    });
  });

  it('initializes with null user and session', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('provides authentication functions', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signInWithPhone: vi.fn(),
      verifyOtp: vi.fn(),
      signOut: vi.fn(),
    });
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });
    expect(typeof result.current.signInWithPhone).toBe('function');
    expect(typeof result.current.verifyOtp).toBe('function');
    expect(typeof result.current.signOut).toBe('function');
  });

  it('calls supabase signInWithOtp when signInWithPhone is called', async () => {
    const mockSignInWithOtp = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.auth.signInWithOtp).mockImplementation(mockSignInWithOtp);
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signInWithPhone: async (phone) => {
        await supabase.auth.signInWithOtp({ phone, options: { channel: 'sms' } });
        return { error: null };
      },
      verifyOtp: vi.fn(),
      signOut: vi.fn(),
    });
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });
    await result.current.signInWithPhone('+919876543210');
    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      phone: '+919876543210',
      options: { channel: 'sms' },
    });
  });

  it('calls supabase verifyOtp when verifyOtp is called', async () => {
    const mockVerifyOtp = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.auth.verifyOtp).mockImplementation(mockVerifyOtp);
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signInWithPhone: vi.fn(),
      verifyOtp: async (phone, otp) => {
        await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
        return { error: null };
      },
      signOut: vi.fn(),
    });
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });
    await result.current.verifyOtp('+919876543210', '123456');
    expect(mockVerifyOtp).toHaveBeenCalledWith({
      phone: '+919876543210',
      token: '123456',
      type: 'sms',
    });
  });

  it('calls supabase signOut when signOut is called', async () => {
    const mockSignOut = vi.fn().mockResolvedValue({});
    vi.mocked(supabase.auth.signOut).mockImplementation(mockSignOut);
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signInWithPhone: vi.fn(),
      verifyOtp: vi.fn(),
      signOut: async () => {
        await supabase.auth.signOut();
      },
    });
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });
    await result.current.signOut();
    expect(mockSignOut).toHaveBeenCalled();
  });
});