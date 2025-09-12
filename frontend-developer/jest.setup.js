import '@testing-library/jest-dom'

// Set up environment variables for tests
process.env.NEXT_PUBLIC_PROPELAUTH_URL = 'https://test.propelauth.com'
process.env.NEXT_PUBLIC_LIVE_API_KEY = 'test-api-key'

// Suppress console errors during tests
const originalError = console.error
const originalWarn = console.warn
const originalLog = console.log

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    // Suppress specific expected errors
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('NEXT_PUBLIC_PROPELAUTH_URL is not set') ||
       args[0].includes('An update to') ||
       args[0].includes('Warning:') ||
       args[0].includes('act('))
    ) {
      return // Suppress expected test errors
    }
    originalError.call(console, ...args)
  })

  jest.spyOn(console, 'warn').mockImplementation((...args) => {
    // Suppress specific expected warnings
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') ||
       args[0].includes('act(') ||
       args[0].includes('An update to'))
    ) {
      return // Suppress expected test warnings
    }
    originalWarn.call(console, ...args)
  })

  // Suppress debug logs during tests
  jest.spyOn(console, 'log').mockImplementation((...args) => {
    // Only suppress specific debug logs
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('🔄') ||
       args[0].includes('🔍') ||
       args[0].includes('🚀') ||
       args[0].includes('✅') ||
       args[0].includes('⚠️') ||
       args[0].includes('📊') ||
       args[0].includes('🏁') ||
       args[0].includes('=== ToolsConfig Debug Info ===') ||
       args[0].includes('=== End Debug Info ===') ||
       args[0].includes('Final voice config found') ||
       args[0].includes('Final model config found') ||
       args[0].includes('Final transcriber config found'))
    ) {
      return // Suppress debug logs
    }
    originalLog.call(console, ...args)
  })
})

afterEach(() => {
  jest.restoreAllMocks()
})

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock PropelAuth
jest.mock('@propelauth/react', () => ({
  useAuthInfo: () => ({
    user: {
      userId: 'test-user-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    },
    isLoggedIn: true,
    loading: false,
  }),
  useLogoutFunction: () => jest.fn(),
  useRedirectFunctions: () => ({
    redirectToLoginPage: jest.fn(),
    redirectToSignupPage: jest.fn(),
  }),
}))

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock fetch globally with proper error handling
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true, data: [] }),
    text: () => Promise.resolve(''),
    headers: new Headers(),
    statusText: 'OK',
  })
)

// Mock Headers
global.Headers = jest.fn().mockImplementation(() => ({
  get: jest.fn(),
  set: jest.fn(),
  has: jest.fn(),
  delete: jest.fn(),
  forEach: jest.fn(),
}))

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
  // Restore console methods
  console.error = originalError
  console.warn = originalWarn
  console.log = originalLog
})
