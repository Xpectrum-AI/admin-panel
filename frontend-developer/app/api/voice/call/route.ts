import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, agentName, voiceProvider = 'cartesia' } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    console.log('🎤 Voice call request:', { message: message.substring(0, 50) + '...', agentName, voiceProvider });

    // Use the new API credentials from environment variables
    const apiBaseUrl = process.env.NEXT_PUBLIC_LIVE_API_URL || 'https://d3sgivh2kmd3c8.cloudfront.net';
    const apiKey = process.env.NEXT_PUBLIC_LIVE_API_KEY || 'xpectrum-ai@123';
    
    // Override with the correct values provided by user
    const finalApiBaseUrl = 'https://d3sgivh2kmd3c8.cloudfront.net';
    const finalApiKey = 'xpectrum-ai@123';
    
    console.log('🎤 Using API credentials:', { apiBaseUrl, apiKey: apiKey ? '***' : 'NOT_SET' });

    // Get voice configuration based on provider
    let voiceApiKey: string;
    let voiceId: string;
    let voiceUrl: string;

    if (voiceProvider === 'elevenlabs') {
      voiceApiKey = process.env.NEXT_PUBLIC_ELEVEN_LABS_API_KEY || '';
      voiceId = process.env.NEXT_PUBLIC_ELEVEN_LABS_VOICE_ID || '';
      voiceUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    } else {
      // Default to Cartesia - use the correct API key
      voiceApiKey = process.env.NEXT_PUBLIC_CARTESIA_API_KEY || 'sk_car_ARNxuXPontQGnghJPFxDQa';
      voiceId = process.env.NEXT_PUBLIC_CARTESIA_VOICE_ID || 'e8e5fffb-252c-436d-b842-8879b84445b6';
      voiceUrl = 'https://api.cartesia.ai/v1/tts';
    }

    // Try the new API first, then fallback to direct voice providers
    let audioBase64: string;
    let audioMimeType: string = 'audio/mpeg';

    try {
      // First, try to use the new API endpoint for voice calls
      console.log('🎤 Trying new API endpoint for voice call');
      
      const newApiResponse = await fetch(`${finalApiBaseUrl}/api/voice/tts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${finalApiKey}`,
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
          console.log('🎤 Voice generation successful via new API');
        } else {
          throw new Error('No audio data in new API response');
        }
      } else {
        throw new Error(`New API error: ${newApiResponse.status}`);
      }
    } catch (newApiError) {
      console.log('🎤 New API failed, falling back to direct voice providers:', newApiError);
      
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

      console.log('🎤 Making direct voice API request to:', voiceUrl);

      const response = await fetch(voiceUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🎤 Direct voice API error:', response.status, errorText);
        return NextResponse.json({ 
          error: `Voice API error: ${response.status} - ${errorText}` 
        }, { status: response.status });
      }

      // Get the audio data
      const audioBuffer = await response.arrayBuffer();
      audioBase64 = Buffer.from(audioBuffer).toString('base64');
      console.log('🎤 Direct voice generation successful, audio size:', audioBuffer.byteLength, 'bytes');
    }

    return NextResponse.json({
      success: true,
      audio: `data:${audioMimeType};base64,${audioBase64}`,
      provider: voiceProvider,
      message: message,
      apiBaseUrl: finalApiBaseUrl
    });

  } catch (error) {
    console.error('🎤 Voice call error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Voice generation failed' 
    }, { status: 500 });
  }
}
