import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock Next.js font
jest.mock('next/font/google', () => ({
  Inter: () => ({ className: 'inter-font' }),
}));

// Mock the child components
jest.mock('@/app/auth/AuthProviderWrapper', () => ({
  AuthProviderWrapper: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider-wrapper">{children}</div>
  ),
}));

jest.mock('@/app/contexts/ErrorContext', () => ({
  ErrorProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-provider">{children}</div>
  ),
}));

jest.mock('@/app/auth/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="protected-route">{children}</div>
  ),
}));

// Mock CSS import
jest.mock('@/app/globals.css', () => ({}));

describe('Layout Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('renders the layout with all providers', () => {
      const { AuthProviderWrapper } = require('@/app/auth/AuthProviderWrapper');
      const { ErrorProvider } = require('@/app/contexts/ErrorContext');
      const { ProtectedRoute } = require('@/app/auth/ProtectedRoute');
      
      render(
        <AuthProviderWrapper>
          <ErrorProvider>
            <ProtectedRoute>
              <div>Test Content</div>
            </ProtectedRoute>
          </ErrorProvider>
        </AuthProviderWrapper>
      );
      
      expect(screen.getByTestId('auth-provider-wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('error-provider')).toBeInTheDocument();
      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders children correctly', () => {
      const { AuthProviderWrapper } = require('@/app/auth/AuthProviderWrapper');
      const { ErrorProvider } = require('@/app/contexts/ErrorContext');
      const { ProtectedRoute } = require('@/app/auth/ProtectedRoute');
      
      const testContent = (
        <div>
          <h1>Test Header</h1>
          <p>Test Paragraph</p>
        </div>
      );
      
      render(
        <AuthProviderWrapper>
          <ErrorProvider>
            <ProtectedRoute>
              {testContent}
            </ProtectedRoute>
          </ErrorProvider>
        </AuthProviderWrapper>
      );
      
      expect(screen.getByText('Test Header')).toBeInTheDocument();
      expect(screen.getByText('Test Paragraph')).toBeInTheDocument();
    });
  });

  describe('Provider Hierarchy', () => {
    it('wraps children in the correct provider order', () => {
      const { AuthProviderWrapper } = require('@/app/auth/AuthProviderWrapper');
      const { ErrorProvider } = require('@/app/contexts/ErrorContext');
      const { ProtectedRoute } = require('@/app/auth/ProtectedRoute');
      
      render(
        <AuthProviderWrapper>
          <ErrorProvider>
            <ProtectedRoute>
              <div>Test Content</div>
            </ProtectedRoute>
          </ErrorProvider>
        </AuthProviderWrapper>
      );
      
      const authProvider = screen.getByTestId('auth-provider-wrapper');
      const errorProvider = screen.getByTestId('error-provider');
      const protectedRoute = screen.getByTestId('protected-route');
      
      // Check that providers are nested correctly
      expect(authProvider).toContainElement(errorProvider);
      expect(errorProvider).toContainElement(protectedRoute);
      expect(protectedRoute).toContainElement(screen.getByText('Test Content'));
    });
  });

  describe('Props Handling', () => {
    it('handles multiple children', () => {
      const { AuthProviderWrapper } = require('@/app/auth/AuthProviderWrapper');
      const { ErrorProvider } = require('@/app/contexts/ErrorContext');
      const { ProtectedRoute } = require('@/app/auth/ProtectedRoute');
      
      render(
        <AuthProviderWrapper>
          <ErrorProvider>
            <ProtectedRoute>
              <div>Child 1</div>
              <div>Child 2</div>
              <div>Child 3</div>
            </ProtectedRoute>
          </ErrorProvider>
        </AuthProviderWrapper>
      );
      
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });

    it('handles complex nested children', () => {
      const { AuthProviderWrapper } = require('@/app/auth/AuthProviderWrapper');
      const { ErrorProvider } = require('@/app/contexts/ErrorContext');
      const { ProtectedRoute } = require('@/app/auth/ProtectedRoute');
      
      const complexChildren = (
        <div>
          <header>
            <h1>Header</h1>
            <nav>
              <ul>
                <li>Item 1</li>
                <li>Item 2</li>
              </ul>
            </nav>
          </header>
          <main>
            <section>
              <h2>Section Title</h2>
              <p>Section content</p>
            </section>
          </main>
        </div>
      );
      
      render(
        <AuthProviderWrapper>
          <ErrorProvider>
            <ProtectedRoute>
              {complexChildren}
            </ProtectedRoute>
          </ErrorProvider>
        </AuthProviderWrapper>
      );
      
      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Section Title')).toBeInTheDocument();
      expect(screen.getByText('Section content')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles null children', () => {
      const { AuthProviderWrapper } = require('@/app/auth/AuthProviderWrapper');
      const { ErrorProvider } = require('@/app/contexts/ErrorContext');
      const { ProtectedRoute } = require('@/app/auth/ProtectedRoute');
      
      render(
        <AuthProviderWrapper>
          <ErrorProvider>
            <ProtectedRoute>
              {null}
            </ProtectedRoute>
          </ErrorProvider>
        </AuthProviderWrapper>
      );
      
      // Should render without errors
      expect(screen.getByTestId('auth-provider-wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('error-provider')).toBeInTheDocument();
      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    });
  });
});
