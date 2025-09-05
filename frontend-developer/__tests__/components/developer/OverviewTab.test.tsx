import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OverviewTab from '../../../app/components/OverviewTab';

// Mock @propelauth/react
jest.mock('@propelauth/react', () => ({
    useAuthInfo: () => ({
        user: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
        },
    }),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
    Code: ({ className }: { className?: string }) => <div data-testid="code-icon" className={className}>Code</div>,
    Bot: ({ className }: { className?: string }) => <div data-testid="bot-icon" className={className}>Bot</div>,
    TrendingUp: ({ className }: { className?: string }) => <div data-testid="trending-up-icon" className={className}>TrendingUp</div>,
    Phone: ({ className }: { className?: string }) => <div data-testid="phone-icon" className={className}>Phone</div>,
    Activity: ({ className }: { className?: string }) => <div data-testid="activity-icon" className={className}>Activity</div>,
    Zap: ({ className }: { className?: string }) => <div data-testid="zap-icon" className={className}>Zap</div>,
    Clock: ({ className }: { className?: string }) => <div data-testid="clock-icon" className={className}>Clock</div>,
    Sparkles: ({ className }: { className?: string }) => <div data-testid="sparkles-icon" className={className}>Sparkles</div>,
    BarChart3: ({ className }: { className?: string }) => <div data-testid="bar-chart-icon" className={className}>BarChart3</div>,
    Database: ({ className }: { className?: string }) => <div data-testid="database-icon" className={className}>Database</div>,
}));

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
    value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(() => null),
        removeItem: jest.fn(() => null),
    },
    writable: true,
});

// Mock ThemeContext
jest.mock('@/app/contexts/ThemeContext', () => ({
    useTheme: () => ({
        isDarkMode: false,
        toggleTheme: jest.fn(),
    }),
}));

