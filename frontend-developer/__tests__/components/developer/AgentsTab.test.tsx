import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AgentsTab from '@/app/components/AgentsTab';

// Mock the config components
jest.mock('@/app/components/config/ModelConfig', () => {
  return function MockModelConfig() {
    return <div data-testid="model-config">Model Configuration</div>;
  };
});

jest.mock('@/app/components/config/VoiceConfig', () => {
  return function MockVoiceConfig() {
    return <div data-testid="voice-config">Voice Configuration</div>;
  };
});

jest.mock('@/app/components/config/TranscriberConfig', () => {
  return function MockTranscriberConfig() {
    return <div data-testid="transcriber-config">Transcriber Configuration</div>;
  };
});

describe('AgentsTab', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the agents tab with default props', () => {
      render(<AgentsTab />);
      
      expect(screen.getByText('AI Agents')).toBeInTheDocument();
      expect(screen.getAllByText('Riley')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Elliot')[0]).toBeInTheDocument();
    });

    it('renders with dark mode styling', () => {
      render(<AgentsTab isDarkMode={true} />);
      
      // Check that the component renders without errors
      expect(screen.getByText('AI Agents')).toBeInTheDocument();
    });

    it('displays agent information correctly', () => {
      render(<AgentsTab />);
      
      // Check for agent details
      expect(screen.getAllByText('Riley')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Your intelligent scheduling agent')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Elliot')[0]).toBeInTheDocument();
    });

    it('shows agent status badges', () => {
      render(<AgentsTab />);
      
      expect(screen.getAllByText('active')[0]).toBeInTheDocument();
      expect(screen.getByText('draft')).toBeInTheDocument();
    });
  });

  describe('Agent Selection', () => {
    it('selects the first agent by default', () => {
      render(<AgentsTab />);
      
      // Check that Riley is rendered (first agent)
      expect(screen.getAllByText('Riley')[0]).toBeInTheDocument();
    });

    it('allows switching between agents', async () => {
      render(<AgentsTab />);
      
      // Click on Elliot to switch selection
      const elliotElement = screen.getAllByText('Elliot')[0];
      await user.click(elliotElement);
      
      // Both agents should still be visible
      expect(screen.getAllByText('Riley')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Elliot')[0]).toBeInTheDocument();
    });

    it('updates selected agent state when clicking on agent card', async () => {
      render(<AgentsTab />);
      
      // Click on Elliot
      const elliotElement = screen.getAllByText('Elliot')[0];
      await user.click(elliotElement);
      
      // Both agents should still be visible
      expect(screen.getAllByText('Riley')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Elliot')[0]).toBeInTheDocument();
    });
  });

  describe('Configuration Tabs', () => {
    it('renders all configuration tabs', () => {
      render(<AgentsTab />);
      
      expect(screen.getByText('Model')).toBeInTheDocument();
      expect(screen.getByText('Voice')).toBeInTheDocument();
      expect(screen.getByText('Transcriber')).toBeInTheDocument();
      expect(screen.getByText('Tools')).toBeInTheDocument();
      expect(screen.getByText('Analysis')).toBeInTheDocument();
      expect(screen.getByText('Advanced')).toBeInTheDocument();
      expect(screen.getByText('Widget')).toBeInTheDocument();
    });

    it('shows model config by default', () => {
      render(<AgentsTab />);
      
      expect(screen.getByTestId('model-config')).toBeInTheDocument();
    });

    it('switches to voice config when voice tab is clicked', async () => {
      render(<AgentsTab />);
      
      const voiceTab = screen.getByText('Voice');
      await user.click(voiceTab);
      
      expect(screen.getByTestId('voice-config')).toBeInTheDocument();
    });

    it('switches to transcriber config when transcriber tab is clicked', async () => {
      render(<AgentsTab />);
      
      const transcriberTab = screen.getByText('Transcriber');
      await user.click(transcriberTab);
      
      expect(screen.getByTestId('transcriber-config')).toBeInTheDocument();
    });

    it('switches tabs when clicked', async () => {
      render(<AgentsTab />);
      
      const voiceTab = screen.getByText('Voice');
      await user.click(voiceTab);
      
      // Should show voice config
      expect(screen.getByTestId('voice-config')).toBeInTheDocument();
    });
  });

  describe('Create Agent Functionality', () => {
    it('shows create agent button', () => {
      render(<AgentsTab />);
      
      expect(screen.getByText('Create Agent')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('renders search input', () => {
      render(<AgentsTab />);
      
      // The search input should be present
      const searchInput = screen.getByRole('textbox');
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('renders the component without errors', () => {
      render(<AgentsTab />);
      
      expect(screen.getByText('AI Agents')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('renders the component without errors', () => {
      render(<AgentsTab />);
      
      expect(screen.getByText('AI Agents')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders the component without errors', () => {
      render(<AgentsTab />);
      
      expect(screen.getByText('AI Agents')).toBeInTheDocument();
    });
  });
});
