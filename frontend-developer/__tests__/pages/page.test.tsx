import React from 'react';
import { render } from '../utils/test-utils';
import Home from '@/app/page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Simple test to prevent "no tests" error
describe('Home Page', () => {
  it('should render without crashing', () => {
    // Just test that it renders without throwing
    expect(() => render(<Home />)).not.toThrow();
  });
});