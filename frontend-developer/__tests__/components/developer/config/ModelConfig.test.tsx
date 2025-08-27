import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModelConfig from '@/app/components/config/ModelConfig';

describe('ModelConfig', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
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
  });

  describe('Provider Selection', () => {
    it('allows selecting different providers', async () => {
      render(<ModelConfig />);
      
      const providerSelect = screen.getByDisplayValue('OpenAI');
      await user.selectOptions(providerSelect, 'Anthropic');
      
      expect(providerSelect).toHaveValue('Anthropic');
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
      
      const firstMessageTextarea = screen.getByPlaceholderText('Enter the agent\'s first message...');
      await user.clear(firstMessageTextarea);
      await user.type(firstMessageTextarea, 'Hello, this is a test message');
      
      expect(firstMessageTextarea).toHaveValue('Hello, this is a test message');
    });

    it('allows editing system prompt', async () => {
      render(<ModelConfig />);
      
      const systemPromptTextarea = screen.getByPlaceholderText('Enter system prompt...');
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

  describe('Responsive Design', () => {
    it('renders the component without errors', () => {
      render(<ModelConfig />);
      
      expect(screen.getByText('Provider')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('renders the component without errors', () => {
      render(<ModelConfig />);
      
      expect(screen.getByText('Provider')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders the component without errors', () => {
      render(<ModelConfig />);
      
      expect(screen.getByText('Provider')).toBeInTheDocument();
    });
  });
});
