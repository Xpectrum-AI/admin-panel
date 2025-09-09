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

    it('renders in edit mode by default', async () => {
      await act(async () => {
        render(<ModelConfig />);
      });

      expect(screen.getByText('✏️ Edit Mode')).toBeInTheDocument();
    });

    it('renders in view mode when isEditing is false', async () => {
      await act(async () => {
        render(<ModelConfig isEditing={false} />);
      });

      expect(screen.getByText('👁️ View Mode')).toBeInTheDocument();
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

    it('allows selecting different models', async () => {
      await act(async () => {
        render(<ModelConfig />);
      });

      const modelSelect = screen.getAllByRole('combobox')[1];
      await user.selectOptions(modelSelect, 'GPT-4o Mini');

      expect(modelSelect).toHaveValue('GPT-4o Mini');
    });
  });

  // describe('Text Inputs', () => {
  //   it('allows editing first message', async () => {
  //     await act(async () => {
  //       render(<ModelConfig />);
  //     });

  //     const firstMessageTextarea = screen.getByDisplayValue('Thank you for calling Wellness Partners. This is Riley, your scheduling agent. How may I help you today?');
  //     await user.tripleClick(firstMessageTextarea);
  //     await user.type(firstMessageTextarea, 'Hello, this is a test message');

  //     expect(firstMessageTextarea).toHaveValue('Hello, this is a test message');
  //   });

  //   it('allows editing system prompt', async () => {
  //     await act(async () => {
  //       render(<ModelConfig />);
  //     });

  //     const systemPromptTextarea = screen.getByDisplayValue(/Appointment Scheduling Agent Prompt/);
  //     await user.tripleClick(systemPromptTextarea);
  //     await user.type(systemPromptTextarea, 'You are a helpful assistant');

  //     expect(systemPromptTextarea).toHaveValue('You are a helpful assistant');
  //   });
  // });

  describe('Edit Mode', () => {
    it('enables inputs in edit mode', async () => {
      await act(async () => {
        render(<ModelConfig isEditing={true} />);
      });

      const firstMessageInput = screen.getByDisplayValue('Thank you for calling Wellness Partners. This is Riley, your scheduling agent. How may I help you today?');
      expect(firstMessageInput).not.toBeDisabled();
    });

    it('shows edit buttons in edit mode', async () => {
      await act(async () => {
        render(<ModelConfig isEditing={true} />);
      });

      expect(screen.getByRole('button', { name: /Configure Model/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Save Prompt/i })).toBeInTheDocument();
    });
  });

  describe('View Mode', () => {
    it('disables inputs in view mode', async () => {
      await act(async () => {
        render(<ModelConfig isEditing={false} />);
      });

      const firstMessageInput = screen.getByDisplayValue('Thank you for calling Wellness Partners. This is Riley, your scheduling agent. How may I help you today?');
      expect(firstMessageInput).toBeDisabled();
    });

    it('shows view buttons in view mode', async () => {
      await act(async () => {
        render(<ModelConfig isEditing={false} />);
      });

      expect(screen.getByRole('button', { name: /Check Status/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reset Status/i })).toBeInTheDocument();
    });
  });

  describe('Mode Switching', () => {
    it('switches between edit and view modes', async () => {
      const { rerender } = render(<ModelConfig isEditing={true} />);

      expect(screen.getByText('✏️ Edit Mode')).toBeInTheDocument();

      await act(async () => {
        rerender(<ModelConfig isEditing={false} />);
      });

      expect(screen.getByText('👁️ View Mode')).toBeInTheDocument();
    });
  });
});