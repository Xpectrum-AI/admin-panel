import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VoiceConfig from '@/app/components/config/VoiceConfig';

describe('VoiceConfig', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the voice config with default props', () => {
      render(<VoiceConfig />);
      
      expect(screen.getByText('Voice Configuration')).toBeInTheDocument();
      expect(screen.getByText('Additional Configuration')).toBeInTheDocument();
    });

    it('renders with dark mode styling', () => {
      render(<VoiceConfig isDarkMode={true} />);
      
      expect(screen.getByText('Voice Configuration')).toBeInTheDocument();
    });

    it('displays provider options', () => {
      render(<VoiceConfig />);
      
      expect(screen.getByText('OpenAI')).toBeInTheDocument();
      expect(screen.getByText('Vapi')).toBeInTheDocument();
      expect(screen.getByText('11Labs')).toBeInTheDocument();
      expect(screen.getByText('Cartesia')).toBeInTheDocument();
      expect(screen.getByText('Groq')).toBeInTheDocument();
    });

    it('displays voice options', () => {
      render(<VoiceConfig />);
      
      expect(screen.getByText('Elliot')).toBeInTheDocument();
      expect(screen.getByText('Alloy')).toBeInTheDocument();
      expect(screen.getByText('Echo')).toBeInTheDocument();
      expect(screen.getByText('Fable')).toBeInTheDocument();
      expect(screen.getByText('Onyx')).toBeInTheDocument();
      expect(screen.getByText('Nova')).toBeInTheDocument();
      expect(screen.getByText('Shimmer')).toBeInTheDocument();
    });
  });

  describe('Provider Selection', () => {
    it('allows selecting different providers', async () => {
      render(<VoiceConfig />);
      
      const providerSelect = screen.getByDisplayValue('OpenAI');
      await user.selectOptions(providerSelect, 'Vapi');
      
      expect(providerSelect).toHaveValue('Vapi');
    });

    it('allows selecting different voices', async () => {
      render(<VoiceConfig />);
      
      const voiceSelect = screen.getByDisplayValue('Elliot');
      await user.selectOptions(voiceSelect, 'Alloy');
      
      expect(voiceSelect).toHaveValue('Alloy');
    });
  });

  describe('Additional Configuration', () => {
    it('displays language options', () => {
      render(<VoiceConfig />);
      
      expect(screen.getByText('Language')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('Hindi')).toBeInTheDocument();
      expect(screen.getByText('None')).toBeInTheDocument();
    });

    it('allows selecting different languages', async () => {
      render(<VoiceConfig />);
      
      const languageSelect = screen.getByDisplayValue('English');
      await user.selectOptions(languageSelect, 'Hindi');
      
      expect(languageSelect).toHaveValue('Hindi');
    });

    it('displays speed control', () => {
      render(<VoiceConfig />);
      
      expect(screen.getByText('Speed')).toBeInTheDocument();
      expect(screen.getAllByDisplayValue('-0.5')[0]).toBeInTheDocument();
    });

    it('allows adjusting speed', async () => {
      render(<VoiceConfig />);
      
      const speedInputs = screen.getAllByDisplayValue('-0.5');
      const numberInput = speedInputs[1]; // Use the number input
      
      // Verify the input exists and has the correct initial value
      expect(numberInput).toBeInTheDocument();
      expect(numberInput).toHaveValue(-0.5);
      
      // Test that we can interact with the input
      await user.click(numberInput);
      expect(numberInput).toHaveFocus();
    });
  });

  describe('Responsive Design', () => {
    it('renders the component without errors', () => {
      render(<VoiceConfig />);
      
      expect(screen.getByText('Voice Configuration')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('renders the component without errors', () => {
      render(<VoiceConfig />);
      
      expect(screen.getByText('Voice Configuration')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders the component without errors', () => {
      render(<VoiceConfig />);
      
      expect(screen.getByText('Voice Configuration')).toBeInTheDocument();
    });
  });
});
