'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { ConnectionState, Track } from 'livekit-client';
import { logger } from '../../../lib/utils/logger';

// Lazy load LiveKit room component
const LiveKitRoomInternal = dynamic(
  () => import('./LiveKitRoomInternal'),
  { 
    ssr: false
  }
);

interface TokenResponse {
  token: string;
  room_name: string;
  agent_name: string;
  livekit_url: string;
  participant_identity: string;
  participant_name: string;
}

interface LiveKitRoomWrapperProps {
  connectionDetails: TokenResponse;
  onDisconnected: () => void;
  isDarkMode: boolean;
  isMuted?: boolean;
}

export default function LiveKitRoomWrapper({
  connectionDetails,
  onDisconnected,
  isDarkMode,
  isMuted
}: LiveKitRoomWrapperProps) {
  return (
    <div style={{ display: 'none' }}>
      <Suspense fallback={null}>
        <LiveKitRoomInternal
          connectionDetails={connectionDetails}
          onDisconnected={onDisconnected}
          isDarkMode={isDarkMode}
          isMuted={isMuted}
        />
      </Suspense>
    </div>
  );
}

