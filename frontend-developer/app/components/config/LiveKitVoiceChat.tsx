'use client';

import { useState, useEffect } from 'react';
import { 
  LiveKitRoom, 
  RoomAudioRenderer, 
  DisconnectButton, 
  useConnectionState, 
  useParticipants,
  useLocalParticipant,
  useTracks
} from '@livekit/components-react';
import { ConnectionState, Track } from 'livekit-client';

// Add LiveKit CSS styles
const liveKitStyles = `
  .livekit-room {
    width: 100%;
    height: 300px;
    border: 2px solid #e1e5e9;
    border-radius: 8px;
    margin-top: 20px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #f8f9fa;
  }

  .lk-button, .lk-disconnect-button {
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .lk-button:hover, .lk-disconnect-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(255, 107, 107, 0.3);
  }

  .lk-audio-track {
    display: none; /* Hide audio elements as they're not visual */
  }

  .lk-participant-tile {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 10px;
    margin: 5px;
  }

  .lk-room-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
`;

// Inject styles into the document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = liveKitStyles;
  document.head.appendChild(styleSheet);
}

interface TokenResponse {
  token: string;
  room_name: string;
  agent_name: string;
  livekit_url: string;
  participant_identity: string;
  participant_name: string;
}

interface LiveKitVoiceChatProps {
  agentName: string;
  isDarkMode: boolean;
}

