import '@testing-library/jest-dom'

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

// Suppress console.error during tests
const originalError = console.error
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Error in Database:') ||
       args[0].includes('Error in Validation:'))
    ) {
      return // Suppress expected test errors
    }
    originalError.call(console, ...args)
  })
})

afterEach(() => {
  jest.restoreAllMocks()
})
