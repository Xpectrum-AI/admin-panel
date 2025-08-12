import { GET } from '../../app/api/health/route'
import { NextRequest } from 'next/server'

// Mock the apiResponse utilities
jest.mock('../../lib/utils/apiResponse', () => ({
  createSuccessResponse: jest.fn((data, message) => ({
    json: () => Promise.resolve({ status: 'success', data, message }),
    status: 200,
  })),
  handleApiError: jest.fn((error, context) => ({
    json: () => Promise.resolve({ status: 'error', error: error.message }),
    status: 500,
  })),
}))

describe('Health API', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock process.env
    process.env = { ...originalEnv, NODE_ENV: 'test', PORT: '3001' }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns health status successfully', async () => {
    const { createSuccessResponse } = require('../../lib/utils/apiResponse')
    
    const response = await GET()
    const responseData = await response.json()
    
    expect(createSuccessResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'healthy',
        service: 'admin-panel-frontend',
        version: '1.0.0',
        environment: 'test',
        port: '3001',
        apis: expect.objectContaining({
          agents: '/api/agents',
          health: '/api/health'
        })
      }),
      'Health check completed successfully'
    )
    
    expect(responseData.status).toBe('success')
    expect(responseData.data.status).toBe('healthy')
    expect(responseData.data.service).toBe('admin-panel-frontend')
  })

  it('includes required health check fields', async () => {
    const response = await GET()
    const responseData = await response.json()
    
    expect(responseData.data).toHaveProperty('timestamp')
    expect(responseData.data).toHaveProperty('uptime')
    expect(responseData.data).toHaveProperty('memory')
    expect(responseData.data).toHaveProperty('platform')
    expect(responseData.data).toHaveProperty('nodeVersion')
    expect(responseData.data).toHaveProperty('apis')
  })

  it('handles errors gracefully', async () => {
    const { handleApiError } = require('../../lib/utils/apiResponse')
    
    // Mock createSuccessResponse to throw an error
    const { createSuccessResponse } = require('../../lib/utils/apiResponse')
    createSuccessResponse.mockImplementation(() => {
      throw new Error('Database connection failed')
    })
    
    const response = await GET()
    const responseData = await response.json()
    
    expect(handleApiError).toHaveBeenCalledWith(
      expect.any(Error),
      'Health API'
    )
    expect(responseData.status).toBe('error')
  })
})
