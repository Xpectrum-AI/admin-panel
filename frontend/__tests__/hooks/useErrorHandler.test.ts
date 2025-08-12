import { renderHook } from '@testing-library/react'
import { useErrorHandler } from '../../hooks/useErrorHandler'

// Mock the ErrorContext
const mockShowError = jest.fn()

jest.mock('../../app/(admin)/contexts/ErrorContext', () => ({
  useError: () => ({
    showError: mockShowError,
  }),
}))

describe('useErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns error handler functions', () => {
    const { result } = renderHook(() => useErrorHandler())

    expect(result.current).toHaveProperty('showError')
    expect(result.current).toHaveProperty('showSuccess')
    expect(result.current).toHaveProperty('showWarning')
    expect(result.current).toHaveProperty('showInfo')
    
    expect(typeof result.current.showError).toBe('function')
    expect(typeof result.current.showSuccess).toBe('function')
    expect(typeof result.current.showWarning).toBe('function')
    expect(typeof result.current.showInfo).toBe('function')
  })

  it('calls showError with correct parameters', () => {
    const { result } = renderHook(() => useErrorHandler())

    result.current.showError('Test error message', 5000)

    expect(mockShowError).toHaveBeenCalledWith('Test error message', 'error', 5000)
  })

  it('calls showSuccess with correct parameters', () => {
    const { result } = renderHook(() => useErrorHandler())

    result.current.showSuccess('Success message', 3000)

    expect(mockShowError).toHaveBeenCalledWith('Success message', 'success', 3000)
  })

  it('calls showWarning with correct parameters', () => {
    const { result } = renderHook(() => useErrorHandler())

    result.current.showWarning('Warning message')

    expect(mockShowError).toHaveBeenCalledWith('Warning message', 'warning', undefined)
  })

  it('calls showInfo with correct parameters', () => {
    const { result } = renderHook(() => useErrorHandler())

    result.current.showInfo('Info message', 2000)

    expect(mockShowError).toHaveBeenCalledWith('Info message', 'info', 2000)
  })

  it('uses default duration when not provided', () => {
    const { result } = renderHook(() => useErrorHandler())

    result.current.showError('Test message')

    expect(mockShowError).toHaveBeenCalledWith('Test message', 'error', undefined)
  })

  it('handles different message types correctly', () => {
    const { result } = renderHook(() => useErrorHandler())

    const testCases = [
      { method: 'showError', type: 'error' },
      { method: 'showSuccess', type: 'success' },
      { method: 'showWarning', type: 'warning' },
      { method: 'showInfo', type: 'info' },
    ]

    testCases.forEach(({ method, type }) => {
      const message = `${type} test message`
      result.current[method as keyof typeof result.current](message)
      
      expect(mockShowError).toHaveBeenCalledWith(message, type, undefined)
    })
  })
})
