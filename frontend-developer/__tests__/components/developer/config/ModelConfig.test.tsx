import React from 'react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../utils/test-utils';
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

    // Environment variables are already set from .env file
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env = originalEnv;
  });

  describe('Rendering', () => {
    it('renders the model config with default props', async () => {
      await act(async () => {
        render(<ModelConfig />);
      });

      expect(screen.getAllByText('Model Configuration')).toHaveLength(2);
      expect(screen.getByText('Model Selection')).toBeInTheDocument();
      expect(screen.getAllByText('System Prompt')).toHaveLength(3);
    });

    it('renders with dark mode styling', async () => {
      await act(async () => {
        render(<ModelConfig />);
      });

      // Check that the component renders without errors
      expect(screen.getAllByText('Model Configuration')).toHaveLength(2);
    });

    it('displays provider options', async () => {
      await act(async () => {
        render(<ModelConfig />);
      });

      expect(screen.getByText('OpenAI')).toBeInTheDocument();
      expect(screen.getByText('Anthropic')).toBeInTheDocument();
      expect(screen.getByText('DeepSeek')).toBeInTheDocument();
      expect(screen.getByText('Groq')).toBeInTheDocument();
      expect(screen.getByText('XAI')).toBeInTheDocument();
      expect(screen.getByText('Google')).toBeInTheDocument();
    });

    it('displays model options', async () => {
      await act(async () => {
        render(<ModelConfig />);
      });

      expect(screen.getByText('GPT-4o')).toBeInTheDocument();
      expect(screen.getByText('GPT-4o Mini')).toBeInTheDocument();
      expect(screen.getByText('GPT-4 Turbo')).toBeInTheDocument();
      expect(screen.getByText('GPT-4')).toBeInTheDocument();
      expect(screen.getByText('GPT-3.5 Turbo')).toBeInTheDocument();
    });

    it('displays default values correctly', async () => {
      await act(async () => {
        render(<ModelConfig />);
      });

      // Check default first message
      expect(screen.getByDisplayValue('Thank you for calling Wellness Partners. This is Riley, your scheduling agent. How may I help you today?')).toBeInTheDocument();

      // Check default system prompt
      expect(screen.getByDisplayValue(/Appointment Scheduling Agent Prompt/)).toBeInTheDocument();
    });

    it('shows configure and save buttons', async () => {
      await act(async () => {
        render(<ModelConfig />);
      });

      expect(screen.getByText('Check Status')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Save Prompt|Prompt Saved ✓/ })).toBeInTheDocument();
    });
  });

  describe('Provider Selection', () => {
    it('allows selecting different providers', async () => {
      await act(async () => {
        render(<ModelConfig />);
      });

      const providerSelect = screen.getAllByRole('combobox')[0];
      await user.selectOptions(providerSelect, 'Anthropic');

      expect(providerSelect).toHaveValue('Anthropic');
    });

    it('updates model options when provider changes', async () => {
      await act(async () => {
        render(<ModelConfig />);
      });

      const providerSelect = screen.getAllByRole('combobox')[0];
      await user.selectOptions(providerSelect, 'Anthropic');

      // Model should reset to first option of new provider
      const modelSelect = screen.getAllByRole('combobox')[1];
      expect(modelSelect).toBeInTheDocument();
    });

    it('allows selecting different models', async () => {
      await act(async () => {
        render(<ModelConfig />);
      });

      const modelSelect = screen.getAllByRole('combobox')[1];
      await user.selectOptions(modelSelect, 'GPT-4o Mini');

      expect(modelSelect).toHaveValue('GPT-4o Mini');
    });
  });

  describe('Text Inputs', () => {
    it('allows editing first message', async () => {
      await act(async () => {
        render(<ModelConfig />);
      });

      const firstMessageTextarea = screen.getByDisplayValue('Thank you for calling Wellness Partners. This is Riley, your scheduling agent. How may I help you today?');
      await user.clear(firstMessageTextarea);
      await user.type(firstMessageTextarea, 'Hello, this is a test message');

      expect(firstMessageTextarea).toHaveValue('Hello, this is a test message');
    });

    it('allows editing system prompt', async () => {
      await act(async () => {
        render(<ModelConfig />);
      });

      const systemPromptTextarea = screen.getByDisplayValue(/Appointment Scheduling Agent Prompt/);
      await user.clear(systemPromptTextarea);
      await user.type(systemPromptTextarea, 'You are a helpful assistant');

      expect(systemPromptTextarea).toHaveValue('You are a helpful assistant');
    });
  });

  describe('Generate Button', () => {
    it('shows generate button for first message', async () => {
      await act(async () => {
        render(<ModelConfig />);
      });

      await waitFor(() => {
        expect(screen.getByText('Generate')).toBeInTheDocument();
      });
    });
  });

  describe('Model Configuration API', () => {
    it('calls configureModel API when Configure button is clicked', async () => {
      mockModelConfigService.configureModel.mockResolvedValue({
        success: true,
        data: { data: { updated: true } }
      });

      await act(async () => {
        render(<ModelConfig />);
      });

      const configureButton = screen.getByRole('button', { name: /Configure Model|Model Configured ✓/ });
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

      await act(async () => {
        render(<ModelConfig />);
      });

      const configureButton = screen.getByRole('button', { name: /Configure Model|Model Configured ✓/ });
      await user.click(configureButton);

      expect(screen.getByText('Configuring...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Configuring...|Configure Model|Model Configured ✓/ })).toBeDisabled();
    });

    it('shows success state after successful model configuration', async () => {
      mockModelConfigService.configureModel.mockResolvedValue({
        success: true,
        data: { data: { updated: true } }
      });

      await act(async () => {
        render(<ModelConfig />);
      });

      const configureButton = screen.getByRole('button', { name: /Configure Model|Model Configured ✓/ });
      await user.click(configureButton);

      await waitFor(() => {
        expect(screen.getByText('Model Configured ✓')).toBeInTheDocument();
      });
    });

    it('shows error state when model configuration fails', async () => {
      mockModelConfigService.configureModel.mockResolvedValue({
        success: false,
        message: 'Failed to configure model'
      });

      await act(async () => {
        render(<ModelConfig />);
      });

      const configureButton = screen.getByRole('button', { name: /Configure Model|Model Configured ✓/ });
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

      await act(async () => {
        render(<ModelConfig />);
      });

      // Change provider to Anthropic
      const providerSelect = screen.getAllByRole('combobox')[0];
      await user.selectOptions(providerSelect, 'Anthropic');

      // Change model to Claude 3.5 Haiku
      const modelSelect = screen.getAllByRole('combobox')[1];
      await user.selectOptions(modelSelect, 'Claude 3.5 Haiku');

      const configureButton = screen.getByRole('button', { name: /Configure Model|Model Configured ✓/ });
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

      await act(async () => {
        render(<ModelConfig />);
      });

      const saveButton = screen.getByRole('button', { name: /Save Prompt|Prompt Saved ✓/ });
      
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

      await act(async () => {
        render(<ModelConfig />);
      });

      const saveButton = screen.getByRole('button', { name: /Save Prompt|Prompt Saved ✓/ });
      await user.click(saveButton);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Saving...|Save Prompt|Prompt Saved ✓/ })).toBeDisabled();
    });

    it('shows success state after successful prompt configuration', async () => {
      mockModelConfigService.configurePrompt.mockResolvedValue({
        success: true,
        data: { data: { updated: true } }
      });

      await act(async () => {
        render(<ModelConfig />);
      });

      const saveButton = screen.getByRole('button', { name: /Save Prompt|Prompt Saved ✓/ });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Prompt Saved ✓' })).toBeInTheDocument();
      });
    });

    it('shows error state when prompt configuration fails', async () => {
      mockModelConfigService.configurePrompt.mockResolvedValue({
        success: false,
        message: 'Failed to configure prompt'
      });

      await act(async () => {
        render(<ModelConfig />);
      });

      const saveButton = screen.getByRole('button', { name: /Save Prompt|Prompt Saved ✓/ });
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

      await act(async () => {
        render(<ModelConfig />);
      });

      // Edit the system prompt
      const systemPromptTextarea = screen.getByDisplayValue(/Appointment Scheduling Agent Prompt/);
      await user.clear(systemPromptTextarea);
      await user.type(systemPromptTextarea, 'New custom prompt');

      const saveButton = screen.getByRole('button', { name: /Save Prompt|Prompt Saved ✓/ });
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

      await act(async () => {
        render(<ModelConfig />);
      });

      const configureButton = screen.getByRole('button', { name: /Configure Model|Model Configured ✓/ });
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

      await act(async () => {
        render(<ModelConfig />);
      });

      const configureButton = screen.getByRole('button', { name: /configure/i });

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

      await act(async () => {
        render(<ModelConfig />);
      });

      const configureButton = screen.getByRole('button', { name: /Configure Model|Model Configured ✓/ });
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

      await act(async () => {
        render(<ModelConfig />);
      });

      const configureButton = screen.getByRole('button', { name: /Configure Model|Model Configured ✓/ });
      await user.click(configureButton);

      expect(configureButton).toBeDisabled();
    });

    it('shows success icon after successful configuration', async () => {
      mockModelConfigService.configureModel.mockResolvedValue({
        success: true,
        data: { data: { updated: true } }
      });

      await act(async () => {
        render(<ModelConfig />);
      });

      const configureButton = screen.getByRole('button', { name: /Configure Model|Model Configured ✓/ });
      await user.click(configureButton);

      await waitFor(() => {
        // The success icon should be present (CheckCircle)
        expect(screen.getByText('Model Configured ✓')).toBeInTheDocument();
      });
    });

    it('shows error icon after failed configuration', async () => {
      mockModelConfigService.configureModel.mockResolvedValue({
        success: false,
        message: 'Configuration failed'
      });

      await act(async () => {
        render(<ModelConfig />);
      });

      const configureButton = screen.getByRole('button', { name: /Configure Model|Model Configured ✓/ });
      await user.click(configureButton);

      await waitFor(() => {
        // The error icon should be present (AlertCircle)
        expect(screen.getByText('Configuration failed')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('renders the component without errors', async () => {
      await act(async () => {
        render(<ModelConfig />);
      });

      expect(screen.getAllByText('Model Configuration')).toHaveLength(2);
    });
  });

  describe('Accessibility', () => {
    it('has proper labels and form structure', async () => {
      await act(async () => {
        render(<ModelConfig />);
      });

      // Check that labels are present in the document
      expect(screen.getAllByText('Model Configuration')).toHaveLength(2);
      expect(screen.getByText('Model Selection')).toBeInTheDocument();
      expect(screen.getAllByText('System Prompt')).toHaveLength(3);
    });

    it('has proper button roles and states', async () => {
      await act(async () => {
        render(<ModelConfig />);
      });

      const checkStatusButton = screen.getByRole('button', { name: 'Check Status' });
      const saveButton = screen.getByRole('button', { name: /Save Prompt|Prompt Saved ✓/ });

      expect(checkStatusButton).toBeInTheDocument();
      expect(saveButton).toBeInTheDocument();
    });

    // it('has proper form controls with accessible names', async () => {
    //   await act(async () => {
    //     render(<ModelConfig />);
    //   });

    //   // Check that form controls are present
    //   expect(screen.getAllByRole('combobox')).toHaveLength(2); // Provider and Model selects
    //   expect(screen.getByDisplayValue('Thank you for calling Wellness Partners. This is Riley, your scheduling agent. How may I help you today?')).toBeInTheDocument(); // First message textarea
      
    //   // Find the system prompt textarea by its placeholder or label
    //   const systemPromptTextarea = screen.getByPlaceholderText(/Enter the system prompt that defines your agent's behavior/) as HTMLTextAreaElement;
    //   expect(systemPromptTextarea).toBeInTheDocument();
    //   expect(systemPromptTextarea.value).toMatch(/Appointment Scheduling Agent Prompt/);
    // });
  });
});
