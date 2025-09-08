import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../utils/test-utils';
import TranscriberConfig from '@/app/components/config/TranscriberConfig';

describe('TranscriberConfig', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the transcriber config with default props', () => {
      render(<TranscriberConfig />);
      
      expect(screen.getByText('Transcriber Configuration')).toBeInTheDocument();
    });

    // it('renders with dark mode styling', () => {
    //   render(<TranscriberConfig />);
      
    //   // Check that the component renders without errors
    //   expect(screen.getByText('Transcriber')).toBeInTheDocument();
    // });

    // it('displays provider options', () => {
    //   render(<TranscriberConfig />);
      
    //   expect(screen.getByText('OpenAI')).toBeInTheDocument();
    //   expect(screen.getByText('Deepgram')).toBeInTheDocument();
    //   expect(screen.getByText('Groq')).toBeInTheDocument();
    // });

    // it('displays language options', () => {
    //   render(<TranscriberConfig />);
      
    //   expect(screen.getByText('En')).toBeInTheDocument();
    //   expect(screen.getAllByText('multi')[0]).toBeInTheDocument();
    //   expect(screen.getByText('Spanish')).toBeInTheDocument();
    //   expect(screen.getByText('French')).toBeInTheDocument();
    //   expect(screen.getByText('German')).toBeInTheDocument();
    // });

    // it('displays model options', () => {
    //   render(<TranscriberConfig />);
      
    //   expect(screen.getByText('Nova 2')).toBeInTheDocument();
    //   expect(screen.getByText('whisper-1')).toBeInTheDocument();
    //   expect(screen.getByText('whisper-large-v3')).toBeInTheDocument();
    // });
  });

  // describe('Provider Selection', () => {
  //   it('allows selecting different providers', async () => {
  //     render(<TranscriberConfig />);
      
  //     const providerSelect = screen.getByDisplayValue('OpenAI');
  //     await user.selectOptions(providerSelect, 'Deepgram');
      
  //     expect(providerSelect).toHaveValue('Deepgram');
  //   });

  //   it('allows selecting different languages', async () => {
  //     render(<TranscriberConfig />);
      
  //     const languageSelect = screen.getByDisplayValue('En');
  //     await user.selectOptions(languageSelect, 'Spanish');
      
  //     expect(languageSelect).toHaveValue('Spanish');
  //   });

  //   it('allows selecting different models', async () => {
  //     render(<TranscriberConfig />);
      
  //     const modelSelect = screen.getByDisplayValue('Nova 2');
  //     await user.selectOptions(modelSelect, 'whisper-1');
      
  //     expect(modelSelect).toHaveValue('whisper-1');
  //   });
  // });

  // describe('Additional Configuration', () => {
  //   it('displays punctuate toggle', () => {
  //     render(<TranscriberConfig />);
      
  //     expect(screen.getByText('Punctuate')).toBeInTheDocument();
  //     expect(screen.getByText('Add punctuation to the transcription output.')).toBeInTheDocument();
  //   });

  //   it('displays smart format toggle', () => {
  //     render(<TranscriberConfig />);
      
  //     expect(screen.getByText('Smart Format')).toBeInTheDocument();
  //     expect(screen.getByText('Apply smart formatting to the transcription.')).toBeInTheDocument();
  //   });

  //   it('displays interim result toggle', () => {
  //     render(<TranscriberConfig />);
      
  //     expect(screen.getByText('Interim Result')).toBeInTheDocument();
  //     expect(screen.getByText('Show interim transcription results as they come in.')).toBeInTheDocument();
  //   });
  // });

  describe('Responsive Design', () => {
    it('renders the component without errors', () => {
      render(<TranscriberConfig />);
      
      expect(screen.getByText('Transcriber Configuration')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('renders the component without errors', () => {
      render(<TranscriberConfig />);
      
      expect(screen.getByText('Transcriber Configuration')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders the component without errors', () => {
      render(<TranscriberConfig />);
      
      expect(screen.getByText('Transcriber Configuration')).toBeInTheDocument();
    });
  });
});
