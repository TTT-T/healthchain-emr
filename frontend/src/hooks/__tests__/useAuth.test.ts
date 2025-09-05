import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../useAuth'

// Mock the AuthContext
const mockLogin = jest.fn()
const mockLogout = jest.fn()
const mockRegister = jest.fn()

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'patient'
    },
    isAuthenticated: true,
    isLoading: false,
    error: null,
    login: mockLogin,
    logout: mockLogout,
    register: mockRegister
  })
}))

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return user data when authenticated', () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toEqual({
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'patient'
    })
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should call login function', async () => {
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    expect(mockLogin).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    })
  })

  it('should call logout function', async () => {
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.logout()
    })

    expect(mockLogout).toHaveBeenCalled()
  })

  it('should call register function', async () => {
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.register({
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith'
      })
    })

    expect(mockRegister).toHaveBeenCalledWith({
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Smith'
    })
  })

  it('should handle loading state', () => {
    jest.mocked(require('../../contexts/AuthContext').useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      login: mockLogin,
      logout: mockLogout,
      register: mockRegister
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should handle error state', () => {
    jest.mocked(require('../../contexts/AuthContext').useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: 'Login failed',
      login: mockLogin,
      logout: mockLogout,
      register: mockRegister
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.error).toBe('Login failed')
    expect(result.current.isAuthenticated).toBe(false)
  })
})
