import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '../../app/contexts/ThemeContext';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock PropelAuth
jest.mock('@propelauth/react', () => ({
  useAuthInfo: () => ({
    loading: false,
    user: {
      userId: 'test-user-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    },
    isLoggedIn: true,
  }),
  useLogoutFunction: () => jest.fn(),
  AuthProviderWrapper: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock react-spinners
jest.mock('react-spinners', () => ({
  SyncLoader: () => <div data-testid="sync-loader">Loading...</div>,
}));

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Add a simple test to prevent "no tests" error
describe('test-utils', () => {
  it('should export custom render function', () => {
    expect(typeof customRender).toBe('function');
  });
});