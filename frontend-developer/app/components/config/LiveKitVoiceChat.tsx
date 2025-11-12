'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  startCall?: boolean; // when true, start connection
  endCall?: boolean;   // when true, end connection
  isMuted?: boolean;   // when true, mute microphone
}

export default function LiveKitVoiceChat({ agentName, isDarkMode, startCall, endCall, isMuted }: LiveKitVoiceChatProps) {
  const [connectionDetails, setConnectionDetails] = useState<TokenResponse | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousStartCallRef = useRef<boolean>(false);
  const previousEndCallRef = useRef<boolean>(false);

  const connectToAgent = useCallback(async () => {
    // Configuration - Use environment variables
    const API_BASE_URL = process.env.NEXT_PUBLIC_LIVE_API_URL;
    if (!API_BASE_URL) {
      setError('NEXT_PUBLIC_LIVE_API_URL is not configured');
      setIsConnecting(false);
      return;
    }
    const API_KEY = process.env.NEXT_PUBLIC_LIVE_API_KEY;
    if (!API_KEY) {
      setError('NEXT_PUBLIC_LIVE_API_KEY is not configured');
      setIsConnecting(false);
      return;
    }
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
  }, [agentName]);

  // Respond to startCall prop - detect transition from false to true
  useEffect(() => {
    // Check if startCall transitioned from false to true
    const startCallTriggered = startCall && !previousStartCallRef.current;
    previousStartCallRef.current = startCall || false;

    if (startCallTriggered && !connectionDetails && !isConnecting) {
      console.log('🎤 startCall triggered, initiating connection...');
      void connectToAgent();
    }
  }, [startCall, connectionDetails, isConnecting, connectToAgent]);

  const disconnect = useCallback(() => {
    setConnectionDetails(null);
    setError(null);
  }, []);

  // Respond to endCall prop - detect transition from false to true
  useEffect(() => {
    // Check if endCall transitioned from false to true
    const endCallTriggered = endCall && !previousEndCallRef.current;
    previousEndCallRef.current = endCall || false;

    if (endCallTriggered && (connectionDetails || isConnecting)) {
      console.log('🎤 endCall triggered, disconnecting...');
      disconnect();
    }
  }, [endCall, connectionDetails, isConnecting, disconnect]);

  if (connectionDetails) {
    return (
      <div style={{ display: 'none' }}>
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
          <RoomStatusComponent onDisconnected={disconnect} isDarkMode={isDarkMode} isMuted={isMuted} />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    );
  }

  return null;
}

function RoomStatusComponent({ onDisconnected, isDarkMode, isMuted }: { onDisconnected: () => void; isDarkMode: boolean; isMuted?: boolean }) {
  const connectionState = useConnectionState();
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
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

  // Handle microphone muting/unmuting
  useEffect(() => {
    if (localParticipant && typeof isMuted === 'boolean') {
      console.log('🎤 Mute state changed:', isMuted);
      
      // Find the microphone track
      const micTrack = localParticipant.audioTrackPublications.values().next().value;
      
      if (micTrack) {
        if (isMuted) {
          console.log('🎤 Muting microphone...');
          micTrack.mute();
        } else {
          console.log('🎤 Unmuting microphone...');
          micTrack.unmute();
        }
      }
    }
  }, [localParticipant, isMuted]);

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

  return null;
}