export default function LiveKitVoiceChat({ agentName, isDarkMode }: LiveKitVoiceChatProps) {
  const [connectionDetails, setConnectionDetails] = useState<TokenResponse | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configuration - Use the same API as the working voice chat
  const API_BASE_URL = 'https://d2ref4sfj4q82j.cloudfront.net';
  const API_KEY = 'xpectrum-ai@123';

  const connectToAgent = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      console.log('🎤 Connecting to agent:', agentName);
      console.log('🎤 API Base URL:', API_BASE_URL);
      console.log('🎤 API Key:', API_KEY ? '***' : 'NOT_SET');
      
      // Use the agent ID directly (should be the full UUID)
      const url = `${API_BASE_URL}/tokens/generate?agent_name=${agentName}`;
      console.log('🎤 Request URL:', url);
      console.log('🎤 Agent ID:', agentName);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
      });

      console.log('🎤 Response status:', response.status);
      console.log('🎤 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          console.log('🎤 Error response data:', errorData);
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          console.log('🎤 Error response text:', errorText);
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data: TokenResponse = await response.json();
      console.log('🎤 Connection details received:', {
        token: data.token ? '***' : 'NOT_SET',
        room_name: data.room_name,
        agent_name: data.agent_name,
        livekit_url: data.livekit_url,
        participant_identity: data.participant_identity,
        participant_name: data.participant_name
      });
      
      // Validate the response
      if (!data.token || !data.livekit_url) {
        throw new Error('Invalid response: missing token or livekit_url');
      }
      
      setConnectionDetails(data);
    } catch (err) {
      console.error('🎤 Failed to connect:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to agent');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setConnectionDetails(null);
    setError(null);
  };

  if (connectionDetails) {
    return (
      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="text-center">
          <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            🎤 Voice Chat Active
          </h3>
          <div className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <p>Agent: <span className="font-medium">{connectionDetails.agent_name}</span></p>
            <p>Room: <span className="font-medium">{connectionDetails.room_name}</span></p>
          </div>
          
          <LiveKitRoom
            token={connectionDetails.token}
            serverUrl={connectionDetails.livekit_url}
            className="livekit-room"
            audio={true}
            video={false}
            connect={true}
            onDisconnected={disconnect}
            onConnected={() => console.log('🎤 LiveKit room connected successfully')}
            onError={(error) => console.error('🎤 LiveKit room error:', error)}
          >
            <RoomStatusComponent onDisconnected={disconnect} isDarkMode={isDarkMode} />
            <RoomAudioRenderer />
            <div className="mt-4">
              <DisconnectButton className={`px-4 py-2 rounded-lg text-white bg-red-500 hover:bg-red-600 transition-colors`}>
                End Voice Chat
              </DisconnectButton>
            </div>
          </LiveKitRoom>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
      <div className="text-center">
        <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          🎤 Voice Chat Preview
        </h3>
        <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Connect to have a real voice conversation with <span className="font-medium">{agentName}</span>
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            Error: {error}
          </div>
        )}

        {isConnecting && (
          <div className="mb-4 p-3 bg-blue-100 border border-blue-300 text-blue-700 rounded-lg">
            Connecting to agent...
          </div>
        )}

        <button
          onClick={connectToAgent}
          disabled={isConnecting}
          className={`px-6 py-3 rounded-lg text-white transition-colors ${
            isConnecting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700'
          }`}
        >
          {isConnecting ? 'Connecting...' : '🎤 Start Voice Chat'}
        </button>

        <div className={`mt-4 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>• Allow microphone access when prompted</p>
          <p>• Start speaking - the AI will respond with voice</p>
          <p>• Real-time conversation with {agentName}</p>
        </div>
      </div>
    </div>
  );
}

function RoomStatusComponent({ onDisconnected, isDarkMode }: { onDisconnected: () => void; isDarkMode: boolean }) {
  const connectionState = useConnectionState();
  const participants = useParticipants();
  const { localParticipant: _localParticipant } = useLocalParticipant();
  const tracks = useTracks([Track.Source.Microphone]);

  // Debug logging
  useEffect(() => {
    console.log('🎤 Connection state changed:', connectionState);
  }, [connectionState]);

  useEffect(() => {
    console.log('🎤 Participants changed:', participants.length, participants.map(p => ({ identity: p.identity, name: p.name })));
  }, [participants]);

  useEffect(() => {
    console.log('🎤 Tracks changed:', tracks.length, tracks.map(t => ({ source: t.source, publication: t.publication?.kind })));
  }, [tracks]);

  // Monitor for room destruction and auto-disconnect
  useEffect(() => {
    if (connectionState === ConnectionState.Connected && participants.length <= 1) {
      const timer = setTimeout(() => {
        if (participants.length <= 1) {
          console.log('🎤 Room destroyed - all remote participants left, disconnecting...');
          onDisconnected();
        }
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [connectionState, participants.length, onDisconnected]);

  const getStatusText = () => {
    switch (connectionState) {
      case ConnectionState.Connecting:
        return 'Connecting to room...';
      case ConnectionState.Connected:
        return 'Connected - Ready to talk!';
      case ConnectionState.Reconnecting:
        return 'Reconnecting...';
      case ConnectionState.Disconnected:
        return 'Disconnected';
      default:
        return 'Unknown status';
    }
  };

  const getStatusClass = () => {
    switch (connectionState) {
      case ConnectionState.Connected:
        return 'text-green-600';
      case ConnectionState.Connecting:
      case ConnectionState.Reconnecting:
        return 'text-blue-600';
      case ConnectionState.Disconnected:
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const isMicrophoneActive = tracks.some(track => 
    track.source === Track.Source.Microphone && !(track as any).isMuted
  );

  return (
    <div className="text-center">
      <div className={`font-medium ${getStatusClass()}`}>
        {getStatusText()}
      </div>
      
      {connectionState === ConnectionState.Connected && (
        <div className="mt-3">
          <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            👥 Participants: {participants.length} (including you)
          </div>
          
          {isMicrophoneActive && (
            <div className="text-green-600 font-medium text-sm mt-1">
              🎤 Microphone is active
            </div>
          )}
          
          {!isMicrophoneActive && (
            <div className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              🔇 Microphone is muted
            </div>
          )}
          
          <div className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Start speaking - the AI assistant will respond!
          </div>
        </div>
      )}
    </div>
  );
}
