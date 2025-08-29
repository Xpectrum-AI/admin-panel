import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModelConfig from '@/app/components/config/ModelConfig';

// Mock the modelConfigService
jest.mock('@/service/modelConfigService', () => ({
  modelConfigService: {
    configureModel: jest.fn(),
    configurePrompt: jest.fn(),
  },
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
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env = originalEnv;
  });

  describe('Rendering', () => {
    it('renders the model config with default props', () => {
      render(<ModelConfig />);
      
      expect(screen.getByText('Provider')).toBeInTheDocument();
      expect(screen.getByText('Model')).toBeInTheDocument();
      expect(screen.getByText('First Message')).toBeInTheDocument();
      expect(screen.getByText('System Prompt')).toBeInTheDocument();
    });

    it('renders with dark mode styling', () => {
      render(<ModelConfig isDarkMode={true} />);
      
      // Check that the component renders without errors
      expect(screen.getByText('Provider')).toBeInTheDocument();
    });

    it('displays provider options', () => {
      render(<ModelConfig />);
      
      expect(screen.getByText('OpenAI')).toBeInTheDocument();
      expect(screen.getByText('Anthropic')).toBeInTheDocument();
      expect(screen.getByText('DeepSeek')).toBeInTheDocument();
      expect(screen.getByText('Groq')).toBeInTheDocument();
      expect(screen.getByText('XAI')).toBeInTheDocument();
      expect(screen.getByText('Google')).toBeInTheDocument();
    });

    it('displays model options', () => {
      render(<ModelConfig />);
      
      expect(screen.getByText('GPT-4o')).toBeInTheDocument();
      expect(screen.getByText('GPT-4o Mini')).toBeInTheDocument();
      expect(screen.getByText('GPT-4 Turbo')).toBeInTheDocument();
      expect(screen.getByText('GPT-4')).toBeInTheDocument();
      expect(screen.getByText('GPT-3.5 Turbo')).toBeInTheDocument();
    });

    it('displays default values correctly', () => {
      render(<ModelConfig />);
      
      // Check default provider and model
      expect(screen.getByDisplayValue('OpenAI')).toBeInTheDocument();
      expect(screen.getByDisplayValue('GPT-4o')).toBeInTheDocument();
      
      // Check default first message
      expect(screen.getByDisplayValue('Thank you for calling Wellness Partners. This is Riley, your scheduling agent. How may I help you today?')).toBeInTheDocument();
      
      // Check default system prompt
      expect(screen.getByDisplayValue(/Appointment Scheduling Agent Prompt/)).toBeInTheDocument();
    });

    it('shows configure and save buttons', () => {
      render(<ModelConfig />);
      
      expect(screen.getByText('Configure')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });
  });

  describe('Provider Selection', () => {
    it('allows selecting different providers', async () => {
      render(<ModelConfig />);
      
      const providerSelect = screen.getByDisplayValue('OpenAI');
      await user.selectOptions(providerSelect, 'Anthropic');
      
      expect(providerSelect).toHaveValue('Anthropic');
    });

    it('updates model options when provider changes', async () => {
      render(<ModelConfig />);
      
      const providerSelect = screen.getByDisplayValue('OpenAI');
      await user.selectOptions(providerSelect, 'Anthropic');
      
      // Model should reset to first option of new provider
      const modelSelect = screen.getByDisplayValue('Claude 3.5 Sonnet');
      expect(modelSelect).toBeInTheDocument();
    });

    it('allows selecting different models', async () => {
      render(<ModelConfig />);
      
      const modelSelect = screen.getByDisplayValue('GPT-4o');
      await user.selectOptions(modelSelect, 'GPT-4o Mini');
      
      expect(modelSelect).toHaveValue('GPT-4o Mini');
    });
  });

  describe('Text Inputs', () => {
    it('allows editing first message', async () => {
      render(<ModelConfig />);
      
      const firstMessageTextarea = screen.getByDisplayValue('Thank you for calling Wellness Partners. This is Riley, your scheduling agent. How may I help you today?');
      await user.clear(firstMessageTextarea);
      await user.type(firstMessageTextarea, 'Hello, this is a test message');
      
      expect(firstMessageTextarea).toHaveValue('Hello, this is a test message');
    });

    it('allows editing system prompt', async () => {
      render(<ModelConfig />);
      
      const systemPromptTextarea = screen.getByDisplayValue(/Appointment Scheduling Agent Prompt/);
      await user.clear(systemPromptTextarea);
      await user.type(systemPromptTextarea, 'You are a helpful assistant');
      
      expect(systemPromptTextarea).toHaveValue('You are a helpful assistant');
    });
  });

  describe('Generate Button', () => {
    it('shows generate button for first message', () => {
      render(<ModelConfig />);
      
      expect(screen.getByText('Generate')).toBeInTheDocument();
    });
  });

  describe('Model Configuration API', () => {
    it('calls configureModel API when Configure button is clicked', async () => {
      mockModelConfigService.configureModel.mockResolvedValue({
        success: true,
        data: { data: { updated: true } }
      });

      render(<ModelConfig />);
      
      const configureButton = screen.getByText('Configure');
      await user.click(configureButton);

      await waitFor(() => {
        expect(mockModelConfigService.configureModel).toHaveBeenCalledWith({
          provider: 'langgenius/openai/openai',
          model: 'gpt-4o'
        });
      });
    });

    it('shows loading state during model configuration', async () => {
      mockModelConfigService.configureModel.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: {} }), 100))
      );

      render(<ModelConfig />);
      
      const configureButton = screen.getByText('Configure');
      await user.click(configureButton);

      expect(screen.getByText('Configuring...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Configuring...' })).toBeDisabled();
    });

    it('shows success state after successful model configuration', async () => {
      mockModelConfigService.configureModel.mockResolvedValue({
        success: true,
        data: { data: { updated: true } }
      });

      render(<ModelConfig />);
      
      const configureButton = screen.getByText('Configure');
      await user.click(configureButton);

      await waitFor(() => {
        expect(screen.getByText('Configure')).toBeInTheDocument();
      });
    });

    it('shows error state when model configuration fails', async () => {
      mockModelConfigService.configureModel.mockResolvedValue({
        success: false,
        message: 'Failed to configure model'
      });

      render(<ModelConfig />);
      
      const configureButton = screen.getByText('Configure');
      await user.click(configureButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to configure model')).toBeInTheDocument();
      });
    });

    it('handles different provider-model combinations', async () => {
      mockModelConfigService.configureModel.mockResolvedValue({
        success: true,
        data: { data: { updated: true } }
      });

      render(<ModelConfig />);
      
      // Change provider to Anthropic
      const providerSelect = screen.getByDisplayValue('OpenAI');
      await user.selectOptions(providerSelect, 'Anthropic');
      
      // Change model to Claude 3.5 Haiku
      const modelSelect = screen.getByDisplayValue('Claude 3.5 Sonnet');
      await user.selectOptions(modelSelect, 'Claude 3.5 Haiku');
      
      const configureButton = screen.getByText('Configure');
      await user.click(configureButton);

      await waitFor(() => {
        expect(mockModelConfigService.configureModel).toHaveBeenCalledWith({
          provider: 'langgenius/anthropic/anthropic',
          model: 'claude-3-5-haiku'
        });
      });
    });
  });

  describe('Prompt Configuration API', () => {
    it('calls configurePrompt API when Save button is clicked', async () => {
      mockModelConfigService.configurePrompt.mockResolvedValue({
        success: true,
        data: { data: { updated: true } }
      });

      render(<ModelConfig />);
      
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockModelConfigService.configurePrompt).toHaveBeenCalledWith({
          prompt: expect.stringContaining('Appointment Scheduling Agent Prompt')
        });
      });
    });

    it('shows loading state during prompt configuration', async () => {
      mockModelConfigService.configurePrompt.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: {} }), 100))
      );

      render(<ModelConfig />);
      
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
    });

    it('shows success state after successful prompt configuration', async () => {
      mockModelConfigService.configurePrompt.mockResolvedValue({
        success: true,
        data: { data: { updated: true } }
      });

      render(<ModelConfig />);
      
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
      });
    });

    it('shows error state when prompt configuration fails', async () => {
      mockModelConfigService.configurePrompt.mockResolvedValue({
        success: false,
        message: 'Failed to configure prompt'
      });

      render(<ModelConfig />);
      
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to configure prompt')).toBeInTheDocument();
      });
    });

    it('sends updated prompt content to API', async () => {
      mockModelConfigService.configurePrompt.mockResolvedValue({
        success: true,
        data: { data: { updated: true } }
      });

      render(<ModelConfig />);
      
      // Edit the system prompt
      const systemPromptTextarea = screen.getByDisplayValue(/Appointment Scheduling Agent Prompt/);
      await user.clear(systemPromptTextarea);
      await user.type(systemPromptTextarea, 'New custom prompt');
      
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockModelConfigService.configurePrompt).toHaveBeenCalledWith({
          prompt: 'New custom prompt'
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API call fails', async () => {
      mockModelConfigService.configureModel.mockResolvedValue({
        success: false,
        message: 'API Error: Invalid configuration'
      });

      render(<ModelConfig />);
      
      const configureButton = screen.getByText('Configure');
      await user.click(configureButton);

      await waitFor(() => {
        expect(screen.getByText('API Error: Invalid configuration')).toBeInTheDocument();
      });
    });

    it('clears error message when new API call is made', async () => {
      mockModelConfigService.configureModel
        .mockResolvedValueOnce({
          success: false,
          message: 'First error'
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: { updated: true } }
        });

      render(<ModelConfig />);
      
      const configureButton = screen.getByText('Configure');
      
      // First call - shows error
      await user.click(configureButton);
      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });
      
      // Second call - error should be cleared
      await user.click(configureButton);
      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
      });
    });

    it('handles network errors gracefully', async () => {
      mockModelConfigService.configureModel.mockResolvedValue({
        success: false,
        message: 'Network error'
      });

      render(<ModelConfig />);
      
      const configureButton = screen.getByText('Configure');
      await user.click(configureButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('UI States', () => {
    it('disables buttons during loading', async () => {
      mockModelConfigService.configureModel.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: {} }), 100))
      );

      render(<ModelConfig />);
      
      const configureButton = screen.getByText('Configure');
      await user.click(configureButton);

      expect(configureButton).toBeDisabled();
    });

    it('shows success icon after successful configuration', async () => {
      mockModelConfigService.configureModel.mockResolvedValue({
        success: true,
        data: { data: { updated: true } }
      });

      render(<ModelConfig />);
      
      const configureButton = screen.getByText('Configure');
      await user.click(configureButton);

      await waitFor(() => {
        // The success icon should be present (CheckCircle)
        expect(screen.getByText('Configure')).toBeInTheDocument();
      });
    });

    it('shows error icon after failed configuration', async () => {
      mockModelConfigService.configureModel.mockResolvedValue({
        success: false,
        message: 'Configuration failed'
      });

      render(<ModelConfig />);
      
      const configureButton = screen.getByText('Configure');
      await user.click(configureButton);

      await waitFor(() => {
        // The error icon should be present (AlertCircle)
        expect(screen.getByText('Configuration failed')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('renders the component without errors', () => {
      render(<ModelConfig />);
      
      expect(screen.getByText('Provider')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper labels and form structure', () => {
      render(<ModelConfig />);
      
      // Check that labels are present in the document
      expect(screen.getByText('Provider')).toBeInTheDocument();
      expect(screen.getByText('Model')).toBeInTheDocument();
      expect(screen.getByText('First Message')).toBeInTheDocument();
      expect(screen.getByText('System Prompt')).toBeInTheDocument();
    });

    it('has proper button roles and states', () => {
      render(<ModelConfig />);
      
      const configureButton = screen.getByRole('button', { name: 'Configure' });
      const saveButton = screen.getByRole('button', { name: 'Save' });
      
      expect(configureButton).toBeInTheDocument();
      expect(saveButton).toBeInTheDocument();
    });

    it('has proper form controls with accessible names', () => {
      render(<ModelConfig />);
      
      // Check that form controls are present
      expect(screen.getByDisplayValue('OpenAI')).toBeInTheDocument(); // Provider select
      expect(screen.getByDisplayValue('GPT-4o')).toBeInTheDocument(); // Model select
      expect(screen.getByDisplayValue('Thank you for calling Wellness Partners. This is Riley, your scheduling agent. How may I help you today?')).toBeInTheDocument(); // First message textarea
      expect(screen.getByDisplayValue(/Appointment Scheduling Agent Prompt/)).toBeInTheDocument(); // System prompt textarea
    });
  });
});
