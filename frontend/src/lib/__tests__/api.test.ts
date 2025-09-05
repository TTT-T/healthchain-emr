import { apiClient } from '../api'

// Mock axios
const mockAxios = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
}

jest.mock('axios', () => ({
  create: () => mockAxios,
}))

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authentication', () => {
    it('should login user successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            user: { id: '1', email: 'test@example.com' },
            tokens: { accessToken: 'token123' }
          }
        }
      }
      mockAxios.post.mockResolvedValue(mockResponse)

      const result = await apiClient.auth.login({
        email: 'test@example.com',
        password: 'password123'
      })

      expect(mockAxios.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle login error', async () => {
      const mockError = {
        response: {
          data: { message: 'Invalid credentials' }
        }
      }
      mockAxios.post.mockRejectedValue(mockError)

      await expect(apiClient.auth.login({
        email: 'test@example.com',
        password: 'wrongpassword'
      })).rejects.toThrow('Invalid credentials')
    })
  })

  describe('Patient Management', () => {
    it('should fetch patient data', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com'
          }
        }
      }
      mockAxios.get.mockResolvedValue(mockResponse)

      const result = await apiClient.patients.getPatient('1')

      expect(mockAxios.get).toHaveBeenCalledWith('/patients/1')
      expect(result).toEqual(mockResponse.data)
    })

    it('should update patient data', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { id: '1', firstName: 'Jane' }
        }
      }
      mockAxios.put.mockResolvedValue(mockResponse)

      const result = await apiClient.patients.updatePatient('1', {
        firstName: 'Jane'
      })

      expect(mockAxios.put).toHaveBeenCalledWith('/patients/1', {
        firstName: 'Jane'
      })
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('Medical Records', () => {
    it('should fetch medical records', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            { id: '1', diagnosis: 'Hypertension', date: '2024-01-01' }
          ]
        }
      }
      mockAxios.get.mockResolvedValue(mockResponse)

      const result = await apiClient.medical.getMedicalRecords('1')

      expect(mockAxios.get).toHaveBeenCalledWith('/medical/records/1')
      expect(result).toEqual(mockResponse.data)
    })

    it('should create new medical record', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { id: '2', diagnosis: 'Diabetes' }
        }
      }
      mockAxios.post.mockResolvedValue(mockResponse)

      const result = await apiClient.medical.createMedicalRecord({
        patientId: '1',
        diagnosis: 'Diabetes',
        notes: 'Type 2 diabetes'
      })

      expect(mockAxios.post).toHaveBeenCalledWith('/medical/records', {
        patientId: '1',
        diagnosis: 'Diabetes',
        notes: 'Type 2 diabetes'
      })
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockAxios.get.mockRejectedValue(new Error('Network Error'))

      await expect(apiClient.patients.getPatient('1'))
        .rejects.toThrow('Network Error')
    })

    it('should handle 401 unauthorized errors', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        }
      }
      mockAxios.get.mockRejectedValue(mockError)

      await expect(apiClient.patients.getPatient('1'))
        .rejects.toThrow('Unauthorized')
    })
  })
})
