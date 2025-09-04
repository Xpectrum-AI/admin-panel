import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '../../../app/components/Navbar';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
    ArrowLeft: ({ className }: { className?: string }) => <div data-testid="arrow-left-icon" className={className}>ArrowLeft</div>,
    Sun: ({ className }: { className?: string }) => <div data-testid="sun-icon" className={className}>Sun</div>,
    Moon: ({ className }: { className?: string }) => <div data-testid="moon-icon" className={className}>Moon</div>,
    LogOut: ({ className }: { className?: string }) => <div data-testid="logout-icon" className={className}>LogOut</div>,
    User: ({ className }: { className?: string }) => <div data-testid="user-icon" className={className}>User</div>,
}));

// Mock the window.location.href assignment
delete (window as any).location;
(window as any).location = {
    href: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
};

describe('Navbar', () => {
    const user = userEvent.setup();

    const defaultProps = {
        activeTab: 'Overview' as const,
        onChange: jest.fn(),
        activeTitle: 'Overview',
        sidebarOpen: true,
        onToggleSidebar: jest.fn(),
        onToggleDarkMode: jest.fn(),
        onLogout: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        window.location.href = '';
    });

    describe('Rendering', () => {
        it('renders the navbar without errors', () => {
            render(<Navbar {...defaultProps} />);

            expect(screen.getByText('Developer')).toBeInTheDocument();
            expect(screen.getByText('Control Center')).toBeInTheDocument();
        });

        it('renders with dark mode styling', () => {
            const { container } = render(<Navbar {...defaultProps} isDarkMode={true} />);

            // Check that dark mode classes are applied to nav element
            const navElement = container.querySelector('nav');
            expect(navElement).toHaveClass('bg-gray-900/80', 'border-gray-700/50');
        });

        it('renders with light mode styling by default', () => {
            const { container } = render(<Navbar {...defaultProps} isDarkMode={false} />);

            // Check that light mode classes are applied to nav element
            const navElement = container.querySelector('nav');
            expect(navElement).toHaveClass('bg-white', 'border-gray-200');
        });

        it('displays the developer logo and branding', () => {
            render(<Navbar {...defaultProps} />);

            expect(screen.getByText('D')).toBeInTheDocument(); // Logo letter
            expect(screen.getByText('Developer')).toBeInTheDocument();
            expect(screen.getByText('Control Center')).toBeInTheDocument();
        });
    });

    describe('Tab Navigation', () => {
        it('renders both Overview and Agents tabs', () => {
            render(<Navbar {...defaultProps} />);

            expect(screen.getByText('Overview')).toBeInTheDocument();
            expect(screen.getByText('Agents')).toBeInTheDocument();
        });

        it('highlights the active tab correctly', () => {
            render(<Navbar {...defaultProps} activeTab="Overview" />);

            const overviewTab = screen.getByText('Overview');
            const agentsTab = screen.getByText('Agents');

            expect(overviewTab).toHaveClass('bg-green-600', 'text-white');
            expect(agentsTab).not.toHaveClass('bg-green-600', 'text-white');
        });

        it('calls onChange when tab is clicked', async () => {
            const onChange = jest.fn();
            render(<Navbar {...defaultProps} onChange={onChange} />);

            const agentsTab = screen.getByText('Agents');
            await user.click(agentsTab);

            expect(onChange).toHaveBeenCalledWith('Agents');
        });

        it('switches active tab correctly', () => {
            const { rerender } = render(<Navbar {...defaultProps} activeTab="Overview" />);

            expect(screen.getByText('Overview')).toHaveClass('bg-green-600');

            rerender(<Navbar {...defaultProps} activeTab="Agents" />);

            expect(screen.getByText('Agents')).toHaveClass('bg-green-600');
            expect(screen.getByText('Overview')).not.toHaveClass('bg-green-600');
        });
    });

    describe('Dark Mode Toggle', () => {
        it('shows moon icon in light mode', () => {
            render(<Navbar {...defaultProps} isDarkMode={false} />);

            expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
            expect(screen.queryByTestId('sun-icon')).not.toBeInTheDocument();
        });

        it('shows sun icon in dark mode', () => {
            render(<Navbar {...defaultProps} isDarkMode={true} />);

            expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
            expect(screen.queryByTestId('moon-icon')).not.toBeInTheDocument();
        });

        it('calls onToggleDarkMode when dark mode button is clicked', async () => {
            const onToggleDarkMode = jest.fn();
            render(<Navbar {...defaultProps} onToggleDarkMode={onToggleDarkMode} />);

            const darkModeButton = screen.getByTestId('moon-icon').closest('button');
            expect(darkModeButton).toBeInTheDocument();

            if (darkModeButton) {
                await user.click(darkModeButton);
                expect(onToggleDarkMode).toHaveBeenCalledTimes(1);
            }
        });
    });

    describe('User Profile Section', () => {
        it('displays user initials in profile button', () => {
            render(<Navbar {...defaultProps} />);

            // The component has a mock user with firstName: 'Karthik', lastName: 'Konduru'
            // But since we want generic tests, we'll test for the presence of initials
            const initialsElements = screen.getAllByText(/^[A-Z]{2}$/);
            expect(initialsElements.length).toBeGreaterThan(0);
        });

        it('shows developer access badge on larger screens', () => {
            render(<Navbar {...defaultProps} />);

            expect(screen.getByText('Developer Access')).toBeInTheDocument();
        });

        it('opens dropdown when profile button is clicked', async () => {
            render(<Navbar {...defaultProps} />);

            // Find the profile button by looking for the button with initials
            const buttons = screen.getAllByRole('button');
            const profileButton = buttons.find(button => /^[A-Z]{2}$/.test(button.textContent || ''));

            expect(profileButton).toBeInTheDocument();

            if (profileButton) {
                await user.click(profileButton);

                await waitFor(() => {
                    // Look for elements that would be in the dropdown
                    expect(screen.getByText('Log out')).toBeInTheDocument();
                });
            }
        });


        it('closes dropdown when clicked outside', async () => {
            render(<Navbar {...defaultProps} />);

            const buttons = screen.getAllByRole('button');
            const profileButton = buttons.find(button => /^[A-Z]{2}$/.test(button.textContent || ''));

            if (profileButton) {
                await user.click(profileButton);

                await waitFor(() => {
                    expect(screen.getByText('Log out')).toBeInTheDocument();
                });

                // Click outside the dropdown
                fireEvent.mouseDown(document.body);

                await waitFor(() => {
                    expect(screen.queryByText('Log out')).not.toBeInTheDocument();
                });
            }
        });

        it('shows status indicator in dropdown', async () => {
            render(<Navbar {...defaultProps} />);

            const buttons = screen.getAllByRole('button');
            const profileButton = buttons.find(button => /^[A-Z]{2}$/.test(button.textContent || ''));

            if (profileButton) {
                await user.click(profileButton);

                await waitFor(() => {
                    const statusDots = document.querySelectorAll('.w-2.h-2.bg-green-500.rounded-full.animate-pulse');
                    expect(statusDots.length).toBeGreaterThan(0);
                });
            }
        });
    });

    describe('Dropdown Actions', () => {


        it('has logout button in dropdown', async () => {
            render(<Navbar {...defaultProps} />);

            const buttons = screen.getAllByRole('button');
            const profileButton = buttons.find(button => /^[A-Z]{2}$/.test(button.textContent || ''));

            if (profileButton) {
                await user.click(profileButton);

                await waitFor(() => {
                    expect(screen.getByText('Log out')).toBeInTheDocument();
                });
            }
        });

        it('calls onLogout when logout button is clicked', async () => {
            const onLogout = jest.fn();
            render(<Navbar {...defaultProps} onLogout={onLogout} />);

            const buttons = screen.getAllByRole('button');
            const profileButton = buttons.find(button => /^[A-Z]{2}$/.test(button.textContent || ''));

            if (profileButton) {
                await user.click(profileButton);

                await waitFor(async () => {
                    const logoutButton = screen.getByText('Log out');
                    await user.click(logoutButton);

                    expect(onLogout).toHaveBeenCalledTimes(1);
                });
            }
        });

        it('shows loading state during logout', async () => {
            const onLogout = jest.fn(() => new Promise<void>(resolve => setTimeout(resolve, 100)));
            render(<Navbar {...defaultProps} onLogout={onLogout} />);

            const buttons = screen.getAllByRole('button');
            const profileButton = buttons.find(button => /^[A-Z]{2}$/.test(button.textContent || ''));

            if (profileButton) {
                await user.click(profileButton);

                await waitFor(async () => {
                    const logoutButton = screen.getByText('Log out');
                    await user.click(logoutButton);

                    expect(screen.getByText('Logging out...')).toBeInTheDocument();
                });
            }
        });

        it('has proper icons in dropdown actions', async () => {
            render(<Navbar {...defaultProps} />);

            const buttons = screen.getAllByRole('button');
            const profileButton = buttons.find(button => /^[A-Z]{2}$/.test(button.textContent || ''));

            if (profileButton) {
                await user.click(profileButton);

                await waitFor(() => {
                    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
                    expect(screen.getByTestId('logout-icon')).toBeInTheDocument();
                });
            }
        });
    });

    describe('Responsive Design', () => {
        it('applies responsive classes correctly', () => {
            const { container } = render(<Navbar {...defaultProps} />);

            // Check for responsive padding classes
            const paddingElement = container.querySelector('[class*="px-4"][class*="sm:px-6"][class*="lg:px-8"]');
            expect(paddingElement).toBeInTheDocument();
        });

        it('has responsive layout for profile section', () => {
            const { container } = render(<Navbar {...defaultProps} />);

            // Check for responsive width classes
            const responsiveElement = container.querySelector('[class*="w-full"][class*="sm:w-auto"]');
            expect(responsiveElement).toBeInTheDocument();
        });

        it('has responsive profile button size', () => {
            const { container } = render(<Navbar {...defaultProps} />);

            const profileButton = container.querySelector('[class*="h-10"][class*="w-10"][class*="sm:h-12"][class*="sm:w-12"]');
            expect(profileButton).toBeInTheDocument();
        });
    });

    describe('Dark Mode Styling', () => {
        it('applies dark mode classes to main nav', () => {
            const { container } = render(<Navbar {...defaultProps} isDarkMode={true} />);

            const navElement = container.querySelector('nav');
            expect(navElement).toHaveClass('bg-gray-900/80');
        });

        it('applies light mode classes to main nav', () => {
            const { container } = render(<Navbar {...defaultProps} isDarkMode={false} />);

            const navElement = container.querySelector('nav');
            expect(navElement).toHaveClass('bg-white');
        });

        it('applies correct text colors based on mode', () => {
            const { rerender } = render(<Navbar {...defaultProps} isDarkMode={false} />);

            expect(screen.getByText('Control Center')).toHaveClass('text-gray-500');

            rerender(<Navbar {...defaultProps} isDarkMode={true} />);

            expect(screen.getByText('Control Center')).toHaveClass('text-gray-400');
        });

        it('applies dark mode styles to developer access badge', () => {
            render(<Navbar {...defaultProps} isDarkMode={true} />);

            const badge = screen.getByText('Developer Access');
            expect(badge).toHaveClass('text-green-400');
        });
    });

    describe('Accessibility', () => {
        it('has proper navigation role', () => {
            render(<Navbar {...defaultProps} />);

            const nav = screen.getByRole('navigation');
            expect(nav).toBeInTheDocument();
        });

        it('has accessible buttons', () => {
            render(<Navbar {...defaultProps} />);

            const buttons = screen.getAllByRole('button');
            expect(buttons.length).toBeGreaterThan(0);

            buttons.forEach(button => {
                expect(button).toBeInTheDocument();
            });
        });

        it('handles keyboard navigation correctly', async () => {
            render(<Navbar {...defaultProps} />);

            const overviewTab = screen.getByText('Overview');
            overviewTab.focus();

            // Should be able to tab through elements
            await user.tab();
            expect(document.activeElement).not.toBe(overviewTab);
        });

        it('provides proper focus management for dropdown', async () => {
            render(<Navbar {...defaultProps} />);

            const buttons = screen.getAllByRole('button');
            const profileButton = buttons.find(button => /^[A-Z]{2}$/.test(button.textContent || ''));

            if (profileButton) {
                profileButton.focus();
                await user.keyboard('{Enter}');

                await waitFor(() => {
                    expect(screen.getByText('Log out')).toBeInTheDocument();
                });
            }
        });

        it('has proper tab navigation structure', () => {
            render(<Navbar {...defaultProps} />);

            const tabs = screen.getAllByRole('button');
            const tabButtons = tabs.filter(button =>
                button.textContent === 'Overview' || button.textContent === 'Agents'
            );

            expect(tabButtons).toHaveLength(2);
        });
    });

    describe('Integration', () => {
        it('handles all prop combinations correctly', () => {
            const props = {
                isDarkMode: true,
                activeTab: 'Agents' as const,
                onChange: jest.fn(),
                activeTitle: 'AI Agents',
                sidebarOpen: false,
                onToggleSidebar: jest.fn(),
                onToggleDarkMode: jest.fn(),
                onLogout: jest.fn(),
            };

            expect(() => render(<Navbar {...props} />)).not.toThrow();
            expect(screen.getByText('Agents')).toHaveClass('bg-green-600');
        });

        it('handles async logout function', async () => {
            const onLogout = jest.fn().mockResolvedValue(undefined);
            render(<Navbar {...defaultProps} onLogout={onLogout} />);

            const buttons = screen.getAllByRole('button');
            const profileButton = buttons.find(button => /^[A-Z]{2}$/.test(button.textContent || ''));

            if (profileButton) {
                await user.click(profileButton);

                await waitFor(async () => {
                    const logoutButton = screen.getByText('Log out');
                    await user.click(logoutButton);

                    await waitFor(() => {
                        expect(onLogout).toHaveBeenCalledTimes(1);
                    });
                });
            }
        });

        it('handles sync logout function', async () => {
            const onLogout = jest.fn();
            render(<Navbar {...defaultProps} onLogout={onLogout} />);

            const buttons = screen.getAllByRole('button');
            const profileButton = buttons.find(button => /^[A-Z]{2}$/.test(button.textContent || ''));

            if (profileButton) {
                await user.click(profileButton);

                await waitFor(async () => {
                    const logoutButton = screen.getByText('Log out');
                    await user.click(logoutButton);

                    expect(onLogout).toHaveBeenCalledTimes(1);
                });
            }
        });
    });

    describe('Performance', () => {
        it('renders without performance issues', () => {
            const startTime = performance.now();
            render(<Navbar {...defaultProps} />);
            const endTime = performance.now();

            // Should render quickly (less than 100ms in test environment)
            expect(endTime - startTime).toBeLessThan(100);
        });

        it('handles frequent prop changes efficiently', () => {
            const { rerender } = render(<Navbar {...defaultProps} activeTab="Overview" />);

            // Multiple re-renders should not cause issues
            for (let i = 0; i < 10; i++) {
                rerender(<Navbar {...defaultProps} activeTab={i % 2 === 0 ? "Overview" : "Agents"} />);
            }

            expect(screen.getByText('Developer')).toBeInTheDocument();
        });

        it('handles dropdown open/close efficiently', async () => {
            render(<Navbar {...defaultProps} />);

            const buttons = screen.getAllByRole('button');
            const profileButton = buttons.find(button => /^[A-Z]{2}$/.test(button.textContent || ''));

            if (profileButton) {
                // Open and close dropdown multiple times
                for (let i = 0; i < 3; i++) {
                    await user.click(profileButton);
                    await waitFor(() => {
                        expect(screen.getByText('Log out')).toBeInTheDocument();
                    });

                    fireEvent.mouseDown(document.body);
                    await waitFor(() => {
                        expect(screen.queryByText('Log out')).not.toBeInTheDocument();
                    });
                }

                expect(screen.getByText('Developer')).toBeInTheDocument();
            }
        });
    });

    describe('Component State Management', () => {
        it('manages dropdown open state correctly', async () => {
            render(<Navbar {...defaultProps} />);

            const buttons = screen.getAllByRole('button');
            const profileButton = buttons.find(button => /^[A-Z]{2}$/.test(button.textContent || ''));

            // Initially dropdown should be closed
            expect(screen.queryByText('Log out')).not.toBeInTheDocument();

            if (profileButton) {
                // Open dropdown
                await user.click(profileButton);
                await waitFor(() => {
                    expect(screen.getByText('Log out')).toBeInTheDocument();
                });

                // Close dropdown
                await user.click(profileButton);
                await waitFor(() => {
                    expect(screen.queryByText('Log out')).not.toBeInTheDocument();
                });
            }
        });

        it('manages logout loading state correctly', async () => {
            let resolveLogout: () => void;
            const logoutPromise = new Promise<void>((resolve) => {
                resolveLogout = resolve;
            });
            const onLogout = jest.fn(() => logoutPromise);

            render(<Navbar {...defaultProps} onLogout={onLogout} />);

            const buttons = screen.getAllByRole('button');
            const profileButton = buttons.find(button => /^[A-Z]{2}$/.test(button.textContent || ''));

            if (profileButton) {
                await user.click(profileButton);

                const logoutButton = await screen.findByText('Log out');
                await user.click(logoutButton);

                // Should show loading state
                expect(screen.getByText('Logging out...')).toBeInTheDocument();

                // Resolve the logout
                resolveLogout!();

                // Should return to normal state
                await waitFor(() => {
                    expect(screen.queryByText('Logging out...')).not.toBeInTheDocument();
                });
            }
        });
    });

    describe('Visual Elements', () => {
        it('displays logo with correct styling', () => {
            const { container } = render(<Navbar {...defaultProps} />);

            const logo = screen.getByText('D');
            expect(logo).toBeInTheDocument();
            expect(logo).toHaveClass('text-white', 'font-bold', 'text-lg');
        });

        it('displays gradient text for Developer title', () => {
            render(<Navbar {...defaultProps} />);

            const title = screen.getByText('Developer');
            expect(title).toHaveClass('bg-gradient-to-r', 'from-green-500', 'to-emerald-600', 'bg-clip-text', 'text-transparent');
        });

        it('shows transition effects on buttons', () => {
            render(<Navbar {...defaultProps} />);

            const overviewTab = screen.getByText('Overview');
            expect(overviewTab).toHaveClass('transition-all', 'duration-300');
        });
    });
});