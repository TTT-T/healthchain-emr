import { render, screen } from '@ing-library/react'
import { Header } from '../Header'

// Mock the useAuth hook
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      email: '@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'patient'
    },
    logout: jest.fn(),
    isAuthenticated: true
  })
}))

describe('Header Component', () => {
  it('renders header with user information', () => {
    render(<Header />)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('@example.com')).toBeInTheDocument()
  })

  it('renders logout button when authenticated', () => {
    render(<Header />)
    
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('displays correct role badge', () => {
    render(<Header />)
    
    expect(screen.getByText('Patient')).toBeInTheDocument()
  })
})
