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
      console.log('🎤 [LiveKit] Connecting to agent:', agentName);
      console.log('🎤 [LiveKit] API Base URL:', API_BASE_URL);
      
      // Use the agent ID directly (should be the full UUID)
      const url = `${API_BASE_URL}/tokens/generate?agent_name=${agentName}`;
      console.log('🎤 [LiveKit] Request URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
      });

      console.log('🎤 [LiveKit] Response status:', response.status);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('🎤 [LiveKit] Error response:', errorData);
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          console.error('🎤 [LiveKit] Error response text:', errorText);
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data: TokenResponse = await response.json();
      console.log('🎤 [LiveKit] Connection details received:', {
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
      console.log('🎤 [LiveKit] Connection details set, initializing LiveKit room...');
    } catch (err) {
      console.error('🎤 [LiveKit] Failed to connect:', err);
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
    console.log('🎤 [LiveKit] Disconnecting from room...');
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
      <div style={{ display: 'none' }}>
        <LiveKitRoom
          key={`${connectionDetails.room_name}-${connectionDetails.participant_identity}`}
          token={connectionDetails.token}
          serverUrl={connectionDetails.livekit_url}
          className="livekit-room"
          audio={true}
          video={false}
          connect={true}
          onDisconnected={() => {
            console.log('🎤 [LiveKit] Room disconnected');
            disconnect();
          }}
          onConnected={() => {
            console.log('🎤 [LiveKit] Successfully connected to room');
          }}
          onError={(error) => {
            console.error('🎤 [LiveKit] Room error:', error);
          }}
          options={{
            adaptiveStream: true,
            dynacast: true,
            publishDefaults: {
              videoSimulcastLayers: [],
            },
          }}
        >
          <RoomStatusComponent onDisconnected={disconnect} isDarkMode={isDarkMode} isMuted={isMuted} />
          <RoomAudioRenderer />
          <AudioSubscriber />
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
  // Also track remote audio tracks (agent's audio)
  const remoteAudioTracks = useTracks(
    [{ source: Track.Source.Microphone, withPlaceholder: false }],
    { onlySubscribed: false }
  );

  // Log connection state changes
  useEffect(() => {
    console.log('🎤 [LiveKit] Connection state changed:', connectionState);
  }, [connectionState]);

  // Log participant changes
  useEffect(() => {
    console.log('🎤 [LiveKit] Participants changed:', {
      count: participants.length,
      participants: participants.map(p => ({
        identity: p.identity,
        name: p.name,
        audioTracks: p.audioTrackPublications.size
      }))
    });
    
    // Check for remote participants (agent)
    participants.forEach(participant => {
      if (participant.identity !== localParticipant?.identity) {
        console.log('🎤 [LiveKit] Remote participant (AGENT) detected:', {
          identity: participant.identity,
          name: participant.name,
          audioTracks: participant.audioTrackPublications.size
        });
        
        if (participant.audioTrackPublications.size === 0) {
          console.warn('🎤 [LiveKit] ⚠️ WARNING: Agent has NO audio tracks!');
        } else {
          participant.audioTrackPublications.forEach((publication, trackSid) => {
            console.log('🎤 [LiveKit] Agent audio track:', {
              trackSid,
              subscribed: publication.isSubscribed,
              muted: publication.isMuted,
              kind: publication.kind,
              hasTrack: !!publication.track
            });
          });
        }
      }
    });
  }, [participants, localParticipant]);


  // Handle microphone muting/unmuting
  useEffect(() => {
    if (localParticipant && typeof isMuted === 'boolean') {
      // Find the microphone track
      const micTrack = localParticipant.audioTrackPublications.values().next().value;
      
      if (micTrack) {
        if (isMuted) {
          console.log('🎤 [LiveKit] Muting microphone...');
          micTrack.mute();
        } else {
          console.log('🎤 [LiveKit] Unmuting microphone...');
          micTrack.unmute();
        }
      }
    }
  }, [localParticipant, isMuted]);

  // Monitor for room destruction and auto-disconnect
  // Only disconnect if agent was previously connected and then left
  const previousParticipantCountRef = useRef<number>(0);
  useEffect(() => {
    const currentParticipantCount = participants.length;
    
    // If we had more than 1 participant before (agent was connected) and now we only have 1 (agent left)
    if (
      connectionState === ConnectionState.Connected && 
      currentParticipantCount === 1 && 
      previousParticipantCountRef.current > 1
    ) {
      console.log('🎤 [LiveKit] Agent left the room. Will disconnect in 5 seconds if agent does not return...');
      // Agent left the room - wait 5 seconds before disconnecting to allow reconnection
      const timer = setTimeout(() => {
        if (participants.length === 1) {
          console.log('🎤 [LiveKit] Agent did not return, disconnecting...');
          onDisconnected();
        }
      }, 5000);

      previousParticipantCountRef.current = currentParticipantCount;
      return () => clearTimeout(timer);
    } else {
      // Update the previous count
      previousParticipantCountRef.current = currentParticipantCount;
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

// Component to ensure remote audio tracks are subscribed and played
function AudioSubscriber() {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const subscribedTracksRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const audioElements = audioElementsRef.current;
    const subscribedTracks = subscribedTracksRef.current;
    
    // Subscribe to all remote audio tracks
    participants.forEach(participant => {
      if (participant.identity !== localParticipant?.identity) {
        // This is a remote participant (agent)
        participant.audioTrackPublications.forEach((publication) => {
          // Ensure subscription - only subscribe once per track
          if (!publication.isSubscribed && !subscribedTracks.has(publication.trackSid)) {
            console.log('🎤 [LiveKit] Subscribing to agent audio track:', publication.trackSid);
            publication.setSubscribed(true);
            subscribedTracks.add(publication.trackSid);
          }
          
          // Attach track to audio element if not already attached
          if (publication.track && publication.isSubscribed && !audioElements.has(publication.trackSid)) {
            try {
              console.log('🎤 [LiveKit] Attaching agent audio track to audio element:', publication.trackSid);
              const audioElement = publication.track.attach();
              if (audioElement instanceof HTMLAudioElement) {
                audioElement.autoplay = true;
                audioElement.volume = 1.0;
                audioElement.setAttribute('data-track-sid', publication.trackSid);
                // Try to play the audio
                audioElement.play().then(() => {
                  console.log('🎤 [LiveKit] ✅ Agent audio track is now playing:', publication.trackSid);
                }).catch((err) => {
                  console.warn('🎤 [LiveKit] ⚠️ Auto-play was prevented for track:', publication.trackSid, err);
                });
                document.body.appendChild(audioElement);
                audioElements.set(publication.trackSid, audioElement);
                console.log('🎤 [LiveKit] Audio element created and added to DOM:', publication.trackSid);
              }
            } catch (error) {
              console.error('🎤 [LiveKit] ❌ Error attaching audio track:', publication.trackSid, error);
            }
          }
        });
      }
    });

    // Cleanup: remove audio elements for tracks that no longer exist
    const currentTrackSids = new Set<string>();
    participants.forEach(participant => {
      if (participant.identity !== localParticipant?.identity) {
        participant.audioTrackPublications.forEach((publication) => {
          if (publication.trackSid) {
            currentTrackSids.add(publication.trackSid);
          }
        });
      }
    });

    audioElements.forEach((audioElement, trackSid) => {
      if (!currentTrackSids.has(trackSid)) {
        console.log('🎤 [LiveKit] Removing audio element for track:', trackSid);
        try {
          audioElement.pause();
          audioElement.srcObject = null;
        } catch (e) {
          // Ignore cleanup errors
        }
        audioElement.remove();
        audioElements.delete(trackSid);
        subscribedTracks.delete(trackSid);
      }
    });

    // Cleanup on unmount
    return () => {
      audioElements.forEach((audioElement, trackSid) => {
        try {
          // Find the publication for this track
          let foundPublication = null;
          for (const participant of participants) {
            for (const publication of participant.audioTrackPublications.values()) {
              if (publication.trackSid === trackSid) {
                foundPublication = publication;
                break;
              }
            }
            if (foundPublication) break;
          }
          
          if (foundPublication?.track) {
            foundPublication.track.detach(audioElement);
          }
          audioElement.remove();
        } catch (error) {
          // Error cleaning up audio element
        }
      });
      audioElements.clear();
      subscribedTracks.clear();
    };
  }, [participants, localParticipant]);

  return null;
}
