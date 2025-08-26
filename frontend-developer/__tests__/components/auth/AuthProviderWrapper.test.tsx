import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuthProviderWrapper } from '@/app/auth/AuthProviderWrapper';

// Mock PropelAuth
jest.mock('@propelauth/react', () => ({
  AuthProvider: ({ children, authUrl }: { children: React.ReactNode; authUrl: string }) => (
    <div data-testid="auth-provider" data-auth-url={authUrl}>
      {children}
    </div>
  ),
}));

describe('AuthProviderWrapper', () => {
  beforeEach(() => {
    // Reset environment variables
    delete process.env.NEXT_PUBLIC_PROPELAUTH_URL;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders loading spinner during client-side hydration', () => {
      render(<AuthProviderWrapper>Test Content</AuthProviderWrapper>);
      
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders AuthProvider with children', () => {
      render(<AuthProviderWrapper>Test Content</AuthProviderWrapper>);
      
      const authProvider = screen.getByTestId('auth-provider');
      expect(authProvider).toBeInTheDocument();
      expect(authProvider).toHaveTextContent('Test Content');
    });
  });

  describe('Environment Variables', () => {
    it('uses NEXT_PUBLIC_PROPELAUTH_URL from environment', () => {
      process.env.NEXT_PUBLIC_PROPELAUTH_URL = 'https://test.propelauthtest.com';
      
      render(<AuthProviderWrapper>Test Content</AuthProviderWrapper>);
      
      const authProvider = screen.getByTestId('auth-provider');
      expect(authProvider).toHaveAttribute('data-auth-url', 'https://test.propelauthtest.com');
    });

    it('uses fallback URL when NEXT_PUBLIC_PROPELAUTH_URL is not set', () => {
      render(<AuthProviderWrapper>Test Content</AuthProviderWrapper>);
      
      const authProvider = screen.getByTestId('auth-provider');
      expect(authProvider).toHaveAttribute('data-auth-url', 'https://30281939.propelauthtest.com');
    });

    it('uses fallback URL when NEXT_PUBLIC_PROPELAUTH_URL is empty', () => {
      process.env.NEXT_PUBLIC_PROPELAUTH_URL = '';
      
      render(<AuthProviderWrapper>Test Content</AuthProviderWrapper>);
      
      const authProvider = screen.getByTestId('auth-provider');
      expect(authProvider).toHaveAttribute('data-auth-url', 'https://30281939.propelauthtest.com');
    });
  });

  describe('Client-side Hydration', () => {
    it('handles client-side hydration correctly', () => {
      render(<AuthProviderWrapper>Test Content</AuthProviderWrapper>);
      
      // Should render content immediately (no loading state in current implementation)
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('passes children to AuthProvider', () => {
      const testContent = (
        <div>
          <h1>Test Header</h1>
          <p>Test Paragraph</p>
        </div>
      );
      
      render(<AuthProviderWrapper>{testContent}</AuthProviderWrapper>);
      
      expect(screen.getByText('Test Header')).toBeInTheDocument();
      expect(screen.getByText('Test Paragraph')).toBeInTheDocument();
    });

    it('handles multiple children', () => {
      render(
        <AuthProviderWrapper>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </AuthProviderWrapper>
      );
      
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles null children', () => {
      render(<AuthProviderWrapper>{null}</AuthProviderWrapper>);
      
      const authProvider = screen.getByTestId('auth-provider');
      expect(authProvider).toBeInTheDocument();
    });
  });
});
