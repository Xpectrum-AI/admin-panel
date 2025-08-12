import { createSuccessResponse, createErrorResponse, handleApiError } from '../../lib/utils/apiResponse'

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: () => Promise.resolve(data),
      status: options?.status || 200,
      headers: new Map(),
    })),
  },
}))

describe('API Response Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createSuccessResponse', () => {
    it('creates a success response with default values', () => {
      const response = createSuccessResponse()
      
      expect(response.json()).resolves.toEqual({
        status: 'success',
        message: 'Operation completed successfully',
        data: undefined,
        timestamp: expect.any(String),
      })
    })

    it('creates a success response with custom data and message', () => {
      const testData = { id: 1, name: 'Test' }
      const response = createSuccessResponse(testData, 'Custom message', 201)
      
      expect(response.json()).resolves.toEqual({
        status: 'success',
        message: 'Custom message',
        data: testData,
        timestamp: expect.any(String),
      })
    })
  })

  describe('createErrorResponse', () => {
    it('creates an error response with string error', () => {
      const response = createErrorResponse('Test error message', 400)
      
      expect(response.json()).resolves.toEqual({
        status: 'error',
        error: 'Test error message',
        timestamp: expect.any(String),
      })
    })

    it('creates an error response with Error object', () => {
      const error = new Error('Test error')
      const response = createErrorResponse(error, 500)
      
      expect(response.json()).resolves.toEqual({
        status: 'error',
        error: 'Test error',
        timestamp: expect.any(String),
      })
    })

    it('handles JSON error messages', () => {
      const jsonError = JSON.stringify({ detail: 'Validation failed' })
      const response = createErrorResponse(jsonError, 422)
      
      expect(response.json()).resolves.toEqual({
        status: 'error',
        error: 'Validation failed',
        timestamp: expect.any(String),
      })
    })
  })

  describe('handleApiError', () => {
    it('handles basic errors', () => {
      const error = new Error('Database connection failed')
      const response = handleApiError(error, 'Database')
      
      expect(response.json()).resolves.toEqual({
        status: 'error',
        error: 'Database connection failed',
        timestamp: expect.any(String),
      })
    })

    it('handles validation errors with 400 status', () => {
      const error = new Error('Missing required fields')
      const response = handleApiError(error, 'Validation')
      
      expect(response.json()).resolves.toEqual({
        status: 'error',
        error: 'Missing required fields',
        timestamp: expect.any(String),
      })
    })
  })
})
