'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '../../../lib/utils/logger';
import LiveKitRoomWrapper from './LiveKitRoomWrapper';

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
      logger.log('🎤 [LiveKit] Connecting to agent:', agentName);
      logger.log('🎤 [LiveKit] API Base URL:', API_BASE_URL);
      
      // Use the agent ID directly (should be the full UUID)
      const url = `${API_BASE_URL}/tokens/generate?agent_name=${agentName}`;
      logger.log('🎤 [LiveKit] Request URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
      });

      logger.log('🎤 [LiveKit] Response status:', response.status);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          logger.error('🎤 [LiveKit] Error response:', errorData);
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          logger.error('🎤 [LiveKit] Error response text:', errorText);
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data: TokenResponse = await response.json();
      logger.log('🎤 [LiveKit] Connection details received:', {
        room_name: data.room_name,
        agent_name: data.agent_name,
        livekit_url: data.livekit_url,
        participant_identity: data.participant_identity,
        has_token: !!data.token
      });

      // Validate the response
      if (!data.token || !data.livekit_url) {
        throw new Error('Invalid response: missing token or livekit_url');
      }

      setConnectionDetails(data);
      logger.log('🎤 [LiveKit] Connection details set, initializing LiveKit room...');
    } catch (err) {
      logger.error('🎤 [LiveKit] Failed to connect:', err);
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

    // Only connect if:
    // 1. startCall was just triggered (transitioned from false to true)
    // 2. We don't already have connection details
    // 3. We're not currently connecting
    if (startCallTriggered && !connectionDetails && !isConnecting) {
      void connectToAgent();
    }
  }, [startCall, connectionDetails, isConnecting, connectToAgent]);

  const disconnect = useCallback(() => {
    logger.log('🎤 [LiveKit] Disconnecting from room...');
    setConnectionDetails(null);
    setError(null);
  }, []);

  // Respond to endCall prop - detect transition from false to true
  useEffect(() => {
    // Check if endCall transitioned from false to true
    const endCallTriggered = endCall && !previousEndCallRef.current;
    previousEndCallRef.current = endCall || false;

    if (endCallTriggered && (connectionDetails || isConnecting)) {
      disconnect();
    }
  }, [endCall, connectionDetails, isConnecting, disconnect]);

  // Memoize connection details to prevent unnecessary re-renders
  const connectionDetailsRef = useRef<TokenResponse | null>(null);
  useEffect(() => {
    if (connectionDetails) {
      connectionDetailsRef.current = connectionDetails;
    }
  }, [connectionDetails]);

  if (connectionDetails) {
    return (
      <LiveKitRoomWrapper
        connectionDetails={connectionDetails}
        onDisconnected={disconnect}
        isDarkMode={isDarkMode}
        isMuted={isMuted}
      />
    );
  }

  return null;
}
