import { doctorController } from '../../lib/controllers/doctorController'

// Mock fetch globally
global.fetch = jest.fn()

describe('doctorController', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset environment variables
    process.env = { 
      ...originalEnv, 
      NEXT_PUBLIC_LIVE_API_URL: 'https://test-api.example.com',
      NEXT_PUBLIC_API_KEY: 'test-api-key'
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('createDoctor', () => {
    const validDoctorData = {
      doctor_id: 'DOC001',
      first_name: 'John',
      last_name: 'Doe',
      organization_id: 'ORG001',
      doctor_data: {
        phone: '+1234567890',
        specializations: ['Cardiology']
      }
    }

    it('creates a doctor successfully', async () => {
      const mockResponse = { id: '1', ...validDoctorData }
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await doctorController.createDoctor(validDoctorData)

      expect(fetch).toHaveBeenCalledWith(
        'https://d1fs86umxjjz67.cloudfront.net/doctor/create',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'xpectrum-ai@123'
          },
          body: JSON.stringify(validDoctorData)
        }
      )

      expect(result).toEqual({
        status: 'success',
        message: 'Doctor created successfully',
        data: mockResponse
      })
    })

    it('throws error for missing required fields', async () => {
      const invalidData = {
        doctor_id: '',
        first_name: '',
        last_name: '',
        organization_id: ''
      }

      await expect(doctorController.createDoctor(invalidData as any))
        .rejects.toThrow('Missing required fields: doctor_id, first_name, last_name, organization_id')
    })

    it('throws error for short doctor_id', async () => {
      const invalidData = { ...validDoctorData, doctor_id: 'AB' }

      await expect(doctorController.createDoctor(invalidData))
        .rejects.toThrow('Doctor ID must be at least 3 characters long')
    })

    it('throws error for short first name', async () => {
      const invalidData = { ...validDoctorData, first_name: 'A' }

      await expect(doctorController.createDoctor(invalidData))
        .rejects.toThrow('First name must be at least 2 characters long')
    })

    it('throws error for short last name', async () => {
      const invalidData = { ...validDoctorData, last_name: 'B' }

      await expect(doctorController.createDoctor(invalidData))
        .rejects.toThrow('Last name must be at least 2 characters long')
    })

    it('handles API error response', async () => {
      const errorResponse = { detail: 'Doctor already exists' }
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Conflict',
        json: async () => errorResponse
      })

      await expect(doctorController.createDoctor(validDoctorData))
        .rejects.toThrow('Doctor already exists')
    })
  })

  describe('getDoctor', () => {
    it('retrieves a doctor successfully', async () => {
      const mockDoctor = {
        _id: '1',
        doctor_id: 'DOC001',
        first_name: 'John',
        last_name: 'Doe'
      }
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDoctor
      })

      const result = await doctorController.getDoctor('DOC001')

      expect(fetch).toHaveBeenCalledWith(
        'https://d1fs86umxjjz67.cloudfront.net/doctor/DOC001',
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'xpectrum-ai@123'
          }
        }
      )

      expect(result).toEqual({
        status: 'success',
        message: 'Doctor retrieved successfully',
        data: mockDoctor
      })
    })

    it('throws error for empty doctor ID', async () => {
      await expect(doctorController.getDoctor(''))
        .rejects.toThrow('Doctor ID is required')
    })

    it('throws error for whitespace doctor ID', async () => {
      await expect(doctorController.getDoctor('   '))
        .rejects.toThrow('Doctor ID is required')
    })
  })

  describe('updateDoctor', () => {
    const validUpdateData = {
      first_name: 'Jane',
      last_name: 'Smith'
    }

    it('updates a doctor successfully', async () => {
      const mockResponse = { id: '1', ...validUpdateData }
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await doctorController.updateDoctor('DOC001', validUpdateData)

      expect(fetch).toHaveBeenCalledWith(
        'https://d1fs86umxjjz67.cloudfront.net/doctor/DOC001',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'xpectrum-ai@123'
          },
          body: JSON.stringify(validUpdateData)
        }
      )

      expect(result).toEqual({
        status: 'success',
        message: 'Doctor updated successfully',
        data: mockResponse
      })
    })

    it('throws error for empty doctor ID', async () => {
      await expect(doctorController.updateDoctor('', validUpdateData))
        .rejects.toThrow('Doctor ID is required')
    })

    it('throws error when no update fields provided', async () => {
      await expect(doctorController.updateDoctor('DOC001', {}))
        .rejects.toThrow('At least one field must be provided for update')
    })

    it('throws error for short first name in update', async () => {
      const invalidData = { first_name: 'A' }

      await expect(doctorController.updateDoctor('DOC001', invalidData))
        .rejects.toThrow('First name must be at least 2 characters long')
    })

    it('throws error for short last name in update', async () => {
      const invalidData = { last_name: 'B' }

      await expect(doctorController.updateDoctor('DOC001', invalidData))
        .rejects.toThrow('Last name must be at least 2 characters long')
    })
  })

  describe('patchDoctor', () => {
    const validPatchData = {
      first_name: 'Jane'
    }

    it('patches a doctor successfully', async () => {
      const mockResponse = { id: '1', ...validPatchData }
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await doctorController.patchDoctor('DOC001', validPatchData)

      expect(fetch).toHaveBeenCalledWith(
        'https://d1fs86umxjjz67.cloudfront.net/doctor/DOC001',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'xpectrum-ai@123'
          },
          body: JSON.stringify(validPatchData)
        }
      )

      expect(result).toEqual({
        status: 'success',
        message: 'Doctor patched successfully',
        data: mockResponse
      })
    })

    it('throws error for empty doctor ID', async () => {
      await expect(doctorController.patchDoctor('', validPatchData))
        .rejects.toThrow('Doctor ID is required')
    })

    it('throws error when no patch fields provided', async () => {
      await expect(doctorController.patchDoctor('DOC001', {}))
        .rejects.toThrow('At least one field must be provided for update')
    })
  })

  describe('getDoctorsByOrg', () => {
    it('retrieves doctors by organization successfully', async () => {
      const mockDoctors = [
        { _id: '1', doctor_id: 'DOC001', first_name: 'John', last_name: 'Doe' },
        { _id: '2', doctor_id: 'DOC002', first_name: 'Jane', last_name: 'Smith' }
      ]
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDoctors
      })

      const result = await doctorController.getDoctorsByOrg('ORG001')

      expect(fetch).toHaveBeenCalledWith(
        'https://d1fs86umxjjz67.cloudfront.net/doctor/organization/ORG001',
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'xpectrum-ai@123'
          }
        }
      )

      expect(result).toEqual({
        status: 'success',
        message: 'Organization doctors retrieved successfully',
        data: mockDoctors
      })
    })

    it('throws error for empty organization ID', async () => {
      await expect(doctorController.getDoctorsByOrg(''))
        .rejects.toThrow('Organization ID is required')
    })
  })

  describe('deleteDoctor', () => {
    it('deletes a doctor successfully', async () => {
      const mockResponse = { message: 'Doctor deleted successfully' }
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await doctorController.deleteDoctor('DOC001')

      expect(fetch).toHaveBeenCalledWith(
        'https://d1fs86umxjjz67.cloudfront.net/doctor/DOC001',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'xpectrum-ai@123'
          }
        }
      )

      expect(result).toEqual({
        status: 'success',
        message: 'Doctor deleted successfully',
        data: mockResponse
      })
    })

    it('throws error for empty doctor ID', async () => {
      await expect(doctorController.deleteDoctor(''))
        .rejects.toThrow('Doctor ID is required')
    })
  })
})
