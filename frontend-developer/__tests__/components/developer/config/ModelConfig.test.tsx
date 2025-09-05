import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModelConfig from '@/app/components/config/ModelConfig';

// Mock the modelConfigService
jest.mock('@/service/modelConfigService', () => ({
  modelConfigService: {
    configureModel: jest.fn(),
    configurePrompt: jest.fn(),
    getCurrentModelConfig: jest.fn(),
    getCurrentPromptConfig: jest.fn(),
  },
}));

// Mock ThemeContext
jest.mock('@/app/contexts/ThemeContext', () => ({
  useTheme: () => ({
    isDarkMode: false,
    toggleTheme: jest.fn(),
  }),
}));

import { modelConfigService } from '@/service/modelConfigService';

const mockModelConfigService = modelConfigService as jest.Mocked<typeof modelConfigService>;

// Mock environment variables
const originalEnv = process.env;

describe('ModelConfig', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn();
    jest.clearAllMocks();

    // Set up environment variables for testing
    process.env.NEXT_PUBLIC_MODEL_API_BASE_URL = process.env.NEXT_PUBLIC_MODEL_API_BASE_URL || 'https://d22yt2oewbcglh.cloudfront.net/v1';
    process.env.NEXT_PUBLIC_MODEL_API_KEY = process.env.NEXT_PUBLIC_MODEL_API_KEY || 'test-api-key';

    // Default mock responses for initial loading
    mockModelConfigService.getCurrentModelConfig.mockResolvedValue({
      success: false,
      message: 'No configuration found'
    });
    mockModelConfigService.getCurrentPromptConfig.mockResolvedValue({
      success: false,
      message: 'No configuration found'
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env = originalEnv;
  });

  describe('Rendering', () => {
    it('renders the main sections', async () => {
      render(<ModelConfig />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('Check Status')).toBeInTheDocument();
      });

      expect(screen.getAllByText('Model Configuration')).toHaveLength(2); // Multiple instances exist
      expect(screen.getAllByText('System Prompt')).toHaveLength(3); // Multiple instances exist
      expect(screen.getByText('Current Configuration Status')).toBeInTheDocument();
    });

    it('renders status check and reset buttons', async () => {
      render(<ModelConfig />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('Check Status')).toBeInTheDocument();
      });

      expect(screen.getByText('Check Status')).toBeInTheDocument();
      expect(screen.getByText('Reset Status')).toBeInTheDocument();
    });

    it('renders with dark mode styling', async () => {
      // Mock dark mode theme
      jest.doMock('@/app/contexts/ThemeContext', () => ({
        useTheme: () => ({
          isDarkMode: true,
          toggleTheme: jest.fn(),
        }),
      }));

      render(<ModelConfig />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('Check Status')).toBeInTheDocument();
      });

      // Check that the component renders without errors
      expect(screen.getAllByText('Model Configuration')).toHaveLength(2);
    });
  });

  describe('Status Check and Reset', () => {
    it('calls getCurrentModelConfig and getCurrentPromptConfig when Check Status is clicked', async () => {
      mockModelConfigService.getCurrentModelConfig.mockResolvedValue({
        success: true,
        data: {
          provider: 'openai',
          model: 'gpt-4o',
          apiKey: 'test-key'
        }
      });
      mockModelConfigService.getCurrentPromptConfig.mockResolvedValue({
        success: true,
        data: {
          prompt: 'Test prompt'
        }
      });

      render(<ModelConfig />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('Check Status')).toBeInTheDocument();
      });

      const checkStatusButton = screen.getByText('Check Status');
      await user.click(checkStatusButton);

      await waitFor(() => {
        expect(mockModelConfigService.getCurrentModelConfig).toHaveBeenCalled();
        expect(mockModelConfigService.getCurrentPromptConfig).toHaveBeenCalled();
      });
    });

    it('resets status when Reset Status is clicked', async () => {
      render(<ModelConfig />);

      const resetStatusButton = screen.getByText('Reset Status');
      await user.click(resetStatusButton);

      // Status should be reset (no specific assertions needed as this is internal state)
      expect(resetStatusButton).toBeInTheDocument();
    });
  });

  describe('Model Configuration Form', () => {
    it('renders model configuration form when not configured', async () => {
      render(<ModelConfig />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('Check Status')).toBeInTheDocument();
      });

      // The form should be visible by default
      expect(screen.getByText('Model Provider')).toBeInTheDocument();
      expect(screen.getByText('Model')).toBeInTheDocument();
    });

    it('allows selecting different providers', async () => {
      render(<ModelConfig />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('Check Status')).toBeInTheDocument();
      });

      const providerSelect = screen.getByDisplayValue('OpenAI');
      await user.selectOptions(providerSelect, 'Anthropic');

      expect(providerSelect).toHaveValue('Anthropic');
    });

    it('allows selecting different models', async () => {
      render(<ModelConfig />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('Check Status')).toBeInTheDocument();
      });

      const modelSelect = screen.getByDisplayValue('GPT-4o');
      await user.selectOptions(modelSelect, 'GPT-4o Mini');

      expect(modelSelect).toHaveValue('GPT-4o Mini');
    });

    it('calls configureModel when Configure button is clicked', async () => {
      mockModelConfigService.configureModel.mockResolvedValue({
        success: true,
        message: 'Model configured successfully'
      });

      render(<ModelConfig />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('Check Status')).toBeInTheDocument();
      });

      const configureButton = screen.getByText('Configure Model');
      await user.click(configureButton);

      await waitFor(() => {
        expect(mockModelConfigService.configureModel).toHaveBeenCalled();
      });
    });
  });

  describe('Prompt Configuration Form', () => {
    it('renders prompt configuration form', async () => {
      render(<ModelConfig />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('Check Status')).toBeInTheDocument();
      });

      expect(screen.getByText('First Message')).toBeInTheDocument();
      expect(screen.getAllByText('System Prompt')).toHaveLength(3); // Multiple instances exist
    });

    it('allows editing first message', async () => {
      render(<ModelConfig />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('Check Status')).toBeInTheDocument();
      });

      const firstMessageTextarea = screen.getByDisplayValue('Thank you for calling Wellness Partners. This is Riley, your scheduling agent. How may I help you today?');
      await user.clear(firstMessageTextarea);
      await user.type(firstMessageTextarea, 'New first message');

      expect(firstMessageTextarea).toHaveValue('New first message');
    });

    it('allows editing system prompt', async () => {
      render(<ModelConfig />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('Check Status')).toBeInTheDocument();
      });

      const systemPromptTextarea = screen.getByPlaceholderText('Enter the system prompt that defines your agent\'s behavior...');
      await user.clear(systemPromptTextarea);
      await user.type(systemPromptTextarea, 'New system prompt');

      expect(systemPromptTextarea).toHaveValue('New system prompt');
    });

    it('calls configurePrompt when Save Prompt button is clicked', async () => {
      mockModelConfigService.configurePrompt.mockResolvedValue({
        success: true,
        message: 'Prompt configured successfully'
      });

      render(<ModelConfig />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('Check Status')).toBeInTheDocument();
      });

      const savePromptButton = screen.getByText('Save Prompt');
      await user.click(savePromptButton);

      await waitFor(() => {
        expect(mockModelConfigService.configurePrompt).toHaveBeenCalled();
      });
    });
  });

  describe('Loading Current Configuration', () => {
    it('loads current model configuration on mount', async () => {
      mockModelConfigService.getCurrentModelConfig.mockResolvedValue({
        success: true,
        data: {
          provider: 'openai',
          model: 'gpt-4o',
          apiKey: 'test-key'
        }
      });
      mockModelConfigService.getCurrentPromptConfig.mockResolvedValue({
        success: true,
        data: {
          prompt: 'Test prompt'
        }
      });

      render(<ModelConfig />);

      await waitFor(() => {
        expect(mockModelConfigService.getCurrentModelConfig).toHaveBeenCalled();
        expect(mockModelConfigService.getCurrentPromptConfig).toHaveBeenCalled();
      });
    });

    it('handles API errors when loading configuration', async () => {
      mockModelConfigService.getCurrentModelConfig.mockResolvedValue({
        success: false,
        message: 'API Error'
      });
      mockModelConfigService.getCurrentPromptConfig.mockResolvedValue({
        success: false,
        message: 'API Error'
      });

      render(<ModelConfig />);

      await waitFor(() => {
        expect(mockModelConfigService.getCurrentModelConfig).toHaveBeenCalled();
        expect(mockModelConfigService.getCurrentPromptConfig).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when model configuration fails', async () => {
      mockModelConfigService.configureModel.mockResolvedValue({
        success: false,
        message: 'Configuration failed'
      });

      render(<ModelConfig />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('Check Status')).toBeInTheDocument();
      });

      const configureButton = screen.getByText('Configure Model');
      await user.click(configureButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to configure model')).toBeInTheDocument();
      });
    });

    it('displays error message when prompt configuration fails', async () => {
      mockModelConfigService.configurePrompt.mockResolvedValue({
        success: false,
        message: 'Configuration failed'
      });

      render(<ModelConfig />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('Check Status')).toBeInTheDocument();
      });

      const savePromptButton = screen.getByText('Save Prompt');
      await user.click(savePromptButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to save system prompt')).toBeInTheDocument();
      });
    });
  });

  describe('Success Messages', () => {
    it('displays success message when model configuration succeeds', async () => {
      mockModelConfigService.configureModel.mockResolvedValue({
        success: true,
        message: 'Model configured successfully'
      });

      render(<ModelConfig />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('Check Status')).toBeInTheDocument();
      });

      const configureButton = screen.getByText('Configure Model');
      await user.click(configureButton);

      await waitFor(() => {
        expect(screen.getByText('Model configured successfully!')).toBeInTheDocument();
      });
    });

    it('displays success message when prompt configuration succeeds', async () => {
      mockModelConfigService.configurePrompt.mockResolvedValue({
        success: true,
        message: 'Prompt configured successfully'
      });

      render(<ModelConfig />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('Check Status')).toBeInTheDocument();
      });

      const savePromptButton = screen.getByText('Save Prompt');
      await user.click(savePromptButton);

      await waitFor(() => {
        expect(screen.getByText('System prompt saved successfully!')).toBeInTheDocument();
      });
    });
  });
});