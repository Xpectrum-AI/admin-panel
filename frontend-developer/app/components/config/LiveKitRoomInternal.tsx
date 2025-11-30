'use client';

import { useEffect, useRef } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useParticipants,
  useLocalParticipant,
  useTracks
} from '@livekit/components-react';
import { ConnectionState, Track } from 'livekit-client';
import { logger } from '../../../lib/utils/logger';

interface TokenResponse {
  token: string;
  room_name: string;
  agent_name: string;
  livekit_url: string;
  participant_identity: string;
  participant_name: string;
}

interface LiveKitRoomInternalProps {
  connectionDetails: TokenResponse;
  onDisconnected: () => void;
  isDarkMode: boolean;
  isMuted?: boolean;
}

export default function LiveKitRoomInternal({
  connectionDetails,
  onDisconnected,
  isDarkMode,
  isMuted
}: LiveKitRoomInternalProps) {
  return (
    <LiveKitRoom
      key={`${connectionDetails.room_name}-${connectionDetails.participant_identity}`}
      token={connectionDetails.token}
      serverUrl={connectionDetails.livekit_url}
      className="livekit-room"
      audio={true}
      video={false}
      connect={true}
      onDisconnected={() => {
        logger.log('🎤 [LiveKit] Room disconnected');
        onDisconnected();
      }}
      onConnected={() => {
        logger.log('🎤 [LiveKit] Successfully connected to room');
      }}
      onError={(error) => {
        logger.error('🎤 [LiveKit] Room error:', error);
      }}
      options={{
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          videoSimulcastLayers: [],
        },
      }}
    >
      <RoomStatusComponent onDisconnected={onDisconnected} isDarkMode={isDarkMode} isMuted={isMuted} />
      <RoomAudioRenderer />
      <AudioSubscriber />
    </LiveKitRoom>
  );
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
    logger.log('🎤 [LiveKit] Connection state changed:', connectionState);
  }, [connectionState]);

  // Log participant changes
  useEffect(() => {
    logger.log('🎤 [LiveKit] Participants changed:', {
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
        logger.log('🎤 [LiveKit] Remote participant (AGENT) detected:', {
          identity: participant.identity,
          name: participant.name,
          audioTracks: participant.audioTrackPublications.size
        });
        
        if (participant.audioTrackPublications.size === 0) {
          logger.warn('🎤 [LiveKit] ⚠️ WARNING: Agent has NO audio tracks!');
        } else {
          participant.audioTrackPublications.forEach((publication, trackSid) => {
            logger.log('🎤 [LiveKit] Agent audio track:', {
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
          logger.log('🎤 [LiveKit] Muting microphone...');
          micTrack.mute();
        } else {
          logger.log('🎤 [LiveKit] Unmuting microphone...');
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
      logger.log('🎤 [LiveKit] Agent left the room. Will disconnect in 5 seconds if agent does not return...');
      // Agent left the room - wait 5 seconds before disconnecting to allow reconnection
      const timer = setTimeout(() => {
        if (participants.length === 1) {
          logger.log('🎤 [LiveKit] Agent did not return, disconnecting...');
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
        return 'text-green-600';
      case ConnectionState.Disconnected:
        return 'text-red-600';
      default:
        return 'text-green-600';
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
            logger.log('🎤 [LiveKit] Subscribing to agent audio track:', publication.trackSid);
            publication.setSubscribed(true);
            subscribedTracks.add(publication.trackSid);
          }
          
          // Attach track to audio element if not already attached
          if (publication.track && publication.isSubscribed && !audioElements.has(publication.trackSid)) {
            try {
              logger.log('🎤 [LiveKit] Attaching agent audio track to audio element:', publication.trackSid);
              const audioElement = publication.track.attach();
              if (audioElement instanceof HTMLAudioElement) {
                audioElement.autoplay = true;
                audioElement.volume = 1.0;
                audioElement.setAttribute('data-track-sid', publication.trackSid);
                // Try to play the audio
                audioElement.play().then(() => {
                  logger.log('🎤 [LiveKit] ✅ Agent audio track is now playing:', publication.trackSid);
                }).catch((err) => {
                  logger.warn('🎤 [LiveKit] ⚠️ Auto-play was prevented for track:', publication.trackSid, err);
                });
                document.body.appendChild(audioElement);
                audioElements.set(publication.trackSid, audioElement);
                logger.log('🎤 [LiveKit] Audio element created and added to DOM:', publication.trackSid);
              }
            } catch (error) {
              logger.error('🎤 [LiveKit] ❌ Error attaching audio track:', publication.trackSid, error);
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
        logger.log('🎤 [LiveKit] Removing audio element for track:', trackSid);
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

