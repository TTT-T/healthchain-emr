import { render, screen } from '@ing-library/react'
import { Sidebar } from '../Sidebar'

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
    isAuthenticated: true
  })
}))

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/dashboard'
  }),
  usePathname: () => '/dashboard'
}))

describe('Sidebar Component', () => {
  it('renders sidebar navigation items', () => {
    render(<Sidebar />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Medical Records')).toBeInTheDocument()
    expect(screen.getByText('Appointments')).toBeInTheDocument()
  })

  it('highlights active navigation item', () => {
    render(<Sidebar />)
    
    const dashboardLink = screen.getByText('Dashboard').closest('a')
    expect(dashboardLink).toHaveClass('bg-blue-100')
  })

  it('renders user profile section', () => {
    render(<Sidebar />)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Patient')).toBeInTheDocument()
  })
})
