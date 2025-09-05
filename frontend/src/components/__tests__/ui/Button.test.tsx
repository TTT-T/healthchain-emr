import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../ui/Button'

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies variant styles correctly', () => {
    render(<Button variant="destructive">Delete</Button>)
    
    const button = screen.getByText('Delete')
    expect(button).toHaveClass('bg-red-600')
  })

  it('applies size styles correctly', () => {
    render(<Button size="lg">Large Button</Button>)
    
    const button = screen.getByText('Large Button')
    expect(button).toHaveClass('h-11')
  })

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>)
    
    const button = screen.getByText('Disabled Button')
    expect(button).toBeDisabled()
  })

  it('shows loading state', () => {
    render(<Button loading>Loading Button</Button>)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})
