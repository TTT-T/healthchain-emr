import { render, screen, waitFor } from '@ing-library/react'
import userEvent from '@ing-library/user-event'
import { AppLayout } from '../../components/AppLayout'
import { useAuth } from '../../hooks/useAuth'

// Mock all the necessary hooks and services
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      email: 'patient@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'patient'
    },
    isAuthenticated: true,
    logout: jest.fn()
  })
}))

jest.mock('../../lib/api', () => ({
  apiClient: {
    patients: {
      getPatient: jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'patient@example.com',
          dateOfBirth: '1990-01-01',
          phone: '123-456-7890'
        }
      }),
      updatePatient: jest.fn().mockResolvedValue({
        success: true,
        data: { id: '1', firstName: 'John' }
      })
    },
    medical: {
      getMedicalRecords: jest.fn().mockResolvedValue({
        success: true,
        data: [
          {
            id: '1',
            diagnosis: 'Hypertension',
            date: '2024-01-01',
            notes: 'High blood pressure'
          }
        ]
      })
    },
    appointments: {
      getAppointments: jest.fn().mockResolvedValue({
        success: true,
        data: [
          {
            id: '1',
            date: '2024-01-15',
            time: '10:00',
            doctor: 'Dr. Smith',
            status: 'scheduled'
          }
        ]
      })
    }
  }
}))

describe('Patient Workflow E2E s', () => {
  it('should complete patient profile update workflow', async () => {
    const user = userEvent.setup()
    render(<AppLayout />)

    // Navigate to profile page
    const profileLink = screen.getByText('Profile')
    await user.click(profileLink)

    // Wait for profile data to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    })

    // Update profile information
    const firstNameInput = screen.getByDisplayValue('John')
    await user.clear(firstNameInput)
    await user.type(firstNameInput, 'Johnny')

    const saveButton = screen.getByText('Save Changes')
    await user.click(saveButton)

    // Verify success message
    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully')).toBeInTheDocument()
    })
  })

  it('should complete medical records viewing workflow', async () => {
    const user = userEvent.setup()
    render(<AppLayout />)

    // Navigate to medical records
    const medicalRecordsLink = screen.getByText('Medical Records')
    await user.click(medicalRecordsLink)

    // Wait for medical records to load
    await waitFor(() => {
      expect(screen.getByText('Hypertension')).toBeInTheDocument()
    })

    // Verify medical record details
    expect(screen.getByText('High blood pressure')).toBeInTheDocument()
    expect(screen.getByText('2024-01-01')).toBeInTheDocument()
  })

  it('should complete appointment scheduling workflow', async () => {
    const user = userEvent.setup()
    render(<AppLayout />)

    // Navigate to appointments
    const appointmentsLink = screen.getByText('Appointments')
    await user.click(appointmentsLink)

    // Wait for appointments to load
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument()
    })

    // Verify appointment details
    expect(screen.getByText('2024-01-15')).toBeInTheDocument()
    expect(screen.getByText('10:00')).toBeInTheDocument()
    expect(screen.getByText('scheduled')).toBeInTheDocument()
  })

  it('should handle authentication flow', async () => {
    // const user = userEvent.setup()
    
    // Mock unauthenticated state
    jest.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: jest.fn()
    })

    render(<AppLayout />)

    // Should redirect to login
    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Password')).toBeInTheDocument()
  })
})
