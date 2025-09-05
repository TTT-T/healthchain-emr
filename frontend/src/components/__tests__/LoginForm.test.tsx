import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '../../app/login/LoginForm'

// Mock the useAuth hook
const mockLogin = jest.fn()
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoading: false,
    error: null
  })
}))

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}))

describe('LoginForm Component', () => {
  beforeEach(() => {
    mockLogin.mockClear()
  })

  it('renders login form fields', () => {
    render(<LoginForm />)
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const submitButton = screen.getByRole('button', { name: /login/i })
    await user.click(submitButton)
    
    expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    expect(screen.getByText(/password is required/i)).toBeInTheDocument()
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'invalid-email')
    
    const submitButton = screen.getByRole('button', { name: /login/i })
    await user.click(submitButton)
    
    expect(screen.getByText(/invalid email format/i)).toBeInTheDocument()
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /login/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })
  })

  it('shows loading state during submission', async () => {
    const mockLoginWithLoading = jest.fn()
    jest.mocked(require('../../hooks/useAuth').useAuth).mockReturnValue({
      login: mockLoginWithLoading,
      isLoading: true,
      error: null
    })
    
    render(<LoginForm />)
    
    expect(screen.getByText(/logging in/i)).toBeInTheDocument()
  })

  it('displays error message when login fails', () => {
    jest.mocked(require('../../hooks/useAuth').useAuth).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: 'Invalid credentials'
    })
    
    render(<LoginForm />)
    
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
  })
})
