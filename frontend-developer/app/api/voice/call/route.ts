import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, agentName, voiceProvider = 'cartesia' } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
// Use the new API credentials from environment variables
    const apiBaseUrl = process.env.NEXT_PUBLIC_LIVE_API_URL;
    if (!apiBaseUrl) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_LIVE_API_URL is not configured' }, { status: 500 });
    }
    const apiKey = process.env.NEXT_PUBLIC_LIVE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_LIVE_API_KEY is not configured' }, { status: 500 });
    }
    // Get voice configuration based on provider
    let voiceApiKey: string;
    let voiceId: string;
    let voiceUrl: string;

    if (voiceProvider === 'elevenlabs') {
      voiceApiKey = '';
      voiceId = process.env.NEXT_PUBLIC_ELEVEN_LABS_VOICE_ID || '';
      voiceUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    } else {
      // Default to Cartesia - API key handled by backend
      voiceApiKey = '';
      voiceId = process.env.NEXT_PUBLIC_CARTESIA_VOICE_ID || '';
      voiceUrl = 'https://api.cartesia.ai/v1/tts';
    }

    // Try the new API first, then fallback to direct voice providers
    let audioBase64: string;
    let audioMimeType: string = 'audio/mpeg';

    try {
      // First, try to use the new API endpoint for voice calls
      const newApiResponse = await fetch(`${apiBaseUrl}/api/voice/tts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: message,
          agent_name: agentName || 'newbot',
          voice_provider: voiceProvider
        })
      });

      if (newApiResponse.ok) {
        const newApiData = await newApiResponse.json();
        if (newApiData.audio) {
          audioBase64 = newApiData.audio;
        } else {
          throw new Error('No audio data in new API response');
        }
      } else {
        throw new Error(`New API error: ${newApiResponse.status}`);
      }
    } catch (newApiError) {
      // Fallback to direct voice provider APIs
      if (!voiceApiKey || !voiceId) {
        return NextResponse.json({ 
          error: `Voice API key or voice ID not configured for ${voiceProvider}. New API also failed.` 
        }, { status: 400 });
      }

      // Prepare request body based on provider
      let requestBody: any;
      let headers: any = {
        'Authorization': `Bearer ${voiceApiKey}`,
        'Content-Type': 'application/json'
      };

      if (voiceProvider === 'elevenlabs') {
        requestBody = {
          text: message,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        };
      } else {
        // Cartesia
        requestBody = {
          text: message,
          voice_id: voiceId,
          model: 'cartesia-tts-1', // Default Cartesia model
          output_format: 'mp3',
          speed: 1.0
        };
      }
      const response = await fetch(voiceUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json({ 
          error: `Voice API error: ${response.status} - ${errorText}` 
        }, { status: response.status });
      }

      // Get the audio data
      const audioBuffer = await response.arrayBuffer();
      audioBase64 = Buffer.from(audioBuffer).toString('base64');
    }

    return NextResponse.json({
      success: true,
      audio: `data:${audioMimeType};base64,${audioBase64}`,
      provider: voiceProvider,
      message: message,
      apiBaseUrl: apiBaseUrl
    });

  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Voice generation failed' 
    }, { status: 500 });
  }
}
