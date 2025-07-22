import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/dom'
import { render } from '@/test/test-utils'
import LoginPage from '@/components/LoginPage'
import { useAuth } from '@/hooks/useAuth'

// Mock the useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

const mockUseAuth = vi.mocked(useAuth)

describe('LoginPage', () => {
  const mockSignInWithPhone = vi.fn()
  const mockVerifyOtp = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signInWithPhone: mockSignInWithPhone,
      verifyOtp: mockVerifyOtp,
      signOut: vi.fn(),
    })
  })

  it('renders phone number input initially', () => {
    render(<LoginPage />)
    
    expect(screen.getByPlaceholderText('Enter your phone number')).toBeInTheDocument()
    expect(screen.getByText('Send OTP')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Enter OTP')).not.toBeInTheDocument()
  })

  it('validates phone number input', async () => {
    render(<LoginPage />)
    
    const phoneInput = screen.getByPlaceholderText('Enter your phone number')
    const sendButton = screen.getByText('Send OTP')

    // Test with invalid phone number
    fireEvent.change(phoneInput, { target: { value: '123' } })
    fireEvent.click(sendButton)
    
    expect(mockSignInWithPhone).not.toHaveBeenCalled()
  })

  it('sends OTP when valid phone number is entered', async () => {
    mockSignInWithPhone.mockResolvedValue({ error: null })
    
    render(<LoginPage />)
    
    const phoneInput = screen.getByPlaceholderText('Enter your phone number')
    const sendButton = screen.getByText('Send OTP')

    fireEvent.change(phoneInput, { target: { value: '9876543210' } })
    fireEvent.click(sendButton)
    
    await waitFor(() => {
      expect(mockSignInWithPhone).toHaveBeenCalledWith('+919876543210')
    })
  })

  it('handles phone number input changes correctly', () => {
    render(<LoginPage />)
    
    const phoneInput = screen.getByPlaceholderText('Enter your phone number')
    
    // Test that only numbers are allowed
    fireEvent.change(phoneInput, { target: { value: 'abc123def456' } })
    expect(phoneInput).toHaveValue('123456')
    
    // Test max length restriction
    fireEvent.change(phoneInput, { target: { value: '12345678901234' } })
    expect(phoneInput).toHaveValue('1234567890')
  })
})