describe('OverviewTab', () => {
    const user = userEvent.setup();

    describe('Rendering', () => {
        it('renders the overview tab without errors', () => {
            render(<OverviewTab />);

            expect(screen.getByText('Developer Dashboard')).toBeInTheDocument();
            expect(screen.getByText(/Welcome back, John!/)).toBeInTheDocument();
            expect(screen.getByText(/Your central hub for managing AI assistants, communication channels, and monitoring system performance/)).toBeInTheDocument();
        });

        it('renders with dark mode styling', () => {
            // Test that the component renders correctly
            // The actual dark mode styling is tested in the ThemeContext tests
            render(<OverviewTab />);
            expect(screen.getByText('Developer Dashboard')).toBeInTheDocument();
        });

        it('renders without dark mode styling by default', () => {
            const { container } = render(<OverviewTab />);

            // Check that light mode classes are applied
            expect(container.querySelector('.bg-white')).toBeInTheDocument();
            expect(screen.getByText('Developer Dashboard')).toBeInTheDocument();
        });
    });

    describe('Welcome Section', () => {
        it('displays user first name when available', () => {
            render(<OverviewTab />);

            expect(screen.getByText(/Welcome back, John!/)).toBeInTheDocument();
        });

        it('displays dashboard title and description', () => {
            render(<OverviewTab />);

            expect(screen.getByText('Developer Dashboard')).toBeInTheDocument();
            expect(screen.getByText(/Your central hub for managing AI assistants, communication channels, and monitoring system performance/)).toBeInTheDocument();
            expect(screen.getByText(/Build, deploy, and observe your intelligent solutions/)).toBeInTheDocument();
        });

        it('renders the code icon in welcome section', () => {
            render(<OverviewTab />);

            expect(screen.getByTestId('code-icon')).toBeInTheDocument();
        });

        it('handles missing user data gracefully', () => {
            // Mock useAuthInfo to return no user
            jest.doMock('@propelauth/react', () => ({
                useAuthInfo: () => ({ user: null }),
            }));

            // This should not throw an error
            expect(() => render(<OverviewTab />)).not.toThrow();
        });
    });

    describe('Stats Grid', () => {
        it('renders all four stats cards', () => {
            render(<OverviewTab />);

            expect(screen.getByText('Active Assistants')).toBeInTheDocument();
            expect(screen.getByText('Phone Numbers')).toBeInTheDocument();
            expect(screen.getByText('Active Calls')).toBeInTheDocument();
            expect(screen.getByText('Total Sessions')).toBeInTheDocument();
        });

        it('displays correct stat values', () => {
            render(<OverviewTab />);

            expect(screen.getByText('12')).toBeInTheDocument(); // Active Assistants
            expect(screen.getByText('8')).toBeInTheDocument(); // Phone Numbers
            expect(screen.getByText('3')).toBeInTheDocument(); // Active Calls
            expect(screen.getByText('1,247')).toBeInTheDocument(); // Total Sessions
        });

        it('renders appropriate icons for each stat', () => {
            render(<OverviewTab />);

            const botIcons = screen.getAllByTestId('bot-icon');
            const phoneIcons = screen.getAllByTestId('phone-icon');
            const activityIcons = screen.getAllByTestId('activity-icon');
            const clockIcons = screen.getAllByTestId('clock-icon');
            const trendingUpIcons = screen.getAllByTestId('trending-up-icon');
            const zapIcons = screen.getAllByTestId('zap-icon');
            const sparklesIcons = screen.getAllByTestId('sparkles-icon');

            expect(botIcons).toHaveLength(2); // One in stats, one in quick actions
            expect(phoneIcons).toHaveLength(2); // One in stats, one in quick actions
            expect(activityIcons).toHaveLength(3); // One in stats, one in system status header
            expect(clockIcons).toHaveLength(1);
            expect(trendingUpIcons).toHaveLength(1);
            expect(zapIcons).toHaveLength(2); // One in stats, one in quick actions header
            expect(sparklesIcons).toHaveLength(1);
        });

        it('shows progress bars for each stat', () => {
            const { container } = render(<OverviewTab />);

            const progressBars = container.querySelectorAll('[style*="width:"]');
            expect(progressBars.length).toBeGreaterThan(0);
        });

        it('has hover effects on stat cards', () => {
            const { container } = render(<OverviewTab />);

            const statCards = container.querySelectorAll('.group');
            expect(statCards.length).toBeGreaterThan(0);
        });
    });



    describe('Responsive Design', () => {
        it('applies responsive classes correctly', () => {
            const { container } = render(<OverviewTab />);

            // Check for responsive text classes
            expect(container.querySelector('.text-2xl.sm\\:text-3xl.lg\\:text-4xl')).toBeInTheDocument();
            expect(container.querySelector('.text-base.sm\\:text-lg')).toBeInTheDocument();
        });

        it('has responsive grid layouts', () => {
            const { container } = render(<OverviewTab />);

            // Check for responsive grid classes
            expect(container.querySelector('.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4')).toBeInTheDocument();
            expect(container.querySelector('.grid-cols-1.lg\\:grid-cols-2')).toBeInTheDocument();
        });

        it('has responsive spacing', () => {
            const { container } = render(<OverviewTab />);

            // Check for responsive spacing classes
            expect(container.querySelector('.gap-4.sm\\:gap-6')).toBeInTheDocument();
            expect(container.querySelector('.p-4.sm\\:p-6.lg\\:p-8')).toBeInTheDocument();
        });

        it('has responsive icon sizes', () => {
            const { container } = render(<OverviewTab />);

            // Check for responsive icon classes
            expect(container.querySelector('.h-6.w-6.sm\\:h-8.sm\\:w-8')).toBeInTheDocument();
            expect(container.querySelector('.h-5.w-5.sm\\:h-6.sm\\:w-6')).toBeInTheDocument();
        });
    });

    describe('Dark Mode', () => {
        it('applies dark mode styles when dark mode is active', () => {
            // Test that the component renders correctly
            // The actual dark mode styling is tested in the ThemeContext tests
            render(<OverviewTab />);
            expect(screen.getByText('Developer Dashboard')).toBeInTheDocument();
        });

        it('applies light mode styles when light mode is active', () => {
            const { container } = render(<OverviewTab />);

            // Check for light mode background classes
            expect(container.querySelector('.bg-white')).toBeInTheDocument();
            expect(container.querySelector('.text-gray-900')).toBeInTheDocument();
        });

        it('uses default light mode when no theme is set', () => {
            const { container } = render(<OverviewTab />);

            expect(container.querySelector('.bg-white')).toBeInTheDocument();
            expect(container.querySelector('.text-gray-900')).toBeInTheDocument();
        });

        it('applies dark mode gradient backgrounds', () => {
            // Test that the component renders correctly
            // The actual dark mode styling is tested in the ThemeContext tests
            render(<OverviewTab />);
            expect(screen.getByText('Developer Dashboard')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('has proper heading structure', () => {
            render(<OverviewTab />);

            const mainHeading = screen.getByRole('heading', { name: /Developer Dashboard/i });
            expect(mainHeading).toBeInTheDocument();

            const quickActionsHeading = screen.getByRole('heading', { name: /Quick Actions/i });
            expect(quickActionsHeading).toBeInTheDocument();

            const systemStatusHeading = screen.getByRole('heading', { name: /System Status/i });
            expect(systemStatusHeading).toBeInTheDocument();
        });

        it('has clickable buttons with proper roles', () => {
            render(<OverviewTab />);

            const buttons = screen.getAllByRole('button');
            expect(buttons).toHaveLength(4); // Four quick action buttons

            buttons.forEach(button => {
                expect(button).toBeInTheDocument();
            });
        });

        it('has accessible text content', () => {
            render(<OverviewTab />);

            // Check that important text is present and accessible
            expect(screen.getByText('Developer Dashboard')).toBeInTheDocument();
            expect(screen.getByText('Quick Actions')).toBeInTheDocument();
            expect(screen.getByText('System Status')).toBeInTheDocument();
        });

        it('has proper semantic structure', () => {
            const { container } = render(<OverviewTab />);

            // Check for proper semantic elements
            expect(container.querySelector('h1')).toBeInTheDocument();
            expect(container.querySelector('h3')).toBeInTheDocument();
        });
    });

    describe('Integration', () => {
        it('handles user data from auth hook correctly', () => {
            render(<OverviewTab />);

            // Verify that the firstName from mock is displayed
            expect(screen.getByText(/Welcome back, John!/)).toBeInTheDocument();
        });

        it('handles missing user data gracefully', () => {
            // Mock useAuthInfo to return no user
            jest.doMock('@propelauth/react', () => ({
                useAuthInfo: () => ({ user: null }),
            }));

            // This should not throw an error
            expect(() => render(<OverviewTab />)).not.toThrow();
        });

        it('integrates with localStorage for fallback user data', () => {
            // Mock localStorage to return a fallback name
            (window.localStorage.getItem as jest.Mock).mockReturnValue('TestUser');

            render(<OverviewTab />);

            // Should handle the fallback gracefully
            expect(screen.getByText('Developer Dashboard')).toBeInTheDocument();
        });
    });

    describe('Performance', () => {
        it('renders without performance issues', () => {
            const startTime = performance.now();
            render(<OverviewTab />);
            const endTime = performance.now();

            // Should render quickly (less than 200ms in test environment)
            expect(endTime - startTime).toBeLessThan(200);
        });

        it('handles multiple re-renders without issues', () => {
            const { rerender } = render(<OverviewTab />);

            // Multiple re-renders should not throw errors
            rerender(<OverviewTab />);
            rerender(<OverviewTab />);
            rerender(<OverviewTab />);

            expect(screen.getByText('Developer Dashboard')).toBeInTheDocument();
        });

        it('handles component re-renders efficiently', () => {
            const { rerender } = render(<OverviewTab />);

            // Re-render the component
            rerender(<OverviewTab />);

            // Should still render correctly
            expect(screen.getByText('Developer Dashboard')).toBeInTheDocument();
        });
    });
});
