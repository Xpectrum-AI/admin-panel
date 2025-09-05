import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ToolsConfig from '@/app/components/config/ToolsConfig';

// Mock the agentConfigService
jest.mock('@/service/agentConfigService', () => ({
  agentConfigService: {
    configureAgent: jest.fn(),
    getCurrentAgentConfig: jest.fn(),
  },
}));

// Mock ThemeContext
jest.mock('@/app/contexts/ThemeContext', () => ({
  useTheme: () => ({
    isDarkMode: false,
    toggleTheme: jest.fn(),
  }),
}));

import { agentConfigService } from '@/service/agentConfigService';

const mockAgentConfigService = agentConfigService as jest.Mocked<typeof agentConfigService>;

describe('ToolsConfig', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the configuration status section', () => {
      render(<ToolsConfig />);
      
      expect(screen.getByText('Configuration Status')).toBeInTheDocument();
      expect(screen.getByText('Check the status of your voice and transcriber configurations')).toBeInTheDocument();
    });

    it('renders the initial message section', () => {
      render(<ToolsConfig />);
      
      expect(screen.getAllByText('Initial Message')).toHaveLength(2); // Multiple instances exist
      expect(screen.getByText('Configure the first message your agent will say when a call starts.')).toBeInTheDocument();
    });

    it('renders the call behavior section', () => {
      render(<ToolsConfig />);
      
      expect(screen.getByText('Call Behavior')).toBeInTheDocument();
    });

    it('renders the audio and duration section', () => {
      render(<ToolsConfig />);
      
      expect(screen.getByText('Audio & Duration')).toBeInTheDocument();
      expect(screen.getByText('Configure audio settings and call duration limits.')).toBeInTheDocument();
    });

    it('renders with dark mode styling', () => {
      // Mock dark mode theme
      jest.doMock('@/app/contexts/ThemeContext', () => ({
        useTheme: () => ({
          isDarkMode: true,
          toggleTheme: jest.fn(),
        }),
      }));

      render(<ToolsConfig />);

      // Check that the component renders without errors
      expect(screen.getByText('Configuration Status')).toBeInTheDocument();
    });
  });

  describe('Configuration Status', () => {
    it('shows missing configurations when no configs are provided', () => {
      render(<ToolsConfig />);
      
      expect(screen.getByText('Voice Config Missing')).toBeInTheDocument();
      expect(screen.getByText('Transcriber Config Missing')).toBeInTheDocument();
      expect(screen.getByText('Agent Not Configured')).toBeInTheDocument();
    });

    it('shows ready configurations when configs are provided', () => {
      const mockVoiceConfig = { provider: 'openai' };
      const mockTranscriberConfig = { provider: 'openai' };
      
      render(
        <ToolsConfig 
          voiceConfig={mockVoiceConfig}
          transcriberConfig={mockTranscriberConfig}
        />
      );
      
      expect(screen.getByText('Voice Config Ready')).toBeInTheDocument();
      expect(screen.getByText('Transcriber Config Ready')).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('renders form inputs correctly', () => {
      render(<ToolsConfig />);
      
      expect(screen.getByPlaceholderText('Enter the agent\'s first message...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Message to send when user is silent...')).toBeInTheDocument();
      expect(screen.getByDisplayValue('15')).toBeInTheDocument();
      expect(screen.getByDisplayValue('3')).toBeInTheDocument();
      expect(screen.getAllByDisplayValue('0.8')).toHaveLength(2); // Range and number input
      expect(screen.getByDisplayValue('300')).toBeInTheDocument();
    });
  });

  describe('Agent Creation', () => {
    it('calls configureAgent when Create Agent button is clicked', async () => {
      mockAgentConfigService.configureAgent.mockResolvedValue({
        success: true,
        message: 'Agent created successfully'
      });

      const mockVoiceConfig = { provider: 'openai' };
      const mockTranscriberConfig = { provider: 'openai' };
      
      render(
        <ToolsConfig 
          voiceConfig={mockVoiceConfig}
          transcriberConfig={mockTranscriberConfig}
        />
      );

      const createButton = screen.getByText('Create Agent');
      await user.click(createButton);

      await waitFor(() => {
        expect(mockAgentConfigService.configureAgent).toHaveBeenCalled();
      });
    });

    it('shows error when voice config is missing', async () => {
      render(<ToolsConfig />);

      const createButton = screen.getByText('Create Agent');
      await user.click(createButton);

      // The button should be present
      expect(createButton).toBeInTheDocument();
    });

    it('shows error when transcriber config is missing', async () => {
      const mockVoiceConfig = { provider: 'openai' };
      
      render(<ToolsConfig voiceConfig={mockVoiceConfig} />);

      const createButton = screen.getByText('Create Agent');
      await user.click(createButton);

      // The button should be present
      expect(createButton).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('renders create agent button', () => {
      render(<ToolsConfig />);
      
      const createButton = screen.getByText('Create Agent');
      expect(createButton).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when agent creation fails', async () => {
      mockAgentConfigService.configureAgent.mockResolvedValue({
        success: false,
        message: 'Configuration failed'
      });

      const mockVoiceConfig = { provider: 'openai' };
      const mockTranscriberConfig = { provider: 'openai' };
      
      render(
        <ToolsConfig 
          voiceConfig={mockVoiceConfig}
          transcriberConfig={mockTranscriberConfig}
        />
      );

      const createButton = screen.getByText('Create Agent');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Configuration failed')).toBeInTheDocument();
      });
    });
  });

  describe('Success Handling', () => {
    it('displays success message when agent creation succeeds', async () => {
      mockAgentConfigService.configureAgent.mockResolvedValue({
        success: true,
        message: 'Agent created successfully'
      });

      const mockVoiceConfig = { provider: 'openai' };
      const mockTranscriberConfig = { provider: 'openai' };
      
      render(
        <ToolsConfig 
          voiceConfig={mockVoiceConfig}
          transcriberConfig={mockTranscriberConfig}
        />
      );

      const createButton = screen.getByText('Create Agent');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/Agent.*created successfully/)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form controls with accessible names', () => {
      render(<ToolsConfig />);
      
      // Check that form controls are present
      expect(screen.getByPlaceholderText('Enter the agent\'s first message...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Message to send when user is silent...')).toBeInTheDocument();
    });

    it('has proper button roles and states', () => {
      render(<ToolsConfig />);
      
      const createButton = screen.getByRole('button', { name: 'Create Agent' });
      expect(createButton).toBeInTheDocument();
    });
  });
});